import React, { useState, useMemo } from 'react';
import { AreaMetadata, AreaForecast } from '../types/weather';
import { projectGeoToSvg, getWeatherVisuals, categorizeForecast } from '../utils/weatherUtils';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  MapPin,
  Layers,
  Filter
} from 'lucide-react';

interface SingaporeMapProps {
  areaMetadata: AreaMetadata[];
  forecasts: AreaForecast[];
  selectedArea: string;
  onSelectArea: (areaName: string) => void;
}

export const SingaporeMap: React.FC<SingaporeMapProps> = ({
  areaMetadata,
  forecasts,
  selectedArea,
  onSelectArea,
}) => {
  const [zoom, setZoom] = useState(1);
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Map area name to forecast string
  const forecastMap = useMemo(() => {
    const map = new Map<string, string>();
    forecasts.forEach(f => {
      map.set(f.area.toLowerCase(), f.forecast);
    });
    return map;
  }, [forecasts]);

  // Aggregate condition counts
  const conditionStats = useMemo(() => {
    const stats = {
      all: forecasts.length,
      partly_cloudy: 0,
      showers: 0,
      thundery_showers: 0,
      cloudy: 0,
    };
    forecasts.forEach(f => {
      const cat = categorizeForecast(f.forecast);
      if (cat === 'partly_cloudy') stats.partly_cloudy++;
      else if (cat === 'thundery_showers') stats.thundery_showers++;
      else if (cat === 'showers' || cat === 'heavy_rain') stats.showers++;
      else stats.cloudy++;
    });
    return stats;
  }, [forecasts]);

  const renderWeatherIcon = (forecast: string, size = 16) => {
    const cat = categorizeForecast(forecast);
    switch (cat) {
      case 'thundery_showers':
        return <CloudLightning className="text-purple-400" size={size} />;
      case 'heavy_rain':
      case 'showers':
        return <CloudRain className="text-sky-400" size={size} />;
      case 'cloudy':
        return <Cloud className="text-slate-300" size={size} />;
      case 'partly_cloudy':
        return <CloudSun className="text-amber-400" size={size} />;
      default:
        return <Sun className="text-yellow-400" size={size} />;
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-2xl flex flex-col">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Compass size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              Interactive Singapore Weather Map
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                47 NEA Sectors
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Click any sector to query 2-hour forecast & transport details</p>
          </div>
        </div>

        {/* Condition Filters */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => setFilterCondition('all')}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              filterCondition === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-medium'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            All ({conditionStats.all})
          </button>
          <button
            onClick={() => setFilterCondition('partly_cloudy')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              filterCondition === 'partly_cloudy'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            <CloudSun size={13} className="text-amber-400" />
            <span>Fair / Cloudy ({conditionStats.partly_cloudy})</span>
          </button>
          <button
            onClick={() => setFilterCondition('showers')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              filterCondition === 'showers'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-medium'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            <CloudRain size={13} className="text-sky-400" />
            <span>Showers ({conditionStats.showers})</span>
          </button>
          <button
            onClick={() => setFilterCondition('thundery_showers')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              filterCondition === 'thundery_showers'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-medium'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            <CloudLightning size={13} className="text-purple-400" />
            <span>Thunder ({conditionStats.thundery_showers})</span>
          </button>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 ${
              showLabels
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Area Labels"
          >
            <Layers size={14} />
            <span className="hidden sm:inline">Labels</span>
          </button>
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.25, 2.2))}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.85))}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Reset Zoom"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* SVG Canvas Map Area */}
      <div className="relative w-full h-[520px] overflow-hidden bg-gradient-to-b from-[#070e1b] via-[#09152a] to-[#040914] flex items-center justify-center select-none">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

        <div
          className="w-full h-full transition-transform duration-300 ease-out origin-center flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <svg
            viewBox="0 0 800 480"
            className="w-full h-full max-h-[500px]"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="mainlandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#172554" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              <linearGradient id="selectedGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
              </linearGradient>

              <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Water bodies & Sea background representation */}
            <rect width="800" height="480" fill="transparent" />

            {/* Singapore Main Island & Topographic Contour Base */}
            <g className="transition-opacity duration-300">
              {/* Mainland Singapore detailed contour */}
              <path
                d="M 120 310
                   C 100 290, 80 270, 70 240
                   C 60 210, 75 180, 110 150
                   C 140 120, 190 85, 250 70
                   C 310 55, 390 60, 470 75
                   C 540 90, 610 120, 680 160
                   C 720 185, 750 220, 740 250
                   C 730 270, 690 285, 640 295
                   C 590 305, 520 315, 470 325
                   C 420 335, 370 345, 320 340
                   C 260 335, 200 325, 140 330
                   Z"
                fill="url(#mainlandGradient)"
                stroke="#334155"
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="opacity-90"
              />

              {/* Central Catchment Nature Reserve overlay tint */}
              <path
                d="M 330 140
                   C 360 120, 420 125, 440 155
                   C 450 180, 430 220, 390 230
                   C 350 240, 320 210, 315 175
                   Z"
                fill="#064e3b"
                fillOpacity="0.25"
                stroke="#047857"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Pulau Tekong (North-East) */}
              <path
                d="M 720 110 C 740 100, 765 115, 760 135 C 755 150, 730 145, 715 130 Z"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="1.2"
              />

              {/* Pulau Ubin (North-East) */}
              <path
                d="M 620 105 C 650 95, 680 105, 675 120 C 660 130, 630 125, 615 115 Z"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="1.2"
              />

              {/* Sentosa (South) */}
              <path
                d="M 370 365 C 410 360, 435 375, 420 390 C 395 400, 365 385, 370 365 Z"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="1.2"
              />

              {/* Jurong Island (South-West) */}
              <path
                d="M 180 345 C 220 340, 240 365, 230 385 C 210 405, 170 385, 180 345 Z"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="1.2"
              />

              {/* Southern Islands (Kusu, St John's, Lazarus) */}
              <circle cx="435" cy="410" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <circle cx="455" cy="420" r="7" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            </g>

            {/* Geographical Markers & Sectors */}
            {areaMetadata.map((area) => {
              const { x, y } = projectGeoToSvg(
                area.label_location.latitude,
                area.label_location.longitude
              );

              const forecast = forecastMap.get(area.name.toLowerCase()) || 'Partly Cloudy (Day)';
              const cat = categorizeForecast(forecast);

              // Filter out if not matching condition filter
              if (filterCondition !== 'all') {
                if (filterCondition === 'partly_cloudy' && cat !== 'partly_cloudy') return null;
                if (filterCondition === 'showers' && cat !== 'showers' && cat !== 'heavy_rain') return null;
                if (filterCondition === 'thundery_showers' && cat !== 'thundery_showers') return null;
              }

              const isSelected = selectedArea.toLowerCase() === area.name.toLowerCase();
              const isHovered = hoveredArea === area.name;
              const visuals = getWeatherVisuals(forecast);

              return (
                <g
                  key={area.name}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => onSelectArea(area.name)}
                  onMouseEnter={() => setHoveredArea(area.name)}
                  onMouseLeave={() => setHoveredArea(null)}
                >
                  {/* Highlight ring for selected sector */}
                  {isSelected && (
                    <>
                      <circle
                        r="24"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        className="animate-ping opacity-70"
                      />
                      <circle
                        r="18"
                        fill="rgba(16, 185, 129, 0.25)"
                        stroke="#10b981"
                        strokeWidth="2.5"
                      />
                    </>
                  )}

                  {/* Marker Pin Circle */}
                  <circle
                    r={isSelected ? 14 : isHovered ? 12 : 9}
                    fill={isSelected ? '#059669' : visuals.dotColor}
                    fillOpacity={isSelected ? 1 : 0.85}
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="transition-all duration-150 shadow-lg"
                  />

                  {/* Icon inside or above pin */}
                  <foreignObject
                    x={isSelected ? -12 : -8}
                    y={isSelected ? -12 : -8}
                    width={isSelected ? 24 : 16}
                    height={isSelected ? 24 : 16}
                    className="pointer-events-none flex items-center justify-center"
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      {renderWeatherIcon(forecast, isSelected ? 14 : 10)}
                    </div>
                  </foreignObject>

                  {/* Sector Name Label */}
                  {(showLabels || isSelected || isHovered) && (
                    <g transform="translate(0, 16)" className="pointer-events-none">
                      <rect
                        x={-area.name.length * 3.6 - 4}
                        y="-2"
                        width={area.name.length * 7.2 + 8}
                        height="15"
                        rx="4"
                        fill={isSelected ? '#065f46' : isHovered ? '#1e293b' : 'rgba(15, 23, 42, 0.85)'}
                        stroke={isSelected ? '#34d399' : '#334155'}
                        strokeWidth={isSelected ? '1.5' : '0.8'}
                      />
                      <text
                        x="0"
                        y="9"
                        textAnchor="middle"
                        fill={isSelected ? '#a7f3d0' : isHovered ? '#f8fafc' : '#cbd5e1'}
                        fontSize="9"
                        fontWeight={isSelected ? '700' : '500'}
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        {area.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Live Hover Info Floating Overlay */}
        {hoveredArea && (
          <div className="absolute bottom-4 left-4 z-20 pointer-events-none bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md flex items-center gap-3 animate-fade-in">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
              {renderWeatherIcon(forecastMap.get(hoveredArea.toLowerCase()) || 'Partly Cloudy (Day)', 22)}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin size={12} className="text-emerald-400" />
                <span>Sector Focus</span>
              </div>
              <p className="text-sm font-bold text-white">{hoveredArea}</p>
              <p className="text-xs text-slate-300 font-medium">
                {forecastMap.get(hoveredArea.toLowerCase()) || 'Partly Cloudy (Day)'}
              </p>
            </div>
          </div>
        )}

        {/* Compass Rose */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none opacity-60 flex flex-col items-center text-[10px] text-slate-400 font-mono">
          <span className="font-bold text-slate-300">N</span>
          <div className="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center my-0.5">
            <div className="w-2 h-2 bg-emerald-500 rotate-45" />
          </div>
          <span>S</span>
        </div>
      </div>

      {/* Map Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Partly Cloudy / Fair</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Light Rain / Showers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Thundery Showers</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <span>Active Selection:</span>
          <strong className="text-emerald-400 font-semibold">{selectedArea}</strong>
        </div>
      </div>
    </div>
  );
};
