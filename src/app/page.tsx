'use client';

import { useState, useEffect } from 'react';

interface HistoryItem {
  url: string;
  title: string;
  downloadUrl: string;
  createdAt: string;
}

const HISTORY_KEY = 'epub-history';
const MAX_HISTORY = 10;

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  function saveToHistory(item: HistoryItem) {
    const updated = [item, ...history.filter(h => h.url !== item.url)].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  async function onGenerate() {
    if (loading) return;
    setLoading(true);
    setStatus('');
    setDownloadUrl('');
    setIsError(false);

    try {
      const r = await fetch('/api/epub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        throw new Error(data?.error || `Failed (${r.status})`);
      }

      setDownloadUrl(data.downloadUrl);
      setStatus(data.cached ? 'Retrieved from cache' : 'EPUB ready');

      saveToHistory({
        url,
        title: data.title || new URL(url).hostname,
        downloadUrl: data.downloadUrl,
        createdAt: new Date().toISOString(),
      });
    } catch (e: any) {
      setIsError(true);
      setStatus(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-16 px-4 gap-4">

      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">URL → EPUB</h1>
          </div>
          <p className="text-slate-500 text-sm mt-2">
            Paste any article URL and get a clean EPUB ready for your e-reader.
          </p>
        </div>

        {/* Input area */}
        <div className="px-8 pb-6">
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
              placeholder="https://example.com/article"
              className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <button
              onClick={onGenerate}
              disabled={loading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7" />
                  <polyline points="6 17 11 12 6 7" />
                </svg>
              )}
              {loading ? 'Generating' : 'Generate'}
            </button>
          </div>

          {/* Status area */}
          <div className="mt-4 min-h-[80px] flex flex-col justify-start gap-2">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Fetching and converting article…
              </div>
            )}

            {status && !loading && (
              <p className={`text-sm flex items-center gap-1.5 ${isError ? 'text-red-500' : 'text-emerald-600'}`}>
                {isError ? (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {status}
              </p>
            )}

            {downloadUrl && (
              <a
                href={downloadUrl}
                download
                className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download EPUB
              </a>
            )}
          </div>
        </div>

        {/* How it works footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-8 py-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">How it works</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { step: '1', label: 'Paste URL', desc: 'Any public article or blog post' },
              { step: '2', label: 'We extract', desc: 'Reader-mode content, no clutter' },
              { step: '3', label: 'Download', desc: 'Clean EPUB for any e-reader' },
            ].map(({ step, label, desc }) => (
              <div key={step} className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-indigo-500">Step {step}</span>
                <span className="text-xs font-medium text-slate-700">{label}</span>
                <span className="text-xs text-slate-400">{desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent conversions */}
      {history.length > 0 && (
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Recent conversions</p>
            <button
              onClick={clearHistory}
              className="text-xs text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {history.map((item) => (
              <div
                key={item.url}
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
              >
                <div className="w-7 h-7 bg-slate-100 rounded-md flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400 truncate">{item.url}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
                  <a
                    href={item.downloadUrl}
                    download
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </main>
  );
}
