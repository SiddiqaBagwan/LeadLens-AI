import React from 'react';
import { Target, DollarSign, Clock, CheckSquare, MessageSquare, AlertTriangle, Info, HelpCircle } from 'lucide-react';

export function getScoreLabel(score) {
  if (score === null || score === undefined) return 'Unknown';
  const n = Number(score);
  if (n >= 85) return 'Very High Potential';
  if (n >= 70) return 'High Potential';
  if (n >= 50) return 'Potential Lead';
  if (n >= 30) return 'Early Interest';
  return 'Low Potential';
}

export function getScoreBadgeStyle(score) {
  if (score === null || score === undefined) {
    return 'bg-slate-100 border-slate-200 text-slate-600';
  }
  const n = Number(score);
  if (n >= 85) return 'bg-emerald-100 border-emerald-300 text-emerald-800';
  if (n >= 70) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (n >= 50) return 'bg-blue-50 border-blue-200 text-blue-700';
  if (n >= 30) return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-rose-50 border-rose-200 text-rose-700';
}

export default function PurchaseScore({ score, factors, isCompact = false }) {
  const hasScore = score !== null && score !== undefined;
  const numScore = hasScore ? Math.max(0, Math.min(100, Number(score))) : null;

  // Determine bar color
  let barColor = 'bg-rose-500';
  if (numScore !== null) {
    if (numScore >= 70) barColor = 'bg-emerald-500';
    else if (numScore >= 50) barColor = 'bg-blue-500';
    else if (numScore >= 30) barColor = 'bg-amber-500';
  }

  if (isCompact) {
    if (!hasScore) {
      return (
        <span className="text-xs text-slate-400 font-medium italic">Pending</span>
      );
    }
    return (
      <div className="flex items-center gap-2.5">
        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
          <div
            className={`h-full ${barColor} transition-all duration-500`}
            style={{ width: `${numScore}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-slate-800 tabular-nums">
          {numScore}/100
        </span>
      </div>
    );
  }

  const label = getScoreLabel(numScore);
  const badgeStyle = getScoreBadgeStyle(numScore);

  // Extract factors details
  const getFactorData = (key) => {
    if (!factors) return { score: null, is_unknown: true, explanation: '', evidence: [] };
    const raw = factors[key];
    if (raw && typeof raw === 'object') {
      return {
        score: raw.score !== undefined ? raw.score : null,
        is_unknown: raw.score === null || raw.score === undefined || raw.is_unknown,
        explanation: raw.explanation || '',
        evidence: raw.evidence || [],
      };
    }
    if (typeof raw === 'number') {
      return { score: raw, is_unknown: false, explanation: '', evidence: [] };
    }
    return { score: null, is_unknown: true, explanation: '', evidence: [] };
  };

  const buyingIntent = getFactorData('buying_intent');
  const budgetFit = getFactorData('budget_fit');
  const urgencyTimeline = getFactorData('urgency_timeline') || getFactorData('urgency');
  const productFit = getFactorData('product_fit');
  const engagement = getFactorData('engagement');
  const objectionsImpact = getFactorData('objections_impact') || getFactorData('unresolved_objections');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Purchase Potential Score
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {hasScore ? `${numScore}/100` : 'Unknown'}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${badgeStyle}`}>
              {label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Explainable heuristic decision-support score (not a calibrated probability).
          </p>
        </div>
      </div>

      {/* Main Score Bar */}
      {hasScore && (
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5">
            <div
              className={`h-full rounded-full ${barColor} transition-all duration-700`}
              style={{ width: `${numScore}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
            <span>0 Low</span>
            <span>30 Early</span>
            <span>50 Potential</span>
            <span>70 High</span>
            <span>85+ Very High</span>
          </div>
        </div>
      )}

      {/* 6-Dimension Contributing Factor Breakdown */}
      {factors && (
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Scoring Dimensions Breakdown
            </h4>
            <span className="text-[11px] text-slate-400">
              5 Positive Factors · 1 Negative Barrier
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Buying Intent */}
            <FactorCard
              title="Buying Intent"
              weight="35%"
              type="positive"
              icon={Target}
              color="indigo"
              data={buyingIntent}
              help="Higher score = stronger expressed commitment"
            />

            {/* 2. Budget Fit */}
            <FactorCard
              title="Budget Fit"
              weight="20%"
              type="positive"
              icon={DollarSign}
              color="emerald"
              data={budgetFit}
              help="Affordability relative to price quote"
            />

            {/* 3. Urgency & Timeline */}
            <FactorCard
              title="Urgency & Timeline"
              weight="15%"
              type="positive"
              icon={Clock}
              color="amber"
              data={urgencyTimeline}
              help="Purchase or decision timeframe"
            />

            {/* 4. Product Fit */}
            <FactorCard
              title="Product Fit"
              weight="15%"
              type="positive"
              icon={CheckSquare}
              color="blue"
              data={productFit}
              help="Satisfaction of stated requirements"
            />

            {/* 5. Engagement */}
            <FactorCard
              title="Engagement"
              weight="15%"
              type="positive"
              icon={MessageSquare}
              color="purple"
              data={engagement}
              help="Meaningful conversational participation"
            />

            {/* 6. Objections Impact (Negative) */}
            <FactorCard
              title="Objections Impact"
              weight="-20%"
              type="negative"
              icon={AlertTriangle}
              color="rose"
              data={objectionsImpact}
              help="Higher score = more severe unresolved barriers"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FactorCard({ title, weight, type, icon: Icon, color, data, help }) {
  const isUnknown = data.is_unknown || data.score === null || data.score === undefined;
  const scoreVal = !isUnknown ? Math.round(Number(data.score)) : null;

  // Colors mapping
  const colorMap = {
    indigo: { bar: 'bg-indigo-500', icon: 'text-indigo-500', badge: 'text-indigo-700' },
    emerald: { bar: 'bg-emerald-500', icon: 'text-emerald-500', badge: 'text-emerald-700' },
    amber: { bar: 'bg-amber-500', icon: 'text-amber-500', badge: 'text-amber-700' },
    blue: { bar: 'bg-blue-500', icon: 'text-blue-500', badge: 'text-blue-700' },
    purple: { bar: 'bg-purple-500', icon: 'text-purple-500', badge: 'text-purple-700' },
    rose: { bar: 'bg-rose-500', icon: 'text-rose-500', badge: 'text-rose-700' },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      type === 'negative' ? 'bg-rose-50/40 border-rose-100' : 'bg-slate-50/80 border-slate-100'
    }`}>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Icon className={`w-3.5 h-3.5 ${scheme.icon}`} />
          {title}
          <span className="text-[10px] text-slate-400 font-normal">({weight})</span>
        </span>
        <span className="font-bold text-slate-900 tabular-nums">
          {isUnknown ? (
            <span className="text-slate-400 font-normal italic">Unknown</span>
          ) : (
            type === 'negative' ? `-${scoreVal}` : `${scoreVal}/100`
          )}
        </span>
      </div>

      {/* Mini Bar */}
      <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden mb-2">
        {!isUnknown ? (
          <div
            className={`h-full ${scheme.bar} rounded-full transition-all`}
            style={{ width: `${Math.min(100, Math.max(0, scoreVal))}%` }}
          />
        ) : (
          <div className="h-full bg-slate-200 rounded-full w-full" />
        )}
      </div>

      {/* Explanation / Evidence snippet */}
      {data.explanation ? (
        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
          {data.explanation}
        </p>
      ) : data.evidence && data.evidence.length > 0 ? (
        <p className="text-[11px] text-slate-600 italic line-clamp-2 leading-relaxed">
          "{data.evidence[0]}"
        </p>
      ) : (
        <p className="text-[10px] text-slate-400">{help}</p>
      )}
    </div>
  );
}
