"""
LeadLens — Purchase Potential Scoring System

IMPORTANT METHODOLOGICAL LIMITATION & DISCLAIMER:
This scoring function computes an explainable, evidence-based heuristic estimate
based on observable conversational signals extracted from AI dialogue analysis.
It is an initial heuristic scoring model and has NOT been statistically calibrated
against historical purchase outcomes, nor is it a validated probability of purchasing.
"""

from typing import Dict, Any, List, Optional
from .schemas import (
    GeminiAnalysisResult,
    PurchasePotentialResult,
    FactorAssessment,
)

# Standard heuristic weights for dimensions
POSITIVE_WEIGHTS = {
    "buying_intent": 0.35,
    "budget_fit": 0.20,
    "urgency_timeline": 0.15,
    "product_fit": 0.15,
    "engagement": 0.15,
}

OBJECTION_WEIGHT = 0.20

FACTOR_META = {
    "buying_intent": {"name": "Buying Intent", "variable": "B", "weight": 0.35, "type": "positive"},
    "budget_fit": {"name": "Budget Fit", "variable": "F", "weight": 0.20, "type": "positive"},
    "urgency_timeline": {"name": "Urgency & Timeline", "variable": "U", "weight": 0.15, "type": "positive"},
    "product_fit": {"name": "Product Fit", "variable": "P", "weight": 0.15, "type": "positive"},
    "engagement": {"name": "Engagement", "variable": "E", "weight": 0.15, "type": "positive"},
    "objections_impact": {"name": "Objections Impact", "variable": "O", "weight": 0.20, "type": "negative"},
}


def classify_potential(score: Optional[int]) -> str:
    """
    Classifies the final purchase potential score into initial heuristic categories:
      0–29:   Low Potential
      30–49:  Early Interest
      50–69:  Potential Lead
      70–84:  High Potential
      85–100: Very High Potential
    """
    if score is None:
        return "Insufficient Evidence"
    if score >= 85:
        return "Very High Potential"
    if score >= 70:
        return "High Potential"
    if score >= 50:
        return "Potential Lead"
    if score >= 30:
        return "Early Interest"
    return "Low Potential"


def calculate_purchase_potential(
    analysis: GeminiAnalysisResult,
    weights: Optional[Dict[str, float]] = None,
    objection_weight: float = OBJECTION_WEIGHT,
) -> PurchasePotentialResult:
    """
    Calculates the Purchase Potential Score (X/100) using the 6-dimension formula:
    
      S_raw = (0.35 * B) + (0.20 * F) + (0.15 * U) + (0.15 * P) + (0.15 * E) - (0.20 * O)
      
    Where:
      B = Buying Intent (35%)
      F = Budget Fit (20%)
      U = Urgency & Timeline (15%)
      P = Product Fit (15%)
      E = Engagement (15%)
      O = Objections Impact (negative adjustment: 20%)
      
    Missing values:
      If positive factors are unknown (null), normalizes across available positive weights:
        Positive Score = Sum(weight_i * score_i) / Sum(weight_i for available factors)
        
      If Objections Impact (O) is unknown (null), does not silently assume zero penalty;
      tracks the limitation explicitly.
      
      Clamps final score to [0, 100] and rounds consistently.
    """
    pos_weights = weights or POSITIVE_WEIGHTS
    limitations: List[str] = []
    evidence_collected: List[str] = []

    # Extract assessment objects
    assessments: Dict[str, FactorAssessment] = {
        "buying_intent": analysis.buying_intent,
        "budget_fit": analysis.budget_fit,
        "urgency_timeline": analysis.urgency_timeline,
        "product_fit": analysis.product_fit,
        "engagement": analysis.engagement,
        "objections_impact": analysis.objections_impact,
    }

    # Factor detail breakdown dictionary
    factors_detail: Dict[str, Any] = {}

    available_pos_weighted_sum = 0.0
    available_pos_weight_total = 0.0

    for key, weight in pos_weights.items():
        assessment = assessments.get(key)
        score = assessment.score if assessment else None
        conf = assessment.confidence if assessment else 0.0
        ev = assessment.evidence if assessment else []
        exp = assessment.explanation if assessment else ""
        meta = FACTOR_META[key]

        is_unknown = score is None
        if is_unknown:
            limitations.append(f"{meta['name']} is unknown/unassessed from dialogue.")
        else:
            available_pos_weighted_sum += weight * score
            available_pos_weight_total += weight
            if ev:
                evidence_collected.extend(ev[:1])

        factors_detail[key] = {
            "name": meta["name"],
            "variable": meta["variable"],
            "type": meta["type"],
            "weight": weight,
            "score": round(score, 1) if score is not None else None,
            "is_unknown": is_unknown,
            "confidence": round(conf, 2),
            "evidence": ev,
            "explanation": exp,
        }

    # Objection factor
    obj_assessment = assessments.get("objections_impact")
    obj_score = obj_assessment.score if obj_assessment else None
    obj_conf = obj_assessment.confidence if obj_assessment else 0.0
    obj_ev = obj_assessment.evidence if obj_assessment else []
    obj_exp = obj_assessment.explanation if obj_assessment else ""
    obj_is_unknown = obj_score is None

    if obj_is_unknown:
        limitations.append("Objections Impact is unknown/unassessed; no objection penalty was applied (tracked limitation).")
    else:
        if obj_ev:
            evidence_collected.extend(obj_ev[:1])

    factors_detail["objections_impact"] = {
        "name": FACTOR_META["objections_impact"]["name"],
        "variable": FACTOR_META["objections_impact"]["variable"],
        "type": FACTOR_META["objections_impact"]["type"],
        "weight": objection_weight,
        "score": round(obj_score, 1) if obj_score is not None else None,
        "is_unknown": obj_is_unknown,
        "confidence": round(obj_conf, 2),
        "evidence": obj_ev,
        "explanation": obj_exp,
    }

    # Verify minimum sufficient evidence:
    # At least one positive factor must be available, and if Buying Intent is missing,
    # available positive weight must be at least 0.30
    if available_pos_weight_total <= 0.0 or (assessments["buying_intent"].score is None and available_pos_weight_total < 0.30):
        return PurchasePotentialResult(
            score=None,
            score_raw=None,
            score_label="Insufficient Evidence",
            positive_score=None,
            objection_penalty=None,
            objection_penalty_applied=False,
            weights_used=pos_weights,
            factors=factors_detail,
            explanation="Insufficient evidence to evaluate purchase potential reliably.",
            evidence=[],
            limitations=limitations,
        )

    # 1. Calculate normalized Positive Score
    positive_score = available_pos_weighted_sum / available_pos_weight_total

    # 2. Apply Objections Adjustment
    objection_penalty: Optional[float] = None
    objection_penalty_applied = False

    if obj_score is not None:
        objection_penalty = objection_weight * obj_score
        objection_penalty_applied = True
        s_raw = positive_score - objection_penalty
    else:
        s_raw = positive_score

    # 3. Clamp to [0, 100] and round
    s_clamped = max(0.0, min(100.0, s_raw))
    display_score = int(round(s_clamped))
    label = classify_potential(display_score)

    # Build concise explainable calculation narrative
    pos_desc = f"Positive Score = {positive_score:.2f} (normalized over weight {available_pos_weight_total:.2f})"
    if objection_penalty_applied and objection_penalty is not None:
        obj_desc = f", Objection Penalty = -{objection_penalty:.2f} (0.20 * {obj_score:.1f})"
    else:
        obj_desc = ", Objection Penalty = None (unknown/unassessed)"

    calc_explanation = (
        f"Calculated heuristic Purchase Potential Score: {display_score}/100 ({label}). "
        f"{pos_desc}{obj_desc} -> S_raw = {s_raw:.2f}, clamped = {s_clamped:.2f}."
    )

    return PurchasePotentialResult(
        score=display_score,
        score_raw=round(s_raw, 2),
        score_label=label,
        positive_score=round(positive_score, 2),
        objection_penalty=round(objection_penalty, 2) if objection_penalty is not None else None,
        objection_penalty_applied=objection_penalty_applied,
        weights_used=pos_weights,
        factors=factors_detail,
        explanation=calc_explanation,
        evidence=evidence_collected[:4],
        limitations=limitations,
    )
