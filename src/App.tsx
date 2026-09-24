import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Bus, AlertCircle, CheckCircle2, XCircle, Search, Info } from 'lucide-react';

interface BusService {
  ServiceNo: string;
  nextBuses: number[];
  minutes?: number[];
  nextBus?: number;
  nextBus2?: number;
}

interface HealthData {
  keyConfigured: boolean;
  ltaAnswered: boolean;
  upstreamStatus: number | null;
  error?: string;
}

const PRESET_STOPS = [
  { code: '04121', name: 'SMU / Stamford Rd (Default)' },
  { code: '01012', name: 'Victoria St (Hotel Grand Pacific)' },
  { code: '04111', name: 'Capitol Bldg / Stamford Rd' },
  { code: '08057', name: 'Dhoby Ghaut Stn Exit B' },
  { code: '03019', name: 'Opp Peninsula Plaza' },
];

export default function App() {
  const [busStopCode, setBusStopCode] = useState<string>('04121');
  const [searchInput, setSearchInput] = useState<string>('04121');
  const [services, setServices] = useState<BusService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(20);

  // Health modal / diagnostic status
  const [showHealth, setShowHealth] = useState<boolean>(false);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);

  // Today's date formatted for legal licence footer requirement
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const fetchArrivals = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const res = await fetch(`/api/bus?BusStopCode=${encodeURIComponent(busStopCode)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || `Error: Received HTTP ${res.status}`);
        setServices([]);
      } else {
        const list: BusService[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.services)
            ? data.services
            : [];
        setServices(list);
        setLastUpdated(new Date());
        setCountdown(20);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch bus arrivals');
      setServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [busStopCode]);

  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthData(data);
    } catch (err: any) {
      setHealthData({
        keyConfigured: false,
        ltaAnswered: false,
        upstreamStatus: null,
        error: err?.message || 'Failed to contact health endpoint',
      });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Initial fetch and when bus stop changes
  useEffect(() => {
    fetchArrivals(false);
  }, [fetchArrivals]);

  // 20-second automatic refresh timer matching LTA refresh cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchArrivals(true);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchArrivals]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (clean) {
      setBusStopCode(clean);
      setCountdown(20);
    }
  };

  const handleSelectPreset = (code: string) => {
    setSearchInput(code);
    setBusStopCode(code);
    setCountdown(20);
  };

  const formatArrival = (mins: number) => {
    // Under one minute shows "Arriving"
    if (mins < 1) {
      return (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          Arriving
        </span>
      );
    }
    return (
      <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
        {mins} {mins === 1 ? 'min' : 'mins'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Bar - Strict 3-zone contract */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand title wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Live Bus Arrivals
            </h1>
          </div>

          {/* Zone 2: Quiet unboxed metadata / active stop info */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Bus Stop {busStopCode}</span>
            <span aria-hidden="true">·</span>
            <span>20s Live Refresh</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Next update in {countdown}s</span>
          </div>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowHealth(true);
                checkHealth();
              }}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              API Status
            </button>
            <button
              onClick={() => fetchArrivals(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Bus Stop Selector & Controls */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <label htmlFor="busStopCode" className="sr-only">
                Bus Stop Code
              </label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="busStopCode"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter 5-digit bus stop code (e.g. 04121)"
                maxLength={6}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg transition-colors whitespace-nowrap"
            >
              Load Stop
            </button>
          </form>

          {/* Quick Preset Selector */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Quick stops:
            </span>
            {PRESET_STOPS.map((preset) => {
              const active = busStopCode === preset.code;
              return (
                <button
                  key={preset.code}
                  onClick={() => handleSelectPreset(preset.code)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono">{preset.code}</span> · {preset.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </section>

        {/* Error Notification Banner */}
        {error && (
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-200 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-medium text-red-900 dark:text-red-100">Service Notice</p>
              <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm">{error}</p>
            </div>
            <button
              onClick={() => fetchArrivals(false)}
              className="text-xs font-semibold px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Arrival Board Panel */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Panel Header */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Stop {busStopCode} Bus Arrivals
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Next two arrivals per service · Times rounded down to whole minutes
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              {lastUpdated && (
                <span>
                  Updated{' '}
                  <span className="font-mono tabular-nums">
                    {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </span>
              )}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between gap-4 animate-pulse">
                  <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="flex items-center gap-6">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            /* Empty State: Whole stop has no buses */
            <div className="py-12 px-6 text-center space-y-2">
              <Bus className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No buses currently operating at this bus stop.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No upcoming arrivals reported by LTA for stop {busStopCode}. Please verify the code or try again later.
              </p>
            </div>
          ) : (
            /* Populated Service List */
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {services.map((service, idx) => {
                const buses = Array.isArray(service.nextBuses)
                  ? service.nextBuses
                  : Array.isArray(service.minutes)
                    ? service.minutes
                    : [];
                const hasBuses = buses.length > 0;

                return (
                  <div
                    key={`${service.ServiceNo}-${idx}`}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Service Number */}
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-9 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 rounded-md flex items-center justify-center font-bold text-base font-mono tracking-tight shadow-xs">
                        {service.ServiceNo}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 sm:hidden">
                        Service {service.ServiceNo}
                      </span>
                    </div>

                    {/* Arrival Times or Plain Sentence */}
                    <div className="flex items-center">
                      {hasBuses ? (
                        <div className="flex items-center gap-6 sm:gap-10 text-sm">
                          {/* Next Bus */}
                          <div className="flex flex-col sm:items-end">
                            <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
                              Next Bus
                            </span>
                            <div className="mt-0.5">
                              {formatArrival(buses[0])}
                            </div>
                          </div>

                          {/* 2nd Bus (if available) */}
                          <div className="flex flex-col sm:items-end">
                            <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
                              Subsequent Bus
                            </span>
                            <div className="mt-0.5">
                              {buses.length > 1 ? (
                                formatArrival(buses[1])
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  Not available
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Plain sentence when a service has no buses running */
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                          No buses currently operating for this service.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Informational Guidance Note */}
        <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 px-1">
          <Info className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500 mt-0.5" />
          <p>
            Arrival estimates are updated dynamically every 20 seconds. Arrivals under 1 minute are displayed as &quot;Arriving&quot;.
          </p>
        </div>
      </main>

      {/* Health / Diagnostic Modal */}
      {showHealth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                API Diagnostics & Health
              </h3>
              <button
                onClick={() => setShowHealth(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {healthLoading ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                <p>Probing /api/health...</p>
              </div>
            ) : healthData ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">Credential Configured</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    {healthData.keyConfigured ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300">Configured</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-amber-700 dark:text-amber-300">Missing LTA_ACCOUNT_KEY</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">LTA Upstream Responded</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    {healthData.ltaAnswered ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300">
                          Answered (HTTP {healthData.upstreamStatus})
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500">Not reached</span>
                      </>
                    )}
                  </div>
                </div>

                {healthData.error && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/60">
                    {healthData.error}
                  </p>
                )}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={checkHealth}
                disabled={healthLoading}
                className="px-3.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Re-check
              </button>
              <button
                onClick={() => setShowHealth(false)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Licence Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center sm:text-left">
          Contains information from LTA DataMall Bus Arrival accessed on {formattedDate} from the Land Transport Authority (LTA DataMall), which is made available under the terms of the Singapore Open Data Licence version 1.0{' '}
          <a
            href="https://data.gov.sg/open-data-licence"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            https://data.gov.sg/open-data-licence
          </a>
          . This is an SMU course project and is not affiliated with or endorsed by the Land Transport Authority.
        </div>
      </footer>
    </div>
  );
}
