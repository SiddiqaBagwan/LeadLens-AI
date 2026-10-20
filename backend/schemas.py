from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str

class FactorAssessment(BaseModel):
    score: Optional[float] = Field(
        default=None,
        description="Factor score from 0.0 to 100.0, or null if insufficient evidence / unknown"
    )
    confidence: Optional[float] = Field(
        default=0.0,
        description="Confidence level from 0.0 to 1.0"
    )
    evidence: List[str] = Field(
        default_factory=list,
        description="Direct quotes or explicit transcript observations supporting this assessment"
    )
    explanation: str = Field(
        default="",
        description="Concise reasoning explaining why this score was assigned or why it is unknown"
    )

    @field_validator("score")
    @classmethod
    def validate_score(cls, v):
        if v is not None:
            if v < 0 or v > 100:
                raise ValueError(f"Factor score must be between 0 and 100, got {v}")
            return float(v)
        return None

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v):
        if v is not None:
            return max(0.0, min(1.0, float(v)))
        return 0.0

class GeminiAnalysisResult(BaseModel):
    sentiment: str = Field(description="Customer sentiment: Positive | Neutral | Negative")
    sentiment_explanation: str = Field(description="Detailed factual reasoning based on customer statements")
    summary: str = Field(description="Concise executive conversation summary and outcome")

    # Six scoring dimensions
    buying_intent: FactorAssessment = Field(description="Factor 1: Buying Intent (0-100, weight 35%)")
    budget_fit: FactorAssessment = Field(description="Factor 2: Budget Fit (0-100 or null, weight 20%)")
    urgency_timeline: FactorAssessment = Field(description="Factor 3: Urgency & Timeline (0-100 or null, weight 15%)")
    product_fit: FactorAssessment = Field(description="Factor 4: Product Fit (0-100 or null, weight 15%)")
    engagement: FactorAssessment = Field(description="Factor 5: Engagement (0-100 or null, weight 15%)")
    objections_impact: FactorAssessment = Field(description="Factor 6: Objections Impact (0-100 or null, negative 20% - higher means more severe unresolved barriers)")

    customer_needs: List[str] = Field(default_factory=list, description="Core customer requirements and pain points")
    buying_signals: List[str] = Field(default_factory=list, description="Explicit indicators of purchase or pilot interest")
    objections: List[str] = Field(default_factory=list, description="Explicit customer hesitations, pricing, or compliance roadblocks")
    recommended_next_action: str = Field(description="Actionable sales recommendation based on conversation evidence")

class PurchaseFactorDetail(BaseModel):
    name: str
    variable: str
    weight: float
    score: Optional[float] = None
    is_unknown: bool = False
    confidence: float = 0.0
    evidence: List[str] = Field(default_factory=list)
    explanation: str = ""

class PurchasePotentialResult(BaseModel):
    score: Optional[int] = Field(default=None, description="Rounded display score (0-100) or null if insufficient evidence")
    score_raw: Optional[float] = Field(default=None, description="Unrounded internal calculation result")
    score_label: str = Field(description="Low Potential | Early Interest | Potential Lead | High Potential | Very High Potential | Insufficient Evidence")
    positive_score: Optional[float] = None
    objection_penalty: Optional[float] = None
    objection_penalty_applied: bool = False
    formula: str = "S_raw = (0.35 * B) + (0.20 * F) + (0.15 * U) + (0.15 * P) + (0.15 * E) - (0.20 * O)"
    weights_used: Dict[str, float] = Field(default_factory=dict)
    factors: Dict[str, Any] = Field(default_factory=dict)
    explanation: str = ""
    evidence: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)

class CallRecord(BaseModel):
    call_id: str
    call_label: str = ""
    original_filename: str
    file_path: str
    file_size_bytes: int
    duration_seconds: Optional[float] = None
    duration_formatted: Optional[str] = None
    analysis_status: str = "pending"  # pending | processing | completed | failed
    error_message: Optional[str] = None
    transcript: Optional[str] = None
    transcript_segments: Optional[List[TranscriptSegment]] = None
    sentiment: Optional[str] = None
    sentiment_explanation: Optional[str] = None
    summary: Optional[str] = None
    customer_needs: Optional[List[str]] = None
    buying_signals: Optional[List[str]] = None
    objections: Optional[List[str]] = None
    recommended_next_action: Optional[str] = None
    evidence: Optional[List[str]] = None

    # Purchase Potential fields
    purchase_likelihood: Optional[int] = None  # retained for backward compatibility (maps to purchase_potential_score)
    purchase_potential_score: Optional[int] = None
    purchase_score_raw: Optional[float] = None
    purchase_score_label: Optional[str] = None
    purchase_factors: Optional[Dict[str, Any]] = None
    purchase_explanation: Optional[str] = None
    purchase_calculation: Optional[Dict[str, Any]] = None

    analysis_timestamp: Optional[str] = None
    report_status: str = "unavailable"  # available | unavailable
    audio_url: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    whisper_available: bool
    gemini_configured: bool
    recordings_detected: int
    analyses_cached: int
