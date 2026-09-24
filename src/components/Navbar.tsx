import React, { useEffect, useState } from 'react';
import { CloudRain, RefreshCw, Terminal, Activity, Clock } from 'lucide-react';
import { HealthApiResponse } from '../types/weather';

interface NavbarProps {
  onRefresh: () => void;
  isLoading: boolean;
  onOpenInspector: () => void;
  selectedArea: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRefresh,
  isLoading,
  onOpenInspector,
  selectedArea,
}) => {
  const [healthStatus, setHealthStatus] = useState<HealthApiResponse | null>(null);
  const [countdown, setCountdown] = useState<number>(60);

  // Poll health on mount
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setHealthStatus(data);
        }
      } catch (_e) {
        // Ignore silent health poll failure
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for automatic live refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onRefresh();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onRefresh]);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-sky-500 p-0.5 shadow-lg shadow-emerald-900/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <CloudRain className="text-emerald-400" size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">
                Singapore Live Weather
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                2-Hr NEA Radar
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Area forecast overlay on interactive Singapore map & transit feed
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Health indicator */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
            title={healthStatus ? `Service: ${healthStatus.service} | Status: ${healthStatus.status}` : 'Checking /api/health...'}
          >
            <span className={`w-2 h-2 rounded-full ${healthStatus?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-mono text-slate-400">/api/health:</span>
            <span className="text-emerald-400 font-semibold">{healthStatus?.status || 'Active'}</span>
          </div>

          {/* Refresh Button with countdown */}
          <button
            onClick={() => {
              onRefresh();
              setCountdown(60);
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition"
            title="Refresh weather data now"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-emerald-400' : 'text-slate-400'} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="text-[10px] text-slate-500 font-mono">({countdown}s)</span>
          </button>

          {/* API Inspector Button */}
          <button
            onClick={onOpenInspector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-semibold text-emerald-300 transition"
          >
            <Terminal size={14} />
            <span>API Tester</span>
          </button>
        </div>
      </div>
    </header>
  );
};
