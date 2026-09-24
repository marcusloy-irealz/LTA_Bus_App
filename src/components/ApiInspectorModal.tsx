import React, { useState } from 'react';
import { Terminal, Send, CheckCircle, AlertCircle, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';

interface ApiInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArea: string;
}

export const ApiInspectorModal: React.FC<ApiInspectorModalProps> = ({
  isOpen,
  onClose,
  currentArea,
}) => {
  const [activeEndpoint, setActiveEndpoint] = useState<'/api/2-hrs-forecast' | '/api/bus' | '/api/health'>('/api/2-hrs-forecast');
  const [customArea, setCustomArea] = useState<string>(currentArea || 'Ang Mo Kioh');
  const [responseJson, setResponseJson] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const testEndpoint = async (endpoint: '/api/2-hrs-forecast' | '/api/bus' | '/api/health' = activeEndpoint, areaParam = customArea) => {
    setIsLoading(true);
    const start = performance.now();
    try {
      let url: string = endpoint;
      if (endpoint !== '/api/health') {
        const params = new URLSearchParams();
        if (areaParam.trim()) {
          params.append('Area', areaParam.trim());
        }
        url = `${endpoint}?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      const end = performance.now();

      setStatusCode(res.status);
      setLatencyMs(Math.round(end - start));
      setResponseJson(JSON.stringify(data, null, 2));
    } catch (err) {
      const end = performance.now();
      setStatusCode(500);
      setLatencyMs(Math.round(end - start));
      setResponseJson(JSON.stringify({ error: err instanceof Error ? err.message : 'Fetch failed' }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!responseJson) return;
    navigator.clipboard.writeText(responseJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentUrl = activeEndpoint === '/api/health'
    ? '/api/health'
    : `${activeEndpoint}${customArea.trim() ? `?Area=${encodeURIComponent(customArea.trim())}` : ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Terminal size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">API Test Console & Live Endpoints</h3>
              <p className="text-xs text-slate-400">
                Inspect Vercel Serverless & Express Preview handlers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Endpoint Selector Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => {
                setActiveEndpoint('/api/2-hrs-forecast');
                testEndpoint('/api/2-hrs-forecast');
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-mono font-medium transition ${
                activeEndpoint === '/api/2-hrs-forecast'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              /api/2-hrs-forecast
            </button>
            <button
              onClick={() => {
                setActiveEndpoint('/api/bus');
                testEndpoint('/api/bus');
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-mono font-medium transition ${
                activeEndpoint === '/api/bus'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              /api/bus
            </button>
            <button
              onClick={() => {
                setActiveEndpoint('/api/health');
                testEndpoint('/api/health');
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-mono font-medium transition ${
                activeEndpoint === '/api/health'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              /api/health
            </button>
          </div>

          {/* Area Parameter Input (for /api/2-hrs-forecast and /api/bus) */}
          {activeEndpoint !== '/api/health' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-mono">Area parameter:</label>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  placeholder="Defaults to Ang Mo Kioh..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <button
                onClick={() => setCustomArea('Ang Mo Kioh')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                title="Reset to default requirement 'Ang Mo Kioh'"
              >
                Set Default (Ang Mo Kioh)
              </button>
            </div>
          )}

          {/* Execution Bar */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2 overflow-x-auto text-emerald-400 font-semibold">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px]">
                GET
              </span>
              <span className="truncate">{currentUrl}</span>
            </div>
            <button
              onClick={() => testEndpoint()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-sans text-xs font-semibold shadow-md transition"
            >
              {isLoading ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
              <span>Execute</span>
            </button>
          </div>

          {/* Response Meta Stats */}
          {statusCode !== null && (
            <div className="flex items-center justify-between text-xs px-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-300">
                  Status:{' '}
                  <strong className={`font-mono ${statusCode === 200 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {statusCode} OK
                  </strong>
                </span>
                {latencyMs !== null && (
                  <span className="text-slate-400">
                    Latency: <strong className="text-slate-200 font-mono">{latencyMs}ms</strong>
                  </span>
                )}
              </div>
              {responseJson && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              )}
            </div>
          )}

          {/* JSON Response View */}
          <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                <RefreshCw size={16} className="animate-spin text-emerald-400" />
                <span>Invoking API endpoint...</span>
              </div>
            ) : responseJson ? (
              <pre className="text-emerald-300/90 whitespace-pre-wrap">{responseJson}</pre>
            ) : (
              <div className="text-center py-6 text-slate-500">
                Click "Execute" to inspect live response payload
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Both Vercel Serverless and Express Preview bindings active</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
