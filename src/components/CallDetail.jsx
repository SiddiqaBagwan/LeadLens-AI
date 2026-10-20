import React from 'react';
import {
  X,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  Download,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Loader2,
  Play,
  AlertCircle,
  FileAudio,
} from 'lucide-react';
import SentimentBadge from './SentimentBadge';
import StatusBadge from './StatusBadge';
import PurchaseScore from './PurchaseScore';
import AudioPlayer from './AudioPlayer';
import { getAudioStreamUrl } from '../api';

export default function CallDetail({ call, onClose, onDownloadReport, onAnalyzeCall, isAnalyzing }) {
  if (!call) return null;

  const isCompleted = call.analysis_status === 'completed';
  const isPending = call.analysis_status === 'pending' || call.analysis_status === 'failed' || !call.analysis_status;
  const audioUrl = getAudioStreamUrl(call.call_id);
  const callLabel = call.call_label || `Call #${call.call_id.replace('CALL-', '')}`;
  const potentialScore = call.purchase_potential_score ?? call.purchase_likelihood;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl min-h-screen bg-white shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Top Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
              {call.call_id ? call.call_id.replace('CALL-', '#') : 'ID'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {callLabel}
                </h3>
                <StatusBadge status={call.analysis_status} />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="font-mono font-semibold text-indigo-600">{call.call_id}</span>
                <span>•</span>
                <span>{call.original_filename || 'Recording File'}</span>
                {call.analysis_timestamp && (
                  <>
                    <span>•</span>
                    <span>{call.analysis_timestamp}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPending && !isAnalyzing && onAnalyzeCall && (
              <button
                onClick={() => onAnalyzeCall(call)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Analyze Call
              </button>
            )}
            {isAnalyzing && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing…
              </span>
            )}
            {isCompleted && (
              <button
                onClick={() => onDownloadReport(call)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Report
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">

          {/* Call Info & Audio Player */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-3">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Call Information
              </span>
              <div className="space-y-2">
                <div>
                  <div className="text-[11px] text-slate-500">Call Reference</div>
                  <div className="text-sm font-semibold text-slate-800">{callLabel}</div>
                  <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                    <FileAudio className="w-3 h-3 text-slate-400" />
                    <span>{call.original_filename}</span>
                  </div>
                </div>
                {call.duration_formatted && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="text-[11px] text-slate-500">Duration</div>
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {call.duration_formatted}
                      {call.duration_seconds != null && (
                        <span className="text-slate-400 text-xs">({Math.round(call.duration_seconds)}s)</span>
                      )}
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200/60">
                  <div className="text-[11px] text-slate-500">Pipeline Status</div>
                  <div className="mt-1">
                    <StatusBadge status={call.analysis_status} />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Audio Recording
                </span>
                <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                  HTML5 · Range Seek Enabled
                </span>
              </div>
              <AudioPlayer
                audioUrl={audioUrl}
                durationFormatted={call.duration_formatted}
                callId={call.call_id}
              />
            </div>
          </div>

          {/* Pending / failed state CTA */}
          {!isCompleted && (
            <div className={`p-5 rounded-xl border flex items-start gap-4 ${
              call.analysis_status === 'failed'
                ? 'bg-rose-50 border-rose-200'
                : 'bg-amber-50/60 border-amber-200/70'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                call.analysis_status === 'failed' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {call.analysis_status === 'failed' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-bold ${
                  call.analysis_status === 'failed' ? 'text-rose-900' : 'text-amber-900'
                }`}>
                  {call.analysis_status === 'failed' ? 'Analysis Failed' : 'Ready for AI Analysis'}
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${
                  call.analysis_status === 'failed' ? 'text-rose-700' : 'text-amber-700'
                }`}>
                  {call.error_message ||
                    'Click "Analyze Call" to run Whisper transcription, Gemini conversation intelligence, and 6-factor Purchase Potential scoring.'}
                </p>
              </div>
              {onAnalyzeCall && !isAnalyzing && (
                <button
                  onClick={() => onAnalyzeCall(call)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  {call.analysis_status === 'failed' ? 'Retry Analysis' : 'Analyze Now'}
                </button>
              )}
              {isAnalyzing && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 text-slate-600 shrink-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Running…
                </span>
              )}
            </div>
          )}

          {/* AI Analysis Results — only shown after completion */}
          {isCompleted && (
            <>
              {/* Sentiment & Purchase Potential */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Sentiment Analysis
                    </span>
                    <SentimentBadge sentiment={call.sentiment} size="lg" />
                  </div>
                  {call.sentiment_explanation && (
                    <div className="pt-2">
                      <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                        Customer Attitude Reasoning
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/90 p-3 rounded-lg border border-slate-100">
                        "{call.sentiment_explanation}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Purchase Potential
                    </span>
                    {call.purchase_score_label && (
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded font-medium">
                        {call.purchase_score_label}
                      </span>
                    )}
                  </div>
                  <PurchaseScore
                    score={potentialScore}
                    factors={call.purchase_factors}
                    isCompact={false}
                  />
                </div>
              </div>

              {/* Conversation Intelligence */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Conversation Intelligence &amp; Strategic Synthesis
                  </h3>
                </div>

                {call.summary && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Executive Conversation Summary
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                      {call.summary}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {call.customer_needs?.length > 0 && (
                    <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-100 space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Identified Needs
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {call.customer_needs.map((need, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-blue-500 font-bold">•</span>
                            <span>{need}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {call.buying_signals?.length > 0 && (
                    <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-100/70 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Buying Signals
                      </h4>
                      <ul className="space-y-1.5 text-xs text-emerald-800">
                        {call.buying_signals.map((signal, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {call.objections?.length > 0 && (
                    <div className="p-3.5 rounded-lg bg-rose-50/50 border border-rose-100/70 space-y-2 md:col-span-2">
                      <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Objections &amp; Barriers
                      </h4>
                      <ul className="space-y-1.5 text-xs text-rose-800">
                        {call.objections.map((obj, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {call.recommended_next_action && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/90 to-blue-50/80 border border-indigo-200/70 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                        Recommended Next Action
                      </span>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">
                        {call.recommended_next_action}
                      </p>
                    </div>
                  </div>
                )}

                {/* Evidence quotes */}
                {call.evidence?.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verbatim Evidence</h4>
                    {call.evidence.map((quote, idx) => (
                      <blockquote
                        key={idx}
                        className="text-xs text-slate-600 italic pl-4 border-l-2 border-indigo-300 bg-slate-50 py-2 pr-3 rounded-r-lg"
                      >
                        "{quote}"
                      </blockquote>
                    ))}
                  </div>
                )}
              </div>

              {/* Transcript */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Whisper Audio Transcript
                    </h3>
                  </div>
                  {call.transcript_segments?.length > 0 && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {call.transcript_segments.length} segments
                    </span>
                  )}
                </div>

                {call.transcript_segments?.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {call.transcript_segments.map((seg, idx) => (
                      <div key={idx} className="flex gap-3 text-xs">
                        <span className="font-mono text-slate-400 shrink-0 pt-0.5 w-14 text-right">
                          {Math.floor(seg.start / 60)}:{String(Math.round(seg.start % 60)).padStart(2, '0')}
                        </span>
                        <span className="text-slate-700 leading-relaxed">{seg.text}</span>
                      </div>
                    ))}
                  </div>
                ) : call.transcript ? (
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-60 overflow-y-auto">
                    {call.transcript}
                  </p>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Transcript not yet available. Run analysis to generate it.</p>
                  </div>
                )}
              </div>

              {/* Download Report Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">Executive Call Analysis Dossier</h4>
                    <p className="text-[11px] text-slate-500">PDF report with 6-dimension scores, formula, evidence, and transcript.</p>
                  </div>
                </div>
                <button
                  onClick={() => onDownloadReport(call)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
