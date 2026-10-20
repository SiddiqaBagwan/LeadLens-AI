import React, { useState } from 'react';
import { Mic, Search, Filter } from 'lucide-react';
import CallsTable from '../components/CallsTable';

export default function CallRecordings({ calls, onSelectCall, onAnalyzeCall, analyzingIds }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');

  const filteredCalls = calls.filter((call) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (call.call_id && call.call_id.toLowerCase().includes(term)) ||
      (call.call_label && call.call_label.toLowerCase().includes(term)) ||
      (call.original_filename && call.original_filename.toLowerCase().includes(term));

    const matchesSentiment =
      sentimentFilter === 'ALL' ||
      (call.sentiment && call.sentiment.toUpperCase() === sentimentFilter);

    return matchesSearch && matchesSentiment;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Call Recordings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, search, and inspect customer conversations and AI analysis dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
            {calls.length} Total Recordings
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Call ID, filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
          </span>
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            {['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSentimentFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  sentimentFilter === tab
                    ? 'bg-white text-indigo-700 font-semibold shadow-2xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredCalls.length > 0 ? (
        <CallsTable
          calls={filteredCalls}
          onSelectCall={onSelectCall}
          onAnalyzeCall={onAnalyzeCall}
          analyzingIds={analyzingIds}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Mic className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No calls matched your filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or reset the sentiment filter to see all recordings.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSentimentFilter('ALL');
            }}
            className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
