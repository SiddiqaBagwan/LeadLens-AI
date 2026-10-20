import React from 'react';
import { CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;

  if (normalized === 'completed' || normalized === 'ready' || normalized === 'available') {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200/70';
    Icon = CheckCircle2;
  } else if (normalized === 'processing') {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200/70';
    Icon = Loader2;
  } else if (normalized === 'pending') {
    colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
    Icon = Clock;
  } else if (normalized === 'failed') {
    colorClasses = 'bg-red-50 text-red-700 border-red-200/70';
    Icon = AlertCircle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colorClasses}`}>
      <Icon className={`w-3.5 h-3.5 ${normalized === 'processing' ? 'animate-spin' : ''}`} />
      <span className="capitalize">{status || 'Pending'}</span>
    </span>
  );
}
