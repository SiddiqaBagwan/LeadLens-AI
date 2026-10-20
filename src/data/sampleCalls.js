/**
 * LeadLens - Sample Customer Call Recordings & AI Analysis Dataset
 *
 * Grounded in the 4 sample recordings (call1.mp4 - call4.mp4).
 * Fictional customer identities and unsupported company names have been removed.
 * All four recordings use stable identifiers: CALL-001 through CALL-004.
 */

export const SAMPLE_CALLS = [
  {
    call_id: "CALL-001",
    call_label: "Call #001",
    original_filename: "call1.mp4",
    duration_seconds: 106,
    duration_formatted: "1:46",
    sentiment: "Positive",
    sentiment_explanation:
      "Customer expressed interest in automated route dispatch intelligence, highlighted operational pain points, and requested a demonstration.",
    purchase_potential_score: 75,
    purchase_likelihood: 75,
    purchase_score_label: "High Potential",
    purchase_factors: {
      buying_intent: {
        score: 85,
        confidence: 0.90,
        explanation: "Customer expressed clear interest and requested a demonstration.",
        evidence: ["Requested demonstration of dispatch intelligence capabilities"],
      },
      budget_fit: {
        score: 75,
        confidence: 0.80,
        explanation: "Budget discussed in relation to fleet operational tools.",
        evidence: ["Confirmed budget availability for dispatch modernization"],
      },
      urgency_timeline: {
        score: 70,
        confidence: 0.85,
        explanation: "Planning implementation in the near term.",
        evidence: ["Targeting evaluation within current quarter"],
      },
      product_fit: {
        score: 80,
        confidence: 0.85,
        explanation: "Solution addresses route dispatch and driver dispute visibility.",
        evidence: ["Directly matches dispatcher call handling requirements"],
      },
      engagement: {
        score: 80,
        confidence: 0.90,
        explanation: "Active, collaborative discussion on workflow integration.",
        evidence: ["Detailed inquiries regarding system compatibility"],
      },
      objections_impact: {
        score: 25,
        confidence: 0.80,
        explanation: "Technical questions regarding ERP integration and webhook latency.",
        evidence: ["Requires confirmation on webhook latency and system integration"],
      },
    },
    buying_signals: [
      "Requested demonstration of dispatch intelligence capabilities",
      "Confirmed budget availability for modernization",
      "Inquired about volume pricing for active dispatcher seats",
    ],
    objections: [
      "Requires technical confirmation regarding system integration and webhook latency",
    ],
    customer_needs: [
      "Automated route optimization alerts",
      "Real-time driver transcript and sentiment flags",
      "Integration with existing operations systems",
    ],
    summary:
      "Customer is evaluating tools to streamline dispatcher call handling and improve visibility into driver disputes, requesting a technical demonstration.",
    recommended_next_action:
      "Schedule demonstration and share technical integration documentation.",
    analysis_status: "completed",
    report_status: "available",
  },
  {
    call_id: "CALL-002",
    call_label: "Call #002",
    original_filename: "call2.mp4",
    duration_seconds: 93,
    duration_formatted: "1:33",
    sentiment: "Neutral",
    sentiment_explanation:
      "Customer is in early research phase exploring AI conversation analysis capabilities without immediate budget commitment.",
    purchase_potential_score: 42,
    purchase_likelihood: 42,
    purchase_score_label: "Early Interest",
    purchase_factors: {
      buying_intent: {
        score: 40,
        confidence: 0.85,
        explanation: "Early exploratory research without active purchasing commitment.",
        evidence: ["Looking into options across multiple conversation intelligence vendors"],
      },
      budget_fit: {
        score: null,
        confidence: 0.0,
        explanation: "No specific budget or price point was discussed.",
        evidence: [],
      },
      urgency_timeline: {
        score: 30,
        confidence: 0.75,
        explanation: "Exploratory evaluation with no immediate deadline.",
        evidence: ["Gathering preliminary information for future roadmap"],
      },
      product_fit: {
        score: 65,
        confidence: 0.80,
        explanation: "Capabilities partially match research objectives.",
        evidence: ["Interested in transcript search and keyword extraction"],
      },
      engagement: {
        score: 60,
        confidence: 0.85,
        explanation: "Polite and responsive with standard exploratory questions.",
        evidence: ["Asked high-level questions about platform architecture"],
      },
      objections_impact: {
        score: 20,
        confidence: 0.70,
        explanation: "No major dealbreakers, but no urgent driver to proceed.",
        evidence: ["No immediate purchase authorization"],
      },
    },
    buying_signals: [
      "Requested platform whitepaper and documentation",
      "Asked about API access for evaluation",
    ],
    objections: [
      "No allocated budget or active timeline at this stage",
    ],
    customer_needs: [
      "Transcript indexing and semantic search",
      "API access for technical evaluation",
    ],
    summary:
      "Exploratory inquiry into platform capabilities and API architecture, with follow-up scheduled for when budget is scoped.",
    recommended_next_action:
      "Send platform architecture overview and check back next quarter.",
    analysis_status: "completed",
    report_status: "available",
  },
  {
    call_id: "CALL-003",
    call_label: "Call #003",
    original_filename: "call3.mp4",
    duration_seconds: 94,
    duration_formatted: "1:34",
    sentiment: "Negative",
    sentiment_explanation:
      "Customer expressed frustration with price quotes exceeding planned expenditure and rigid contract terms.",
    purchase_potential_score: 24,
    purchase_likelihood: 24,
    purchase_score_label: "Low Potential",
    purchase_factors: {
      buying_intent: {
        score: 25,
        confidence: 0.90,
        explanation: "Customer expressed significant reluctance due to pricing hurdles.",
        evidence: ["Costs substantially more than our allocated vendor budget"],
      },
      budget_fit: {
        score: 20,
        confidence: 0.95,
        explanation: "Quoted price is significantly above customer's affordability threshold.",
        evidence: ["Cannot justify the quoted annual commitment"],
      },
      urgency_timeline: {
        score: 20,
        confidence: 0.80,
        explanation: "Procurement on hold pending budget resolution.",
        evidence: ["Need to re-evaluate alternative lower-cost options"],
      },
      product_fit: {
        score: 55,
        confidence: 0.80,
        explanation: "Features meet requirements, but pricing structure prevents adoption.",
        evidence: ["Features look adequate but commercial terms do not align"],
      },
      engagement: {
        score: 50,
        confidence: 0.85,
        explanation: "Direct communication of pricing dissatisfaction.",
        evidence: ["Firm pushback on payment terms"],
      },
      objections_impact: {
        score: 80,
        confidence: 0.95,
        explanation: "Severe budget and contractual barriers prevent purchasing.",
        evidence: ["Firm objection to minimum seat requirements and upfront commitment"],
      },
    },
    buying_signals: [
      "Confirmed feature utility if pricing becomes competitive",
    ],
    objections: [
      "Quoted pricing exceeds planned expenditure by ~30%",
      "Unwilling to sign multi-year agreement without tier discounts",
    ],
    customer_needs: [
      "Flexible pay-as-you-go billing model",
      "Lower seat threshold for pilot phase",
    ],
    summary:
      "Customer rejected the commercial proposal due to severe budget constraints and rigid contractual requirements.",
    recommended_next_action:
      "Consult sales leadership regarding flexible pilot pricing or starter tier.",
    analysis_status: "completed",
    report_status: "available",
  },
  {
    call_id: "CALL-004",
    call_label: "Call #004",
    original_filename: "call4.mp4",
    duration_seconds: 91,
    duration_formatted: "1:31",
    sentiment: "Positive",
    sentiment_explanation:
      "Customer confirmed strategic priority for compliance-grade call intelligence, seeking expedited security verification.",
    purchase_potential_score: 86,
    purchase_likelihood: 86,
    purchase_score_label: "Very High Potential",
    purchase_factors: {
      buying_intent: {
        score: 92,
        confidence: 0.95,
        explanation: "Definitive purchase commitment once compliance documentation is verified.",
        evidence: ["Ready to proceed to contract review upon receiving BAA"],
      },
      budget_fit: {
        score: 90,
        confidence: 0.90,
        explanation: "Dedicated compliance budget confirmed for this procurement.",
        evidence: ["Budget allocated under strategic infrastructure fund"],
      },
      urgency_timeline: {
        score: 85,
        confidence: 0.90,
        explanation: "Immediate rollout desired within current operational cycle.",
        evidence: ["Aiming for contract signature this month"],
      },
      product_fit: {
        score: 90,
        confidence: 0.90,
        explanation: "Strong alignment with security, compliance, and auditing needs.",
        evidence: ["Meets all stated security logging and privacy criteria"],
      },
      engagement: {
        score: 95,
        confidence: 0.95,
        explanation: "Highly structured and collaborative review of next steps.",
        evidence: ["Actively coordinating legal and technical security sign-offs"],
      },
      objections_impact: {
        score: 15,
        confidence: 0.90,
        explanation: "Minor standard compliance paperwork, fully manageable.",
        evidence: ["Standard BAA and SOC2 report requests only"],
      },
    },
    buying_signals: [
      "Requested standard Business Associate Agreement (BAA)",
      "Confirmed allocated budget for enterprise licensing",
      "Identified executive sponsor ready to sign upon compliance review",
    ],
    objections: [
      "Requires SOC2 Type II report and signed BAA prior to deployment",
    ],
    customer_needs: [
      "HIPAA-compliant audio redaction and audit trails",
      "Role-based access control for administrative staff",
      "Seamless integration with healthcare contact center telephony",
    ],
    summary:
      "Customer is prepared to finalize enterprise contract pending legal verification of BAA and compliance documentation.",
    recommended_next_action:
      "Send SOC2 Type II audit package and standard BAA for legal review.",
    analysis_status: "completed",
    report_status: "available",
  },
];

/**
 * Derived metrics calculation helper
 */
export function getDashboardMetrics(calls = SAMPLE_CALLS) {
  const totalCalls = calls.length;

  const positiveCalls = calls.filter((c) => (c.sentiment || "").toLowerCase() === "positive").length;
  const neutralCalls = calls.filter((c) => (c.sentiment || "").toLowerCase() === "neutral").length;
  const negativeCalls = calls.filter((c) => (c.sentiment || "").toLowerCase() === "negative").length;

  const evaluatedCalls = calls.filter((c) => (c.purchase_potential_score ?? c.purchase_likelihood) != null);
  const totalPotential = evaluatedCalls.reduce(
    (sum, c) => sum + (c.purchase_potential_score ?? c.purchase_likelihood ?? 0),
    0
  );
  const averagePurchaseLikelihood = evaluatedCalls.length
    ? Math.round(totalPotential / evaluatedCalls.length)
    : 0;

  return {
    totalCalls,
    positiveCalls,
    neutralCalls,
    negativeCalls,
    averagePurchaseLikelihood,
  };
}
