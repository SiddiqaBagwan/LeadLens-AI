import React from 'react';
import { Smile, Meh, Frown } from 'lucide-react';

export default function SentimentBadge({ sentiment, confidence, showIcon = true, size = 'sm' }) {
  const normalized = (sentiment || '').toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Meh;

  if (normalized === 'positive') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    Icon = Smile;
  } else if (normalized === 'neutral') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200/80';
    Icon = Meh;
  } else if (normalized === 'negative') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/80';
    Icon = Frown;
  }

  const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses}`}>
      {showIcon && <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{sentiment || 'Unknown'}</span>
      {confidence !== undefined && (
        <span className="opacity-75 text-[10px] ml-0.5">({confidence}%)</span>
      )}
    </span>
  );
}
