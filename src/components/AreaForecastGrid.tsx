import React, { useState } from 'react';
import { AreaMetadata, AreaForecast } from '../types/weather';
import { getWeatherVisuals, getRegion } from '../utils/weatherUtils';
import { Search, MapPin, ChevronRight } from 'lucide-react';

interface AreaForecastGridProps {
  areaMetadata: AreaMetadata[];
  forecasts: AreaForecast[];
  selectedArea: string;
  onSelectArea: (areaName: string) => void;
}

export const AreaForecastGrid: React.FC<AreaForecastGridProps> = ({
  areaMetadata,
  forecasts,
  selectedArea,
  onSelectArea,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRegion, setActiveRegion] = useState<'All' | 'North' | 'South' | 'East' | 'West' | 'Central'>('All');

  // Create quick lookup for forecasts
  const forecastLookup = new Map<string, string>();
  forecasts.forEach(f => forecastLookup.set(f.area.toLowerCase(), f.forecast));

  // Filter items
  const filtered = areaMetadata.filter(area => {
    const matchesSearch = area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (forecastLookup.get(area.name.toLowerCase()) || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeRegion === 'All') return true;
    return getRegion(area.name) === activeRegion;
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl flex flex-col gap-4">
      {/* Search & Region Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search area (e.g. Ang Mo Kio, Bedok, Woodlands) or weather..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Region tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {(['All', 'North', 'South', 'East', 'West', 'Central'] as const).map(reg => (
            <button
              key={reg}
              onClick={() => setActiveRegion(reg)}
              className={`px-2.5 py-1.5 rounded-lg border transition whitespace-nowrap ${
                activeRegion === reg
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Sector Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
        {filtered.map(area => {
          const forecast = forecastLookup.get(area.name.toLowerCase()) || 'Partly Cloudy (Day)';
          const isSelected = selectedArea.toLowerCase() === area.name.toLowerCase();
          const visuals = getWeatherVisuals(forecast);

          return (
            <button
              key={area.name}
              onClick={() => onSelectArea(area.name)}
              className={`group flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/50'
                  : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="min-w-0 pr-1">
                <p className={`text-xs font-semibold truncate ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {area.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {forecast}
                </p>
              </div>

              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-emerald-400 animate-pulse' : ''}`}
                style={{ backgroundColor: isSelected ? undefined : visuals.dotColor }}
              />
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs">
            No areas found matching "{searchTerm}" in {activeRegion} region.
          </div>
        )}
      </div>
    </div>
  );
};
