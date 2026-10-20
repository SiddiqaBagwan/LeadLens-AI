"""
Unit tests for LeadLens Purchase Potential Scoring System.
Verifies all required test cases:
1. All factors available (including exact prompt reference case)
2. Missing budget information
3. Missing urgency
4. Missing objection assessment
5. Strong buying intent with severe objections
6. Low buying intent with no significant objections
7. Changing customer intention scenarios
8. Boundary scores (0 and 100)
"""

import unittest
from backend.schemas import GeminiAnalysisResult, FactorAssessment
from backend.purchase_scoring import calculate_purchase_potential, classify_potential


def make_assessment(score, conf=0.85, ev=None, exp=""):
    return FactorAssessment(
        score=score,
        confidence=conf,
        evidence=ev or (["Supporting quote"] if score is not None else []),
        explanation=exp or (f"Score {score}" if score is not None else "Unknown"),
    )


def build_analysis(
    buying_intent=80.0,
    budget_fit=70.0,
    urgency_timeline=60.0,
    product_fit=75.0,
    engagement=80.0,
    objections_impact=20.0,
    sentiment="Positive",
):
    return GeminiAnalysisResult(
        sentiment=sentiment,
        sentiment_explanation="Customer expressed constructive interest in conversation intelligence.",
        summary="Customer evaluated product capabilities and commercial fit.",
        buying_intent=make_assessment(buying_intent),
        budget_fit=make_assessment(budget_fit),
        urgency_timeline=make_assessment(urgency_timeline),
        product_fit=make_assessment(product_fit),
        engagement=make_assessment(engagement),
        objections_impact=make_assessment(objections_impact),
        customer_needs=["Workflow automation", "CRM synchronization"],
        buying_signals=["Requested executive team demonstration"],
        objections=["Questions regarding API webhook latency"],
        recommended_next_action="Provide integration documentation and schedule follow-up.",
    )


class TestPurchasePotentialScoring(unittest.TestCase):

    def test_all_factors_available_prompt_reference(self):
        """
        Verify the exact reference calculation from the specification:
        B = 90
        F = 60
        U = 80
        P = 90
        E = 85
        O = 60
        S_raw = (0.35*90) + (0.20*60) + (0.15*80) + (0.15*90) + (0.15*85) - (0.20*60) = 69.75
        Display score: 70
        Label: High Potential (threshold 70-84)
        """
        analysis = build_analysis(
            buying_intent=90.0,
            budget_fit=60.0,
            urgency_timeline=80.0,
            product_fit=90.0,
            engagement=85.0,
            objections_impact=60.0,
        )
        res = calculate_purchase_potential(analysis)
        self.assertAlmostEqual(res.score_raw, 69.75, places=2)
        self.assertEqual(res.score, 70)
        self.assertEqual(res.score_label, "High Potential")
        self.assertTrue(res.objection_penalty_applied)
        self.assertAlmostEqual(res.objection_penalty, 12.0, places=2)

    def test_missing_budget_information(self):
        """
        Verify missing budget information (F=None) is not treated as zero,
        but renormalized across available positive weights: 0.35+0.15+0.15+0.15 = 0.80.
        """
        analysis = build_analysis(
            buying_intent=90.0,
            budget_fit=None,
            urgency_timeline=80.0,
            product_fit=90.0,
            engagement=85.0,
            objections_impact=60.0,
        )
        res = calculate_purchase_potential(analysis)
        # Expected:
        # Weighted sum = 0.35*90 + 0.15*80 + 0.15*90 + 0.15*85 = 31.5 + 12 + 13.5 + 12.75 = 69.75
        # Total positive weight = 0.80
        # Positive score = 69.75 / 0.80 = 87.1875
        # S_raw = 87.1875 - 12.0 = 75.1875
        # Rounded display score = 75 ("High Potential")
        self.assertAlmostEqual(res.positive_score, 87.19, places=1)
        self.assertAlmostEqual(res.score_raw, 75.19, places=1)
        self.assertEqual(res.score, 75)
        self.assertEqual(res.score_label, "High Potential")
        self.assertTrue(res.factors["budget_fit"]["is_unknown"])
        self.assertIsNone(res.factors["budget_fit"]["score"])

    def test_missing_urgency(self):
        """
        Verify missing urgency (U=None) is not treated as zero,
        normalizing over 0.35+0.20+0.15+0.15 = 0.85 available positive weight.
        """
        analysis = build_analysis(
            buying_intent=80.0,
            budget_fit=80.0,
            urgency_timeline=None,
            product_fit=80.0,
            engagement=80.0,
            objections_impact=10.0,
        )
        res = calculate_purchase_potential(analysis)
        # Positive score = 80.0 (all available positive scores are 80)
        # Objection penalty = 0.20 * 10 = 2.0
        # S_raw = 80.0 - 2.0 = 78.0 -> score 78
        self.assertAlmostEqual(res.positive_score, 80.0, places=2)
        self.assertAlmostEqual(res.score_raw, 78.0, places=2)
        self.assertEqual(res.score, 78)
        self.assertEqual(res.score_label, "High Potential")
        self.assertTrue(res.factors["urgency_timeline"]["is_unknown"])

    def test_missing_objection_assessment(self):
        """
        Verify missing objection assessment (O=None) does not silently assume zero penalty
        and explicitly tracks the limitation.
        """
        analysis = build_analysis(
            buying_intent=80.0,
            budget_fit=70.0,
            urgency_timeline=60.0,
            product_fit=75.0,
            engagement=80.0,
            objections_impact=None,
        )
        res = calculate_purchase_potential(analysis)
        self.assertFalse(res.objection_penalty_applied)
        self.assertIsNone(res.objection_penalty)
        self.assertTrue(res.factors["objections_impact"]["is_unknown"])
        # Check that limitation is recorded
        self.assertTrue(any("Objections Impact is unknown" in l for l in res.limitations))

    def test_strong_buying_intent_with_severe_objections(self):
        """
        Verify strong intent (B=95) with severe unresolved objections (O=95)
        significantly reduces score (deducts 0.20 * 95 = 19.0).
        """
        analysis = build_analysis(
            buying_intent=95.0,
            budget_fit=90.0,
            urgency_timeline=85.0,
            product_fit=90.0,
            engagement=90.0,
            objections_impact=95.0,
        )
        res = calculate_purchase_potential(analysis)
        # Positive score = 0.35*95 + 0.20*90 + 0.15*85 + 0.15*90 + 0.15*90 = 33.25 + 18 + 12.75 + 13.5 + 13.5 = 91.0
        # Deduction = 0.20 * 95 = 19.0
        # S_raw = 91.0 - 19.0 = 72.0
        self.assertAlmostEqual(res.score_raw, 72.0, places=1)
        self.assertEqual(res.score, 72)
        self.assertEqual(res.score_label, "High Potential")

    def test_low_buying_intent_with_no_significant_objections(self):
        """
        Verify low buying intent (B=15) with no objections (O=0)
        still yields a low score because baseline buying intent is weak.
        """
        analysis = build_analysis(
            buying_intent=15.0,
            budget_fit=30.0,
            urgency_timeline=10.0,
            product_fit=20.0,
            engagement=25.0,
            objections_impact=0.0,
        )
        res = calculate_purchase_potential(analysis)
        # Positive score = 0.35*15 + 0.20*30 + 0.15*10 + 0.15*20 + 0.15*25 = 5.25 + 6.0 + 1.5 + 3.0 + 3.75 = 19.5
        # Deduction = 0.0
        # S_raw = 19.5
        self.assertAlmostEqual(res.score_raw, 19.5, places=1)
        self.assertEqual(res.score, 20)
        self.assertEqual(res.score_label, "Low Potential")

    def test_changing_intention_handled(self):
        """
        Simulate a conversation where customer initially hesitates but confirms intent,
        resulting in higher buying intent and modest resolved objections impact.
        """
        analysis = build_analysis(
            buying_intent=85.0,  # updated after positive conclusion
            budget_fit=80.0,
            urgency_timeline=70.0,
            product_fit=85.0,
            engagement=90.0,
            objections_impact=25.0, # initial objection largely resolved
        )
        res = calculate_purchase_potential(analysis)
        self.assertGreaterEqual(res.score, 75)
        self.assertEqual(res.score_label, "High Potential")

    def test_lower_boundary_clamping(self):
        """
        All zeros with max objection penalty: S_raw = 0 - 20 = -20 -> clamped to 0.
        """
        analysis = build_analysis(
            buying_intent=0.0,
            budget_fit=0.0,
            urgency_timeline=0.0,
            product_fit=0.0,
            engagement=0.0,
            objections_impact=100.0,
        )
        res = calculate_purchase_potential(analysis)
        self.assertEqual(res.score, 0)
        self.assertAlmostEqual(res.score_raw, -20.0, places=1)
        self.assertEqual(res.score_label, "Low Potential")

    def test_upper_boundary_clamping(self):
        """
        All 100s with zero objection penalty: S_raw = 100 -> clamped to 100.
        """
        analysis = build_analysis(
            buying_intent=100.0,
            budget_fit=100.0,
            urgency_timeline=100.0,
            product_fit=100.0,
            engagement=100.0,
            objections_impact=0.0,
        )
        res = calculate_purchase_potential(analysis)
        self.assertEqual(res.score, 100)
        self.assertAlmostEqual(res.score_raw, 100.0, places=1)
        self.assertEqual(res.score_label, "Very High Potential")

    def test_classify_potential_thresholds(self):
        self.assertEqual(classify_potential(0), "Low Potential")
        self.assertEqual(classify_potential(29), "Low Potential")
        self.assertEqual(classify_potential(30), "Early Interest")
        self.assertEqual(classify_potential(49), "Early Interest")
        self.assertEqual(classify_potential(50), "Potential Lead")
        self.assertEqual(classify_potential(69), "Potential Lead")
        self.assertEqual(classify_potential(70), "High Potential")
        self.assertEqual(classify_potential(84), "High Potential")
        self.assertEqual(classify_potential(85), "Very High Potential")
        self.assertEqual(classify_potential(100), "Very High Potential")
        self.assertEqual(classify_potential(None), "Insufficient Evidence")


if __name__ == "__main__":
    unittest.main()
