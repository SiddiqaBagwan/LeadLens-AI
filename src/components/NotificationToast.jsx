import React, { useEffect } from 'react';
import { Info, X, CheckCircle2, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    label: 'Success',
    iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    labelColor: 'text-emerald-700',
    border: 'border-emerald-100',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    iconBg: 'bg-rose-50 border-rose-100 text-rose-600',
    labelColor: 'text-rose-700',
    border: 'border-rose-100',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    iconBg: 'bg-amber-50 border-amber-100 text-amber-600',
    labelColor: 'text-amber-700',
    border: 'border-amber-100',
  },
  info: {
    icon: Loader2,
    label: 'In Progress',
    iconBg: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    labelColor: 'text-indigo-700',
    border: 'border-indigo-100',
    spin: true,
  },
};

export default function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  const typeKey = notification.type || 'info';
  const cfg = TYPE_CONFIG[typeKey] || TYPE_CONFIG.info;
  const Icon = cfg.icon;

  // Auto-dismiss success/warning after 6s
  useEffect(() => {
    if (typeKey === 'success' || typeKey === 'warning') {
      const t = setTimeout(onClose, 6000);
      return () => clearTimeout(t);
    }
  }, [typeKey, onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className={`bg-white border ${cfg.border} rounded-2xl p-4 shadow-xl ring-1 ring-slate-900/5`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
            <Icon className={`w-5 h-5 ${cfg.spin ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1 pr-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${cfg.labelColor}`}>
              {cfg.label}
            </span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
              {notification.title}
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {notification.message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
