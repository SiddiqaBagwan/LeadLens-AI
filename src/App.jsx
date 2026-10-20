import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CallDetail from './components/CallDetail';
import NotificationToast from './components/NotificationToast';
import Overview from './pages/Overview';
import CallRecordings from './pages/CallRecordings';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import { fetchCalls, analyzeCall, getReportDownloadUrl } from './api';

export default function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [selectedCall, setSelectedCall] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Calls state — loaded from backend
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Track which calls are currently being analyzed
  const [analyzingIds, setAnalyzingIds] = useState(new Set());

  const loadCalls = useCallback(async () => {
    try {
      const data = await fetchCalls();
      setCalls(data);
      setLoadError(null);
      // Keep selected call in sync with fresh data
      setSelectedCall((prev) =>
        prev ? data.find((c) => c.call_id === prev.call_id) || prev : null
      );
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const handleAnalyzeCall = useCallback(async (call) => {
    const id = call.call_id;
    if (analyzingIds.has(id)) return;

    setAnalyzingIds((prev) => new Set([...prev, id]));
    setNotification({
      type: 'info',
      title: 'Analysis Started',
      message: `Transcribing ${id} via Whisper and analyzing with Gemini AI. This may take 1–3 minutes.`,
    });

    try {
      const updated = await analyzeCall(id);
      // Merge updated call into state
      setCalls((prev) => prev.map((c) => (c.call_id === id ? { ...c, ...updated } : c)));
      setSelectedCall((prev) => (prev?.call_id === id ? { ...prev, ...updated } : prev));
      const callLabel = call.call_label || `Call #${id.replace('CALL-', '')}`;
      setNotification({
        type: 'success',
        title: 'Analysis Complete',
        message: `${id} (${callLabel}) has been fully analyzed. Open the dossier to view results.`,
      });
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Analysis Failed',
        message: err.message,
      });
    } finally {
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [analyzingIds]);

  const handleDownloadReport = useCallback((call) => {
    if (call.analysis_status !== 'completed') {
      setNotification({
        type: 'warning',
        title: 'Analysis Required',
        message: `Please analyze ${call.call_id} before downloading its PDF report.`,
      });
      return;
    }
    const url = getReportDownloadUrl(call.call_id);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LeadLens_${call.call_id}_Report.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const getTitle = () => {
    switch (currentView) {
      case 'overview': return 'Overview Dashboard';
      case 'calls': return 'Call Recordings & Audio';
      case 'analytics': return 'Conversation Analytics';
      case 'reports': return 'Reports & Dossiers';
      default: return 'Portal';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="lg:ml-64 flex-1 flex flex-col min-w-0">
        <Header
          onOpenMobile={() => setMobileOpen(true)}
          currentViewTitle={getTitle()}
          onRefresh={loadCalls}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {/* Global error banner */}
          {loadError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
              <span className="text-red-500 font-bold mt-0.5">⚠</span>
              <div>
                <p className="font-semibold">Could not connect to backend</p>
                <p className="text-xs text-red-600 mt-0.5">{loadError}</p>
                <p className="text-xs text-red-500 mt-1">
                  Make sure the FastAPI server is running: <code className="font-mono bg-red-100 px-1 py-0.5 rounded">uvicorn backend.main:app --reload</code>
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Connecting to LeadLens API…</p>
              </div>
            </div>
          ) : (
            <>
              {currentView === 'overview' && (
                <Overview
                  calls={calls}
                  onSelectCall={setSelectedCall}
                  onNavigateToCalls={() => setCurrentView('calls')}
                  onAnalyzeCall={handleAnalyzeCall}
                  analyzingIds={analyzingIds}
                />
              )}
              {currentView === 'calls' && (
                <CallRecordings
                  calls={calls}
                  onSelectCall={setSelectedCall}
                  onAnalyzeCall={handleAnalyzeCall}
                  analyzingIds={analyzingIds}
                />
              )}
              {currentView === 'analytics' && (
                <Analytics
                  calls={calls}
                  onSelectCall={setSelectedCall}
                />
              )}
              {currentView === 'reports' && (
                <Reports
                  calls={calls}
                  onDownloadReport={handleDownloadReport}
                  onSelectCall={setSelectedCall}
                  onAnalyzeCall={handleAnalyzeCall}
                  analyzingIds={analyzingIds}
                />
              )}
            </>
          )}
        </main>

        <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>LeadLens — AI-Powered Call Analysis &amp; Admin Portal</span>
            <span className="text-[11px] text-slate-400">
              FastAPI · Whisper · Gemini 2.5 Flash · ReportLab
            </span>
          </div>
        </footer>
      </div>

      {selectedCall && (
        <CallDetail
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
          onDownloadReport={handleDownloadReport}
          onAnalyzeCall={handleAnalyzeCall}
          isAnalyzing={analyzingIds.has(selectedCall.call_id)}
        />
      )}

      {notification && (
        <NotificationToast
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
