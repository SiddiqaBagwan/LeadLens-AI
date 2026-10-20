import React from 'react';
import { PhoneCall, ThumbsUp, ThumbsDown, TrendingUp, Sparkles, Activity, Clock } from 'lucide-react';
import StatCard from '../components/StatCard';
import CallsTable from '../components/CallsTable';
import { getDashboardMetrics } from '../data/sampleCalls';

export default function Overview({ calls, onSelectCall, onNavigateToCalls }) {
  const metrics = getDashboardMetrics(calls);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Call Intelligence Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Call Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Understand conversations. Identify buying signals. Improve conversions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-medium text-slate-600 shadow-2xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>4 Sample Calls Loaded</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Calls"
          value={metrics.totalCalls}
          subtitle="Analyzed recordings in dataset"
          icon={PhoneCall}
          colorScheme="indigo"
        />
        <StatCard
          title="Positive Sentiment"
          value={metrics.positiveCalls}
          subtitle={`${Math.round((metrics.positiveCalls / metrics.totalCalls) * 100)}% of conversations`}
          icon={ThumbsUp}
          colorScheme="emerald"
        />
        <StatCard
          title="Negative Sentiment"
          value={metrics.negativeCalls}
          subtitle="Identified price & SLA frictions"
          icon={ThumbsDown}
          colorScheme="rose"
        />
        <StatCard
          title="Avg. Purchase Potential"
          value={`${metrics.averagePurchaseLikelihood}/100`}
          subtitle="Aggregated decision-support heuristic"
          icon={TrendingUp}
          colorScheme="purple"
        />
      </div>

      {/* Recent Processing Status & Intelligence Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Recent Call Recordings
              </h2>
            </div>
            <button
              onClick={onNavigateToCalls}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View Full Table →
            </button>
          </div>
          <CallsTable calls={calls} onSelectCall={onSelectCall} />
        </div>

        {/* Processing Status & Phase Note */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Pipeline Status
            </h2>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Audio Ingestion</span>
                <span className="text-indigo-600 font-medium">Phase 2 Audio Link Ready</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Speech-to-Text</span>
                <span className="text-indigo-600 font-medium">Whisper Pipeline Ready</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                <span className="font-semibold text-slate-700">LLM Sentiment & Intent</span>
                <span className="text-indigo-600 font-medium">Gemini Schema Ready</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">PDF Report Generation</span>
                <span className="text-indigo-600 font-medium">FastAPI Endpoint Ready</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Phase 1 Frontend Note
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                All metrics are computed reactively from <span className="font-mono font-medium text-indigo-700">sampleCalls.js</span>. When backend endpoints are integrated, data hooks will swap seamlessly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
