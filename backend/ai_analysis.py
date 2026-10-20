import os
import json
from dotenv import load_dotenv
from pathlib import Path
from google import genai
from google.genai import types
from .schemas import GeminiAnalysisResult

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

class GeminiConfigurationError(Exception):
    """Raised when GEMINI_API_KEY is not configured."""
    pass

class GeminiAPIError(Exception):
    """Raised when Gemini API request fails or returns invalid response."""
    pass

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise GeminiConfigurationError(
            "GEMINI_API_KEY is missing. Please set it in backend/.env to enable AI conversation analysis."
        )
    return genai.Client(api_key=api_key)

def analyze_transcript(transcript: str) -> GeminiAnalysisResult:
    """
    Calls the Gemini API to analyze the transcribed call dialogue.
    Enforces structured Pydantic output according to LeadLens specifications:
    - 6 scoring dimensions (Buying Intent, Budget Fit, Urgency & Timeline, Product Fit, Engagement, Objections Impact)
    - Sentiment analysis (separate from purchase potential)
    - Factual grounded evidence and verbatim quote snippets
    - Customer needs, buying signals, objections, and recommended next action
    - No invented customer identities or company information
    """
    if not transcript or not transcript.strip():
        raise ValueError("Cannot analyze empty transcript.")

    client = get_gemini_client()
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"

    prompt = f"""
You are the AI conversation intelligence engine for LeadLens.
Analyze the following customer sales/support call transcript thoroughly, objectively, and factually.

CRITICAL INSTRUCTIONS:
1. Ground every finding strictly in the actual transcript. Do NOT invent customer names, company names, budgets, or product capabilities that are not explicitly stated.
2. Distinguish customer utterances from salesperson utterances. Evaluate the CUSTOMER'S perspective, tone, and explicit statements.
3. SENTIMENT IS SEPARATE FROM PURCHASE POTENTIAL:
   - Sentiment reflects emotional tone and attitude (Positive, Neutral, Negative).
   - A customer can be polite/positive yet not intending to buy, or frustrated by an issue while still actively intending to purchase.
4. SIX SCORING DIMENSIONS GUIDANCE (Scores must be between 0 and 100, or null if insufficient evidence):

   DIMENSION 1: Buying Intent (Weight: 35%)
   - Measure how strongly the customer expresses intention to purchase.
   - Reference anchors (illustrative guidance, not keyword matching):
     "just browsing" -> ~10, "looking at a few options" -> ~20, "interested in this product" -> ~35,
     "can you tell me the price?" -> ~45, "looks good, need to think about it" -> ~55,
     "looks good, probably buy" -> ~70, "decided to buy, confirm details" -> ~85,
     "order tomorrow / send payment link" -> 90-100.
   - CHANGING INTENTIONS: If a customer changes their mind during the conversation, assess their latest explicit intention while evaluating the complete dialogue. Do not blindly take the highest or last sentence if unrelated.

   DIMENSION 2: Budget Fit (Weight: 20%)
   - Evaluate whether product price fits customer's stated budget.
   - Reference anchors: comfortably within budget -> 100, within budget but prefer cheaper -> 85, slightly above budget -> 65, costs more than planned -> 40, cannot afford -> 10.
   - IF NO BUDGET IS DISCUSSED OR KNOWN: return null (do NOT return 0). Never invent a budget.

   DIMENSION 3: Urgency & Timeline (Weight: 15%)
   - Measure how soon the customer intends to purchase.
   - Reference anchors: only researching / next year -> 10-20, next month -> 50, decision this week -> 70, within a few days -> 85, today -> 100.
   - IF NO TIMELINE IS DISCUSSED: return null.

   DIMENSION 4: Product Fit (Weight: 15%)
   - Evaluate how well the product meets customer's stated needs.
   - Reference anchors: meets all requirements -> 100, main features available -> 85, most met but one missing -> 65, important feature missing -> 25, not suitable -> 5.
   - IF INSUFFICIENT EVIDENCE to evaluate: return null.

   DIMENSION 5: Engagement (Weight: 15%)
   - Evaluate customer's meaningful participation in the conversation.
   - Reference anchors: minimal participation -> 10-30, asks a few relevant questions -> 55, actively discusses requirements & compares -> 75-90, deep active collaboration -> 100.
   - IF CANNOT BE EVALUATED RELIABLY: return null.

   DIMENSION 6: Objections Impact (Negative deduction: 20%)
   - IMPORTANT: HIGHER SCORE MEANS MORE SEVERE UNRESOLVED BARRIERS!
   - 0 = no unresolved concerns.
   - 10-20 = minor clarification questions (warranty, feature detail).
   - 50 = moderate price concern.
   - 75 = product too expensive.
   - 100 = explicit refusal to purchase due to unresolved issue.
   - Distinguish resolved objections from unresolved ones. If no objections exist, score 0. If unassessable, return null.

TRANSCRIPT:
\"\"\"
{transcript}
\"\"\"

Produce structured JSON matching this schema:
- sentiment: "Positive" | "Neutral" | "Negative"
- sentiment_explanation: Detailed factual reasoning based on customer utterances
- summary: Concise conversation summary and outcome
- buying_intent: {{"score": float 0-100 or null, "confidence": float 0-1, "evidence": ["quote"], "explanation": "..."}}
- budget_fit: {{"score": float 0-100 or null, "confidence": float 0-1, "evidence": ["quote"], "explanation": "..."}}
- urgency_timeline: {{"score": float 0-100 or null, "confidence": float 0-1, "evidence": ["quote"], "explanation": "..."}}
- product_fit: {{"score": float 0-100 or null, "confidence": float 0-1, "evidence": ["quote"], "explanation": "..."}}
- engagement: {{"score": float 0-100 or null, "confidence": float 0-1, "evidence": ["quote"], "explanation": "..."}}
- objections_impact: {{"score": float 0-100 or null, "confidence": float 0-1, "evidence": ["quote"], "explanation": "..."}}
- customer_needs: List of specific customer needs or pain points mentioned
- buying_signals: List of explicit buying intent statements or cues
- objections: List of hesitations, concerns, or unresolved barriers
- recommended_next_action: Concrete actionable next step for the sales representative
"""

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiAnalysisResult,
                temperature=0.2,  # Low temperature for objective, reproducible evaluation
            ),
        )

        if not response.text:
            raise GeminiAPIError("Gemini API returned an empty response.")

        parsed_data = json.loads(response.text)
        return GeminiAnalysisResult.model_validate(parsed_data)

    except GeminiConfigurationError:
        raise
    except Exception as e:
        raise GeminiAPIError(f"Gemini analysis failed: {str(e)}") from e
