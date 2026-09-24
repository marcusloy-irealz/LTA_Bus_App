import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bus, RefreshCw, Search, AlertCircle, Info, Clock, CheckCircle2, Navigation, ArrowRight } from 'lucide-react';

export interface BusService {
  ServiceNo: string;
  nextBuses: number[];
  minutes?: number[];
  nextBus?: number;
  nextBus2?: number;
}

export const PRESET_STOPS = [
  { code: '04121', name: 'SMU / Stamford Rd (Default)' },
  { code: '01012', name: 'Victoria St (Hotel Grand Pacific)' },
  { code: '04111', name: 'Capitol Bldg / Stamford Rd' },
  { code: '08057', name: 'Dhoby Ghaut Stn Exit B' },
  { code: '03019', name: 'Opp Peninsula Plaza' },
  { code: '54261', name: 'Ang Mo Kio Int' },
  { code: '84009', name: 'Bedok Int' },
  { code: '46009', name: 'Woodlands Temp Int' },
];

interface BusArrivalPanelProps {
  currentArea?: string;
  onSelectBusStopArea?: (area: string) => void;
}

export const BusArrivalPanel: React.FC<BusArrivalPanelProps> = ({
  currentArea = 'Ang Mo Kio',
}) => {
  const [busStopCode, setBusStopCode] = useState<string>('04121');
  const [searchInput, setSearchInput] = useState<string>('04121');
  const [services, setServices] = useState<BusService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(20);

  const fetchArrivals = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`/api/bus?BusStopCode=${encodeURIComponent(busStopCode)}`);
      const data = await res.json();

      if (!res.ok) {
        if (data?.sampleServices) {
          // Key missing in preview, use sample data so UI is interactive
          setServices(data.sampleServices);
          setIsDemoData(true);
          setError(data.error);
        } else {
          setError(data?.error || `Error: Received HTTP ${res.status}`);
          setServices([]);
        }
      } else {
        setIsDemoData(false);
        const list: BusService[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.services)
          ? data.services
          : [];
        setServices(list);
        setLastUpdated(new Date());
        setCountdown(20);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bus arrivals');
      setServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [busStopCode]);

  useEffect(() => {
    fetchArrivals(false);
  }, [fetchArrivals]);

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
    if (mins < 1) {
      return (
        <span className="font-bold text-emerald-400 animate-pulse flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Arriving
        </span>
      );
    }
    return (
      <span className="font-mono tabular-nums text-slate-100 font-semibold">
        {mins} {mins === 1 ? 'min' : 'mins'}
      </span>
    );
  };

  const activePreset = PRESET_STOPS.find(p => p.code === busStopCode);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl p-5 flex flex-col gap-4">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Bus size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              LTA DataMall Bus Arrivals
              {activePreset && (
                <span className="text-xs font-normal text-slate-400">
                  • {activePreset.name}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Live estimated times for incoming buses at Bus Stop <strong className="text-blue-400 font-mono">{busStopCode}</strong>
            </p>
          </div>
        </div>

        {/* Refresh & Countdown Timer */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchArrivals(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
            title="Refresh bus arrivals"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-blue-400' : 'text-slate-400'} />
            <span>Refresh</span>
            <span className="text-[10px] text-slate-500 font-mono">({countdown}s)</span>
          </button>
        </div>
      </div>

      {/* Bus Stop Search Form & Preset Chips */}
      <div className="space-y-2">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter 5-digit bus stop code (e.g. 04121, 54261)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            Query Stop
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] whitespace-nowrap">Presets:</span>
          {PRESET_STOPS.map((preset) => (
            <button
              key={preset.code}
              onClick={() => handleSelectPreset(preset.code)}
              className={`px-2.5 py-1 rounded-lg border text-xs whitespace-nowrap font-mono transition ${
                busStopCode === preset.code
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {preset.code} ({preset.name.split(' ')[0]})
            </button>
          ))}
        </div>
      </div>

      {/* Demo notice if key missing */}
      {isDemoData && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <AlertCircle size={14} className="shrink-0" />
          <span>
            Preview mode: Showing verified snapshot for Bus Stop {busStopCode}. To connect live LTA DataMall v3, set <code className="font-mono text-amber-200">LTA_ACCOUNT_KEY</code> in Secrets.
          </span>
        </div>
      )}

      {/* Services List */}
      <div className="space-y-2">
        {loading && !refreshing ? (
          <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw size={18} className="animate-spin text-blue-400" />
            <span>Fetching live LTA bus arrivals...</span>
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {services.map((service) => {
              const buses = service.nextBuses || service.minutes || [];
              const hasBuses = buses.length > 0;

              return (
                <div
                  key={service.ServiceNo}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  {/* Service Badge */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-9 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold font-mono text-sm shadow-inner">
                      {service.ServiceNo}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Bus {service.ServiceNo}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {hasBuses ? 'Operating' : 'No active buses'}
                      </span>
                    </div>
                  </div>

                  {/* Arrival Times */}
                  <div className="flex items-center gap-4 text-right">
                    {hasBuses ? (
                      <>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400">
                            Next
                          </span>
                          <span className="text-xs">
                            {formatArrival(buses[0])}
                          </span>
                        </div>

                        {buses.length > 1 && (
                          <div className="flex flex-col items-end border-l border-slate-800 pl-3">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400">
                              2nd
                            </span>
                            <span className="text-xs">
                              {formatArrival(buses[1])}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No buses running</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            {error || `No services found for bus stop ${busStopCode}.`}
          </div>
        )}
      </div>

      {/* Advisory & Commuter Guidance */}
      <div className="flex items-start gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/70">
        <Info size={14} className="shrink-0 text-blue-400 mt-0.5" />
        <p>
          Arrival estimates refresh automatically every 20 seconds. Data sourced via LTA DataMall v3 BusArrival endpoint.
        </p>
      </div>
    </div>
  );
};
