import os
import json
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .schemas import (
    CallRecord,
    HealthResponse,
    GeminiAnalysisResult,
    PurchasePotentialResult,
)
from .transcription import transcribe_audio, get_media_duration_and_verify
from .ai_analysis import analyze_transcript, GeminiConfigurationError, GeminiAPIError
from .purchase_scoring import calculate_purchase_potential
from .report_generator import generate_call_pdf_report

PROJECT_ROOT = Path(__file__).parent.parent.resolve()
SAMPLE_CALLS_DIR = PROJECT_ROOT / "sample_calls"
DATA_DIR = PROJECT_ROOT / "data"
ANALYSES_FILE = DATA_DIR / "analyses.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)

# Stable mappings per requirements:
# call1.mp4 -> CALL-001 (Call #001)
# call2.mp4 -> CALL-002 (Call #002)
# call3.mp4 -> CALL-003 (Call #003)
# call4.mp4 -> CALL-004 (Call #004)
# No invented customer identities or unsupported company details
STABLE_CALL_CONFIG = [
    {
        "call_id": "CALL-001",
        "call_label": "Call #001",
        "filename": "call1.mp4",
    },
    {
        "call_id": "CALL-002",
        "call_label": "Call #002",
        "filename": "call2.mp4",
    },
    {
        "call_id": "CALL-003",
        "call_label": "Call #003",
        "filename": "call3.mp4",
    },
    {
        "call_id": "CALL-004",
        "call_label": "Call #004",
        "filename": "call4.mp4",
    },
]

CALL_MAP = {cfg["call_id"]: cfg for cfg in STABLE_CALL_CONFIG}

# In-memory lock to prevent concurrent duplicate analyses on the same call
_analysis_locks: Dict[str, asyncio.Lock] = {
    cfg["call_id"]: asyncio.Lock() for cfg in STABLE_CALL_CONFIG
}

app = FastAPI(
    title="LeadLens Call Analysis API",
    description="Backend API for speech-to-text, Gemini AI conversation intelligence, Purchase Potential scoring, and PDF reporting.",
    version="2.0.0",
)

# CORS configuration
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").strip()
allowed_origins = [frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "Accept-Ranges", "Content-Disposition"],
)


def load_analyses_storage() -> Dict[str, Any]:
    if not ANALYSES_FILE.exists():
        return {}
    try:
        with open(ANALYSES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_analyses_storage(data: Dict[str, Any]) -> None:
    temp_file = ANALYSES_FILE.with_suffix(".tmp")
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    temp_file.replace(ANALYSES_FILE)


def build_call_record(call_id: str, stored_data: Optional[Dict[str, Any]] = None) -> CallRecord:
    cfg = CALL_MAP[call_id]
    file_path = SAMPLE_CALLS_DIR / cfg["filename"]
    file_exists = file_path.exists()
    size_bytes = file_path.stat().st_size if file_exists else 0

    record = CallRecord(
        call_id=call_id,
        call_label=cfg.get("call_label", f"Call #{call_id.replace('CALL-', '')}"),
        original_filename=cfg["filename"],
        file_path=str(file_path),
        file_size_bytes=size_bytes,
        analysis_status="pending",
        audio_url=f"/api/calls/{call_id}/audio",
    )

    if stored_data:
        for k, v in stored_data.items():
            if hasattr(record, k):
                setattr(record, k, v)
        if record.analysis_status == "completed":
            record.report_status = "available"

    # Fill duration if unanalyzed but file exists
    if record.duration_seconds is None and file_exists:
        try:
            dur = get_media_duration_and_verify(str(file_path))
            record.duration_seconds = dur
            m, s = divmod(int(dur), 60)
            record.duration_formatted = f"{m}:{s:02d}"
        except Exception:
            pass

    return record


@app.get("/api/health", response_model=HealthResponse)
def get_health():
    analyses = load_analyses_storage()
    completed_count = sum(1 for v in analyses.values() if v.get("analysis_status") == "completed")
    existing_files = sum(1 for cfg in STABLE_CALL_CONFIG if (SAMPLE_CALLS_DIR / cfg["filename"]).exists())
    has_gemini = bool(os.getenv("GEMINI_API_KEY", "").strip())

    return HealthResponse(
        status="ok",
        whisper_available=True,
        gemini_configured=has_gemini,
        recordings_detected=existing_files,
        analyses_cached=completed_count,
    )


@app.get("/api/calls", response_model=List[CallRecord])
def list_calls():
    analyses = load_analyses_storage()
    records = []
    for cfg in STABLE_CALL_CONFIG:
        cid = cfg["call_id"]
        stored = analyses.get(cid)
        records.append(build_call_record(cid, stored))
    return records


@app.get("/api/calls/{call_id}", response_model=CallRecord)
def get_call(call_id: str):
    if call_id not in CALL_MAP:
        raise HTTPException(status_code=404, detail=f"Call '{call_id}' not found.")
    analyses = load_analyses_storage()
    stored = analyses.get(call_id)
    return build_call_record(call_id, stored)


@app.get("/api/calls/{call_id}/audio")
def stream_audio(call_id: str, request: Request):
    if call_id not in CALL_MAP:
        raise HTTPException(status_code=404, detail=f"Call '{call_id}' not found.")

    cfg = CALL_MAP[call_id]
    file_path = SAMPLE_CALLS_DIR / cfg["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Audio file '{cfg['filename']}' not found on server.")

    file_size = file_path.stat().st_size
    range_header = request.headers.get("range")

    # Support HTTP 206 Partial Content range requests for seekable HTML5 audio
    if range_header:
        byte_range = range_header.replace("bytes=", "").split("-")
        start = int(byte_range[0])
        end = int(byte_range[1]) if byte_range[1] else file_size - 1
        content_length = (end - start) + 1

        def iter_chunk():
            with open(file_path, "rb") as f:
                f.seek(start)
                bytes_left = content_length
                while bytes_left > 0:
                    chunk = f.read(min(bytes_left, 65536))
                    if not chunk:
                        break
                    bytes_left -= len(chunk)
                    yield chunk

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(content_length),
            "Content-Type": "audio/mp4",
        }
        return StreamingResponse(iter_chunk(), status_code=206, headers=headers)

    # Standard full stream
    def iter_file():
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                yield chunk

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
        "Content-Type": "audio/mp4",
    }
    return StreamingResponse(iter_file(), headers=headers)


@app.post("/api/calls/{call_id}/analyze")
async def analyze_call(call_id: str):
    if call_id not in CALL_MAP:
        raise HTTPException(status_code=404, detail=f"Call ID '{call_id}' is invalid.")

    cfg = CALL_MAP[call_id]
    file_path = SAMPLE_CALLS_DIR / cfg["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Recording file '{cfg['filename']}' is missing.")

    lock = _analysis_locks[call_id]
    if lock.locked():
        raise HTTPException(status_code=409, detail=f"Call '{call_id}' is currently being analyzed. Please wait.")

    async with lock:
        analyses = load_analyses_storage()
        stored = analyses.get(call_id, {})

        # Step 1: Speech-to-Text via Whisper (cached if valid transcript exists)
        transcript = stored.get("transcript")
        segments = stored.get("transcript_segments")
        duration = stored.get("duration_seconds")

        if not transcript:
            try:
                loop = asyncio.get_running_loop()
                transcript, seg_objs, duration = await loop.run_in_executor(
                    None, transcribe_audio, str(file_path)
                )
                segments = [s.model_dump() for s in seg_objs]
            except Exception as e:
                error_detail = f"Whisper speech-to-text failed: {str(e)}"
                stored["analysis_status"] = "failed"
                stored["error_message"] = error_detail
                analyses[call_id] = stored
                save_analyses_storage(analyses)
                raise HTTPException(status_code=500, detail=error_detail)

        # Step 2: Gemini AI Analysis
        try:
            loop = asyncio.get_running_loop()
            gemini_result: GeminiAnalysisResult = await loop.run_in_executor(
                None, analyze_transcript, transcript
            )
        except GeminiConfigurationError as e:
            stored["transcript"] = transcript
            stored["transcript_segments"] = segments
            stored["duration_seconds"] = duration
            stored["analysis_status"] = "failed"
            stored["error_message"] = str(e)
            analyses[call_id] = stored
            save_analyses_storage(analyses)
            raise HTTPException(status_code=400, detail=str(e))
        except GeminiAPIError as e:
            stored["transcript"] = transcript
            stored["transcript_segments"] = segments
            stored["duration_seconds"] = duration
            stored["analysis_status"] = "failed"
            stored["error_message"] = str(e)
            analyses[call_id] = stored
            save_analyses_storage(analyses)
            raise HTTPException(status_code=502, detail=str(e))

        # Step 3: Purchase Potential Calculation in Python
        try:
            scoring_res: PurchasePotentialResult = calculate_purchase_potential(gemini_result)
        except Exception as e:
            error_detail = f"Purchase potential calculation failed: {str(e)}"
            stored["analysis_status"] = "failed"
            stored["error_message"] = error_detail
            analyses[call_id] = stored
            save_analyses_storage(analyses)
            raise HTTPException(status_code=500, detail=error_detail)

        # Assemble full analyzed call record
        m, s = divmod(int(duration or 0), 60)
        dur_formatted = f"{m}:{s:02d}"

        stored.update({
            "call_id": call_id,
            "call_label": cfg.get("call_label", f"Call #{call_id.replace('CALL-', '')}"),
            "original_filename": cfg["filename"],
            "file_size_bytes": file_path.stat().st_size,
            "duration_seconds": duration,
            "duration_formatted": dur_formatted,
            "analysis_status": "completed",
            "error_message": None,
            "transcript": transcript,
            "transcript_segments": segments,
            "sentiment": gemini_result.sentiment,
            "sentiment_explanation": gemini_result.sentiment_explanation,
            "summary": gemini_result.summary,
            "customer_needs": gemini_result.customer_needs,
            "buying_signals": gemini_result.buying_signals,
            "objections": gemini_result.objections,
            "recommended_next_action": gemini_result.recommended_next_action,
            "evidence": scoring_res.evidence,
            "purchase_likelihood": scoring_res.score,
            "purchase_potential_score": scoring_res.score,
            "purchase_score_raw": scoring_res.score_raw,
            "purchase_score_label": scoring_res.score_label,
            "purchase_factors": scoring_res.factors,
            "purchase_explanation": scoring_res.explanation,
            "purchase_calculation": scoring_res.model_dump(),
            "analysis_timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "report_status": "available",
            "audio_url": f"/api/calls/{call_id}/audio",
        })

        analyses[call_id] = stored
        save_analyses_storage(analyses)

        return stored


@app.get("/api/calls/{call_id}/report")
def download_call_report(call_id: str):
    if call_id not in CALL_MAP:
        raise HTTPException(status_code=404, detail=f"Call '{call_id}' not found.")

    analyses = load_analyses_storage()
    stored = analyses.get(call_id)
    if not stored or stored.get("analysis_status") != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Report unavailable for call '{call_id}'. Please analyze the recording before downloading.",
        )

    record = build_call_record(call_id, stored)

    try:
        pdf_bytes = generate_call_pdf_report(record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF report generation failed: {str(e)}")

    filename = f"LeadLens_{call_id}_Report.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )
