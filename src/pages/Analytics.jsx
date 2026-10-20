import React from 'react';
import { Info, Target } from 'lucide-react';
import { getDashboardMetrics } from '../data/sampleCalls';

export default function Analytics({ calls, onSelectCall }) {
  const metrics = getDashboardMetrics(calls);

  const total = calls.length || 1;
  const posPct = Math.round((metrics.positiveCalls / total) * 100);
  const neuPct = Math.round((metrics.neutralCalls / total) * 100);
  const negPct = Math.round((metrics.negativeCalls / total) * 100);

  // Group purchase potential tiers according to Part 5 heuristic thresholds:
  // 70–100: High & Very High Potential
  // 50–69: Potential Lead
  // 30–49: Early Interest
  // 0–29: Low Potential
  const highPotential = calls.filter((c) => {
    const s = c.purchase_potential_score ?? c.purchase_likelihood ?? 0;
    return s >= 70;
  });
  const potentialLead = calls.filter((c) => {
    const s = c.purchase_potential_score ?? c.purchase_likelihood ?? 0;
    return s >= 50 && s < 70;
  });
  const earlyOrLow = calls.filter((c) => {
    const s = c.purchase_potential_score ?? c.purchase_likelihood ?? 0;
    return s < 50;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Conversation Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated sentiment trends, purchase potential distributions, and conversational signals.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold">
          <Info className="w-3.5 h-3.5 text-amber-600" />
          <span>Heuristic Decision Support</span>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Analyzed Calls
          </span>
          <div className="text-3xl font-bold text-slate-900 mt-2">{metrics.totalCalls}</div>
          <p className="text-xs text-slate-500 mt-1">100% processed through AI pipeline</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dominant Sentiment
          </span>
          <div className="text-3xl font-bold text-emerald-600 mt-2">Positive</div>
          <p className="text-xs text-slate-500 mt-1">Representing {posPct}% of recordings</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Mean Purchase Potential
          </span>
          <div className="text-3xl font-bold text-indigo-600 mt-2">{metrics.averagePurchaseLikelihood}/100</div>
          <p className="text-xs text-slate-500 mt-1">Heuristic 6-dimension decision-support score</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sentiment Distribution Chart */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Sentiment Distribution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Breakdown of customer emotional attitude across all processed calls
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-400">N={metrics.totalCalls}</span>
          </div>

          {/* Stacked Proportional Bar */}
          <div className="space-y-2">
            <div className="w-full h-5 bg-slate-100 rounded-xl overflow-hidden flex p-0.5 border border-slate-200">
              <div
                style={{ width: `${posPct}%` }}
                className="bg-emerald-500 h-full rounded-l-lg transition-all"
                title={`Positive: ${posPct}%`}
              />
              <div
                style={{ width: `${neuPct}%` }}
                className="bg-amber-400 h-full transition-all"
                title={`Neutral: ${neuPct}%`}
              />
              <div
                style={{ width: `${negPct}%` }}
                className="bg-rose-500 h-full rounded-r-lg transition-all"
                title={`Negative: ${negPct}%`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-medium px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Positive ({posPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Neutral ({neuPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Negative ({negPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Purchase Potential Distribution */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Purchase Potential Distribution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Heuristic classification based on the 6 scoring dimensions
              </p>
            </div>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="space-y-4">
            {/* High & Very High Potential */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  High &amp; Very High Potential (70–100)
                </span>
                <span className="text-slate-500 font-mono">
                  {highPotential.length} calls ({Math.round((highPotential.length / total) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(highPotential.length / total) * 100}%` }}
                />
              </div>
            </div>

            {/* Potential Lead */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Potential Lead (50–69)
                </span>
                <span className="text-slate-500 font-mono">
                  {potentialLead.length} calls ({Math.round((potentialLead.length / total) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(potentialLead.length / total) * 100}%` }}
                />
              </div>
            </div>

            {/* Early Interest & Low Potential */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Early Interest &amp; Low Potential (&lt; 50)
                </span>
                <span className="text-slate-500 font-mono">
                  {earlyOrLow.length} calls ({Math.round((earlyOrLow.length / total) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all"
                  style={{ width: `${(earlyOrLow.length / total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick list of call scores */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Individual Call Scores
            </h4>
            <div className="space-y-2">
              {calls.map((call) => {
                const callLabel = call.call_label || `Call #${call.call_id.replace('CALL-', '')}`;
                const scoreVal = call.purchase_potential_score ?? call.purchase_likelihood;

                return (
                  <div
                    key={call.call_id}
                    onClick={() => onSelectCall(call)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100/90 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-indigo-600">
                        {call.call_id}
                      </span>
                      <span className="text-xs text-slate-800 font-medium">
                        {callLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {scoreVal != null ? `${scoreVal}/100` : '—'}
                      </span>
                      <span className="text-[11px] text-slate-400">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
