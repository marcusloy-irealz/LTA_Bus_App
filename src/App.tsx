/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { SingaporeMap } from './components/SingaporeMap';
import { WeatherDetailCard } from './components/WeatherDetailCard';
import { AreaForecastGrid } from './components/AreaForecastGrid';
import { ApiInspectorModal } from './components/ApiInspectorModal';
import { BusArrivalPanel } from './components/BusArrivalPanel';
import { WeatherApiResponse, AreaMetadata, AreaForecast, HealthApiResponse } from './types/weather';
import {
  AlertCircle,
  CloudRain,
  MapPin,
  Sparkles,
  Terminal,
  ShieldCheck,
  Bus,
  CloudSun,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info
} from 'lucide-react';

export default function App() {
  const [selectedArea, setSelectedArea] = useState<string>('Ang Mo Kio');
  const [weatherData, setWeatherData] = useState<WeatherApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'weather_map' | 'bus_arrivals' | 'combined'>('combined');

  // Health / Diagnostics Modal
  const [showHealthModal, setShowHealthModal] = useState<boolean>(false);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);
  const [healthData, setHealthData] = useState<any>(null);

  // Today's date formatted for legal licence footer
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  // Fetch forecast data from the backend API
  const fetchWeather = useCallback(async (area = selectedArea) => {
    setIsLoading(true);
    setError(null);
    try {
      // Calls /api/2-hrs-forecast endpoint with Area parameter
      // (Also supported by /api/bus as specified in requirements)
      const res = await fetch(`/api/2-hrs-forecast?Area=${encodeURIComponent(area)}`);
      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}`);
      }
      const json: WeatherApiResponse = await res.json();
      setWeatherData(json);
      if (json.selected_area?.name) {
        setSelectedArea(json.selected_area.name);
      }
    } catch (err) {
      console.warn('Weather API fetch error, checking fallback:', err);
      try {
        const busRes = await fetch(`/api/bus?Area=${encodeURIComponent(area)}`);
        if (busRes.ok) {
          const busJson: WeatherApiResponse = await busRes.json();
          setWeatherData(busJson);
          if (busJson.selected_area?.name) {
            setSelectedArea(busJson.selected_area.name);
          }
          return;
        }
      } catch (_) {}
      setError(err instanceof Error ? err.message : 'Unable to connect to live forecast API');
    } finally {
      setIsLoading(false);
    }
  }, [selectedArea]);

  useEffect(() => {
    fetchWeather('Ang Mo Kio');
  }, []);

  const handleSelectArea = (areaName: string) => {
    setSelectedArea(areaName);
    fetchWeather(areaName);
  };

  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthData(data);
    } catch (err: unknown) {
      setHealthData({
        keyConfigured: false,
        ltaAnswered: false,
        weatherApiAnswered: false,
        error: err instanceof Error ? err.message : 'Failed to contact /api/health endpoint',
      });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const metadataList: AreaMetadata[] = weatherData?.data?.area_metadata || [];
  const item = weatherData?.data?.items?.[0];
  const forecastsList: AreaForecast[] = item?.forecasts || [];

  const currentForecastObj = forecastsList.find(
    f => f.area.toLowerCase() === selectedArea.toLowerCase()
  );
  const currentForecast = currentForecastObj?.forecast || weatherData?.forecast || 'Partly Cloudy (Day)';
  const currentMetadata = metadataList.find(
    m => m.name.toLowerCase() === selectedArea.toLowerCase()
  );

  const quickPicks = [
    'Ang Mo Kio',
    'Bedok',
    'Bishan',
    'City',
    'Jurong East',
    'Woodlands',
    'Changi',
    'Sentosa',
    'Punggol',
    'Tuas'
  ];

  return (
    <div className="min-h-screen bg-[#060c18] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onRefresh={() => fetchWeather(selectedArea)}
        isLoading={isLoading}
        onOpenInspector={() => setIsInspectorOpen(true)}
        selectedArea={selectedArea}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* View Switcher Tabs & Quick Sectors */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start md:self-auto text-xs">
            <button
              onClick={() => setActiveTab('combined')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'combined'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Combined Commuter Hub</span>
            </button>
            <button
              onClick={() => setActiveTab('weather_map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'weather_map'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CloudSun size={14} />
              <span>Singapore Weather Map</span>
            </button>
            <button
              onClick={() => setActiveTab('bus_arrivals')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'bus_arrivals'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bus size={14} />
              <span>LTA Bus Arrivals</span>
            </button>
          </div>

          {/* Diagnostic status trigger button */}
          <button
            onClick={() => {
              setShowHealthModal(true);
              checkHealth();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 transition"
          >
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>API Health Diagnostics</span>
          </button>
        </div>

        {/* Quick Area Jump Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1.5 mr-1">
            <MapPin size={13} className="text-emerald-400" />
            Quick Sectors:
          </span>
          {quickPicks.map((pick) => {
            const isPicked = selectedArea.toLowerCase() === pick.toLowerCase();
            return (
              <button
                key={pick}
                onClick={() => handleSelectArea(pick)}
                className={`px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition-all ${
                  isPicked
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {pick}
                {pick === 'Ang Mo Kio' && (
                  <span className="ml-1 text-[9px] opacity-75 font-normal">(Default)</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Error Banner if any */}
        {error && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{error}. Displaying current verified NEA snapshot.</span>
            </div>
            <button
              onClick={() => fetchWeather(selectedArea)}
              className="px-3 py-1 bg-red-800/60 hover:bg-red-700 text-white rounded-lg transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dynamic Panels based on Active Tab */}
        {activeTab === 'combined' && (
          <div className="space-y-6">
            {/* Top Row: Map & Selected Weather Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 xl:col-span-8">
                <SingaporeMap
                  areaMetadata={metadataList}
                  forecasts={forecastsList}
                  selectedArea={selectedArea}
                  onSelectArea={handleSelectArea}
                />
              </div>

              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
                <WeatherDetailCard
                  areaName={selectedArea}
                  forecast={currentForecast}
                  metadata={currentMetadata}
                  validPeriod={item?.valid_period}
                  updateTimestamp={item?.update_timestamp || item?.timestamp}
                  transitInfo={weatherData?.transit_info}
                  source={weatherData?.source}
                />
              </div>
            </div>

            {/* Bottom Row: LTA Bus Arrivals Live Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 xl:col-span-8">
                <BusArrivalPanel currentArea={selectedArea} />
              </div>
              <div className="lg:col-span-5 xl:col-span-4">
                <AreaForecastGrid
                  areaMetadata={metadataList}
                  forecasts={forecastsList}
                  selectedArea={selectedArea}
                  onSelectArea={handleSelectArea}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weather_map' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 xl:col-span-8">
                <SingaporeMap
                  areaMetadata={metadataList}
                  forecasts={forecastsList}
                  selectedArea={selectedArea}
                  onSelectArea={handleSelectArea}
                />
              </div>

              <div className="lg:col-span-5 xl:col-span-4">
                <WeatherDetailCard
                  areaName={selectedArea}
                  forecast={currentForecast}
                  metadata={currentMetadata}
                  validPeriod={item?.valid_period}
                  updateTimestamp={item?.update_timestamp || item?.timestamp}
                  transitInfo={weatherData?.transit_info}
                  source={weatherData?.source}
                />
              </div>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-white tracking-wide">
                All 47 Singapore Sectors Overview
              </h3>
              <AreaForecastGrid
                areaMetadata={metadataList}
                forecasts={forecastsList}
                selectedArea={selectedArea}
                onSelectArea={handleSelectArea}
              />
            </section>
          </div>
        )}

        {activeTab === 'bus_arrivals' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <BusArrivalPanel currentArea={selectedArea} />
          </div>
        )}
      </main>

      {/* Health Diagnostics Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                API Diagnostics & Health
              </h3>
              <button
                onClick={() => setShowHealthModal(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {healthLoading ? (
              <div className="py-8 text-center text-sm text-slate-400 space-y-2">
                <RefreshCw size={24} className="animate-spin mx-auto text-emerald-500" />
                <p>Probing /api/health...</p>
              </div>
            ) : healthData ? (
              <div className="space-y-3 text-xs">
                {/* LTA Status */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">LTA_ACCOUNT_KEY:</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      {healthData.keyConfigured ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          <span className="text-emerald-300">Configured</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} className="text-amber-400" />
                          <span className="text-amber-300">Not Set (Sample Preview Active)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">LTA DataMall Upstream:</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      {healthData.ltaAnswered ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          <span className="text-emerald-300">Responded ({healthData.upstreamStatus})</span>
                        </>
                      ) : (
                        <span className="text-slate-500">Not queried without key</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Weather Status */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Singapore Weather API:</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span className="text-emerald-300">Operational (Data.gov.sg v2)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Service Uptime:</span>
                    <span className="text-slate-300 font-mono">{healthData.uptimeSeconds || 0}s</span>
                  </div>
                </div>

                {healthData.error && (
                  <p className="text-xs text-amber-300 bg-amber-950/40 p-3 rounded-xl border border-amber-900/60">
                    {healthData.error}
                  </p>
                )}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={checkHealth}
                disabled={healthLoading}
                className="px-3.5 py-1.5 text-xs font-medium border border-slate-700 rounded-xl hover:bg-slate-800 transition"
              >
                Re-check
              </button>
              <button
                onClick={() => setShowHealthModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Singapore Open Data Licence Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-3 text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
            <div className="flex items-center gap-2">
              <CloudRain size={16} className="text-emerald-400" />
              <span className="text-slate-200 font-medium">Singapore Weather & LTA Bus Hub</span>
              <span className="text-slate-600">|</span>
              <span>2-Hour NEA Forecast & DataMall v3 Bus Arrival</span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span>GET /api/2-hrs-forecast</span>
              <span>GET /api/bus</span>
              <span>GET /api/health</span>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-400 border-t border-slate-800/80 pt-3">
            Contains information from LTA DataMall Bus Arrival and National Environment Agency (NEA) 2-hour weather forecast accessed on {formattedDate}, which is made available under the terms of the Singapore Open Data Licence version 1.0{' '}
            <a
              href="https://data.gov.sg/open-data-licence"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 underline hover:text-emerald-300"
            >
              https://data.gov.sg/open-data-licence
            </a>
            . This is an SMU course project and is not affiliated with or endorsed by the Land Transport Authority or NEA.
          </p>
        </div>
      </footer>

      {/* API Inspector Modal */}
      <ApiInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        currentArea={selectedArea}
      />
    </div>
  );
}
