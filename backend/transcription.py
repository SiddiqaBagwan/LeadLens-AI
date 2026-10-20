import os
import sys

# Prevent OpenMP runtime collision on Windows Anaconda environments
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from pathlib import Path
from typing import Dict, Any, List, Tuple
from .schemas import TranscriptSegment

# Singleton Whisper model holder
_whisper_model = None
_loaded_model_size = None

def get_media_duration_and_verify(file_path: str) -> float:
    """
    Verifies that the media file exists, has valid audio streams,
    and extracts its duration in seconds using PyAV.
    """
    import av
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Media file not found: {file_path}")
    
    container = av.open(file_path)
    audio_streams = [s for s in container.streams if s.type == "audio"]
    if not audio_streams:
        raise ValueError(f"No audio stream found in {file_path}")
    
    # Calculate duration
    duration = 0.0
    if container.duration:
        duration = float(container.duration) / 1000000.0
    elif audio_streams[0].duration:
        stream = audio_streams[0]
        duration = float(stream.duration * stream.time_base)
    
    container.close()
    return round(duration, 2)

def get_whisper_model():
    """
    Initializes or retrieves the cached WhisperModel instance.
    Runs on CPU with INT8 or FP32 computation for broad Windows compatibility.
    """
    global _whisper_model, _loaded_model_size
    from faster_whisper import WhisperModel
    
    model_size = os.getenv("WHISPER_MODEL", "base").strip() or "base"
    
    if _whisper_model is None or _loaded_model_size != model_size:
        try:
            _whisper_model = WhisperModel(model_size, device="cpu", compute_type="int8")
        except Exception:
            _whisper_model = WhisperModel(model_size, device="cpu", compute_type="float32")
        _loaded_model_size = model_size
        
    return _whisper_model

def transcribe_audio(file_path: str) -> Tuple[str, List[TranscriptSegment], float]:
    """
    Transcribes the specified audio/video recording using faster-whisper.
    Returns: (full_transcript_text, list_of_segments, duration_seconds)
    """
    duration = get_media_duration_and_verify(file_path)
    model = get_whisper_model()
    
    segments_raw, info = model.transcribe(
        file_path,
        beam_size=5,
        word_timestamps=False,
        vad_filter=True,
    )
    
    segments: List[TranscriptSegment] = []
    text_parts = []
    
    for seg in segments_raw:
        clean_text = seg.text.strip()
        if clean_text:
            text_parts.append(clean_text)
            segments.append(
                TranscriptSegment(
                    start=round(seg.start, 2),
                    end=round(seg.end, 2),
                    text=clean_text
                )
            )
            
    full_transcript = " ".join(text_parts).strip()
    if not full_transcript:
        raise ValueError(f"Transcription yielded no discernible speech from {file_path}")
        
    return full_transcript, segments, duration
