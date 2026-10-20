import React from 'react';
import { ChevronRight, Clock, FileAudio, Eye, PhoneCall, Play, Loader2 } from 'lucide-react';
import SentimentBadge from './SentimentBadge';
import StatusBadge from './StatusBadge';
import PurchaseScore from './PurchaseScore';

export default function CallsTable({ calls, onSelectCall, onAnalyzeCall, analyzingIds }) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 pl-6">Call ID</th>
              <th className="py-3.5 px-4">Recording</th>
              <th className="py-3.5 px-4">Duration</th>
              <th className="py-3.5 px-4">Sentiment</th>
              <th className="py-3.5 px-4">Purchase Potential</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 pr-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {calls.map((call) => {
              const callLabel = call.call_label || `Call #${call.call_id.replace('CALL-', '')}`;
              const potentialScore = call.purchase_potential_score ?? call.purchase_likelihood;

              return (
                <tr
                  key={call.call_id}
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => onSelectCall(call)}
                >
                  {/* Call ID */}
                  <td className="py-4 px-4 pl-6 font-mono text-xs font-semibold text-indigo-600">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                      <PhoneCall className="w-3 h-3 text-indigo-500" />
                      <span>{call.call_id}</span>
                    </div>
                  </td>

                  {/* Recording / Call Label */}
                  <td className="py-4 px-4">
                    <div className="font-semibold text-slate-800">{callLabel}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <FileAudio className="w-3 h-3 text-slate-400" />
                      <span>{call.original_filename || 'audio.mp4'}</span>
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="py-4 px-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{call.duration_formatted || '—'}</span>
                    </div>
                  </td>

                  {/* Sentiment */}
                  <td className="py-4 px-4">
                    <SentimentBadge sentiment={call.sentiment} />
                  </td>

                  {/* Purchase Potential */}
                  <td className="py-4 px-4">
                    <PurchaseScore score={potentialScore} isCompact={true} />
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    {analyzingIds?.has(call.call_id) ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-700">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing…
                      </span>
                    ) : (
                      <StatusBadge status={call.analysis_status} />
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 pr-6 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {call.analysis_status !== 'completed' && !analyzingIds?.has(call.call_id) && onAnalyzeCall && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onAnalyzeCall(call); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          Analyze
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCall(call);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50/60 hover:bg-indigo-600 hover:text-white border border-indigo-100 transition-all duration-150 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
