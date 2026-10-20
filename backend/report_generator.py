import io
import os
from xml.sax.saxutils import escape
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.pdfgen import canvas
from .schemas import CallRecord

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print total page count in footer.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_footer(num_pages)
            super().showPage()
        super().save()

    def draw_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        # Top line
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(40, 35, 572, 35)
        # Footer text
        self.drawString(40, 24, "LeadLens — AI-Powered Call Analysis & Decision Support Portal")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 24, page_text)
        self.restoreState()

def clean_text(val) -> str:
    if val is None:
        return ""
    return escape(str(val))

def generate_call_pdf_report(call: CallRecord) -> bytes:
    """
    Generates an executive PDF dossier for a call using ReportLab.
    Grounds all findings strictly in dialogue evidence with:
    - Call ID & Label (e.g., Call #001)
    - Duration and timestamp
    - Sentiment and reasoning
    - Executive conversation summary
    - 6 scoring dimensions with weights, factor scores, and evidence
    - Formula and calculation explanation
    - Final Purchase Potential Score: X/100
    - Customer needs, buying signals, and objections
    - Recommended next action
    - Complete Whisper transcript
    """
    if call.analysis_status != "completed":
        raise ValueError(f"Cannot generate report for call {call.call_id}: Analysis is '{call.analysis_status}'")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=50,
    )

    styles = getSampleStyleSheet()

    # Custom Brand Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b'),
    )
    section_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
    )
    bold_label = ParagraphStyle(
        'BoldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0f172a'),
    )
    transcript_style = ParagraphStyle(
        'TranscriptText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1e293b'),
    )
    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e1b4b'),
    )

    elements = []

    # 1. Header / Branding
    call_display = call.call_label or f"Call #{call.call_id.replace('CALL-', '')}"
    elements.append(Paragraph(f"LeadLens Call Dossier — {clean_text(call_display)}", title_style))
    elements.append(Paragraph("AI-Powered Conversation Intelligence & Purchase Potential Assessment", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#6366f1'), spaceAfter=12))

    # 2. Metadata Grid Table
    sentiment_color = (
        "#10b981" if (call.sentiment or "").lower() == "positive"
        else ("#ef4444" if (call.sentiment or "").lower() == "negative" else "#f59e0b")
    )
    display_score_str = f"{call.purchase_likelihood}/100" if call.purchase_likelihood is not None else "Unknown"
    meta_data = [
        [
            Paragraph("<b>Identifier:</b>", bold_label),
            Paragraph(f"<b>{clean_text(call.call_id)}</b> ({clean_text(call_display)})", body_style),
            Paragraph("<b>Recording File:</b>", bold_label),
            Paragraph(clean_text(call.original_filename), body_style),
        ],
        [
            Paragraph("<b>Duration:</b>", bold_label),
            Paragraph(f"{call.duration_formatted or 'Unknown'} ({round(call.duration_seconds or 0)}s)", body_style),
            Paragraph("<b>Analyzed At:</b>", bold_label),
            Paragraph(clean_text(call.analysis_timestamp or datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")), body_style),
        ],
        [
            Paragraph("<b>Sentiment:</b>", bold_label),
            Paragraph(f"<font color='{sentiment_color}'><b>{clean_text(call.sentiment)}</b></font>", body_style),
            Paragraph("<b>Purchase Potential:</b>", bold_label),
            Paragraph(f"<b>{display_score_str} ({clean_text(call.purchase_score_label or 'Evaluated')})</b>", body_style),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[90, 175, 110, 155])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 14))

    # 3. Executive Conversation Summary
    elements.append(Paragraph("1. Executive Conversation Summary", section_h1))
    elements.append(Paragraph(clean_text(call.summary or "Summary unavailable."), body_style))
    elements.append(Spacer(1, 10))

    # 4. Sentiment Analysis (Separate from purchase potential)
    elements.append(Paragraph("2. Sentiment Analysis (Customer Attitude)", section_h1))
    sentiment_p = Paragraph(
        f"<b>Classification:</b> {clean_text(call.sentiment)}<br/><br/>"
        f"<b>Customer Reason & Tone:</b> {clean_text(call.sentiment_explanation or 'N/A')}",
        body_style
    )
    sentiment_box = Table([[sentiment_p]], colWidths=[532])
    sentiment_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(sentiment_box)
    elements.append(Spacer(1, 10))

    # 5. Purchase Potential Score & 6-Dimension Breakdown
    elements.append(Paragraph("3. Purchase Potential Scoring System", section_h1))
    elements.append(Paragraph(
        "<i>Note: Heuristic decision-support score (0–100). Not a statistically calibrated probability of purchasing.</i>",
        body_style
    ))
    elements.append(Spacer(1, 5))

    factors = call.purchase_factors or {}
    
    def fmt_factor_val(f_key, is_penalty=False):
        f_data = factors.get(f_key, {})
        if isinstance(f_data, dict):
            s = f_data.get("score")
            if s is None:
                return "Unknown"
            return f"-{s:.0f}" if is_penalty else f"{s:.0f}/100"
        elif f_data is not None:
            return f"{f_data:.0f}/100"
        return "Unknown"

    factor_table_data = [
        [
            Paragraph("<b>Scoring Dimension</b>", bold_label),
            Paragraph("<b>Type / Weight</b>", bold_label),
            Paragraph("<b>Factor Score</b>", bold_label),
            Paragraph("<b>Interpretation Guidance</b>", bold_label),
        ],
        [
            Paragraph("1. Buying Intent (B)", body_style),
            Paragraph("Positive (35%)", body_style),
            Paragraph(fmt_factor_val("buying_intent"), body_style),
            Paragraph("Expressed intention & commitment to purchase", body_style),
        ],
        [
            Paragraph("2. Budget Fit (F)", body_style),
            Paragraph("Positive (20%)", body_style),
            Paragraph(fmt_factor_val("budget_fit"), body_style),
            Paragraph("Affordability against quoted price", body_style),
        ],
        [
            Paragraph("3. Urgency & Timeline (U)", body_style),
            Paragraph("Positive (15%)", body_style),
            Paragraph(fmt_factor_val("urgency_timeline"), body_style),
            Paragraph("Decision/purchase deadline timeframe", body_style),
        ],
        [
            Paragraph("4. Product Fit (P)", body_style),
            Paragraph("Positive (15%)", body_style),
            Paragraph(fmt_factor_val("product_fit"), body_style),
            Paragraph("Meeting customer's stated requirements", body_style),
        ],
        [
            Paragraph("5. Engagement (E)", body_style),
            Paragraph("Positive (15%)", body_style),
            Paragraph(fmt_factor_val("engagement"), body_style),
            Paragraph("Meaningful dialogue participation", body_style),
        ],
        [
            Paragraph("6. Objections Impact (O)", body_style),
            Paragraph("Negative (-20%)", body_style),
            Paragraph(fmt_factor_val("objections_impact", is_penalty=True), body_style),
            Paragraph("Severity of unresolved barriers (higher = worse)", body_style),
        ],
        [
            Paragraph("<b>PURCHASE POTENTIAL SCORE</b>", bold_label),
            Paragraph("<b>Formula: S_raw</b>", bold_label),
            Paragraph(f"<b>{display_score_str}</b>", bold_label),
            Paragraph(f"<b>{clean_text(call.purchase_score_label or 'Evaluated')}</b>", bold_label),
        ],
    ]
    factors_table = Table(factor_table_data, colWidths=[162, 100, 90, 180])
    factors_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eef2ff')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(factors_table)
    elements.append(Spacer(1, 8))

    # Formula Box
    formula_text = (
        "<b>Formula:</b> S_raw = (0.35 × B) + (0.20 × F) + (0.15 × U) + (0.15 × P) + (0.15 × E) - (0.20 × O)<br/>"
        "<i>Positive scores normalized across available positive weights if any factor is unknown. "
        "Objection deduction applied separately. Result clamped to [0, 100].</i>"
    )
    if call.purchase_explanation:
        formula_text += f"<br/><br/><b>Calculation Explanation:</b> {clean_text(call.purchase_explanation)}"

    formula_table = Table([[Paragraph(formula_text, body_style)]], colWidths=[532])
    formula_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(formula_table)
    elements.append(Spacer(1, 12))

    # 6. Structured Conversational Intelligence
    elements.append(Paragraph("4. Structured Intelligence & Grounded Evidence", section_h1))
    
    needs_items = "".join([f"<li>{clean_text(n)}</li>" for n in (call.customer_needs or [])]) or "<li>No specific needs recorded.</li>"
    signals_items = "".join([f"<li>{clean_text(s)}</li>" for s in (call.buying_signals or [])]) or "<li>No explicit signals recorded.</li>"
    objections_items = "".join([f"<li>{clean_text(o)}</li>" for o in (call.objections or [])]) or "<li>No explicit objections recorded.</li>"
    
    intel_html = (
        f"<b>Customer Needs & Pain Points:</b><br/><ul>{needs_items}</ul><br/>"
        f"<b>Buying Signals Detected:</b><br/><ul>{signals_items}</ul><br/>"
        f"<b>Unresolved Objections & Concerns:</b><br/><ul>{objections_items}</ul>"
    )
    intel_table = Table([[Paragraph(intel_html, body_style)]], colWidths=[532])
    intel_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ffffff')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(intel_table)
    elements.append(Spacer(1, 10))

    # 7. Recommended Next Action
    elements.append(Paragraph("5. Recommended Next Action for Sales Representative", section_h1))
    action_text = call.recommended_next_action or "Review transcript and follow up with customer."
    action_box = Table([[Paragraph(f"<b>Next Action:</b> {clean_text(action_text)}", callout_style)]], colWidths=[532])
    action_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e0e7ff')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#6366f1')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(action_box)
    elements.append(Spacer(1, 14))

    # 8. Complete Dialogue Transcript
    elements.append(Paragraph("6. Complete Whisper Audio Transcript", section_h1))
    if call.transcript_segments:
        transcript_rows = []
        for seg in call.transcript_segments:
            seg_dict = seg if isinstance(seg, dict) else seg.model_dump()
            start_m, start_s = divmod(int(seg_dict.get("start", 0)), 60)
            time_tag = f"[{start_m:02d}:{start_s:02d}]"
            transcript_rows.append([
                Paragraph(f"<font color='#6366f1'><b>{time_tag}</b></font>", transcript_style),
                Paragraph(clean_text(seg_dict.get("text", "")), transcript_style)
            ])
        t_table = Table(transcript_rows, colWidths=[50, 482])
        t_table.setStyle(TableStyle([
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('LINEBELOW', (0, 0), (-1, -1), 0.3, colors.HexColor('#f1f5f9')),
        ]))
        elements.append(t_table)
    elif call.transcript:
        elements.append(Paragraph(clean_text(call.transcript), transcript_style))
    else:
        elements.append(Paragraph("<i>Transcript unavailable.</i>", body_style))

    # Build PDF with dynamic page numbering
    doc.build(elements, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()
