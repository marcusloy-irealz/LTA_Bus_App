export type WeatherCategory = 'clear' | 'partly_cloudy' | 'cloudy' | 'showers' | 'thundery_showers' | 'heavy_rain';

export function categorizeForecast(forecast: string): WeatherCategory {
  const f = forecast.toLowerCase();
  if (f.includes('thunder')) return 'thundery_showers';
  if (f.includes('heavy')) return 'heavy_rain';
  if (f.includes('shower') || f.includes('rain')) return 'showers';
  if (f.includes('partly cloudy')) return 'partly_cloudy';
  if (f.includes('cloudy') || f.includes('overcast') || f.includes('hazy')) return 'cloudy';
  return 'clear';
}

export function getWeatherVisuals(forecast: string) {
  const category = categorizeForecast(forecast);
  switch (category) {
    case 'thundery_showers':
      return {
        bgGradient: 'from-amber-950/40 via-purple-950/40 to-slate-900',
        badgeBg: 'bg-purple-900/60 text-purple-200 border-purple-700/60',
        dotColor: '#a855f7',
        ringColor: 'ring-purple-500/50',
        accentColor: 'text-purple-400',
        status: 'Severe Weather Warning',
        umbrellaRecommended: true,
      };
    case 'heavy_rain':
    case 'showers':
      return {
        bgGradient: 'from-blue-950/40 via-cyan-950/30 to-slate-900',
        badgeBg: 'bg-blue-900/60 text-blue-200 border-blue-700/60',
        dotColor: '#38bdf8',
        ringColor: 'ring-blue-500/50',
        accentColor: 'text-blue-400',
        status: 'Showers Expected',
        umbrellaRecommended: true,
      };
    case 'cloudy':
      return {
        bgGradient: 'from-slate-900 via-slate-800 to-slate-950',
        badgeBg: 'bg-slate-800/80 text-slate-200 border-slate-700',
        dotColor: '#94a3b8',
        ringColor: 'ring-slate-500/40',
        accentColor: 'text-slate-300',
        status: 'Cloudy Conditions',
        umbrellaRecommended: false,
      };
    case 'partly_cloudy':
      return {
        bgGradient: 'from-amber-950/20 via-sky-950/30 to-slate-900',
        badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        dotColor: '#f59e0b',
        ringColor: 'ring-amber-500/40',
        accentColor: 'text-amber-400',
        status: 'Fair / Partly Cloudy',
        umbrellaRecommended: false,
      };
    default:
      return {
        bgGradient: 'from-sky-950/30 via-slate-900 to-slate-950',
        badgeBg: 'bg-sky-500/10 text-sky-200 border-sky-500/30',
        dotColor: '#0ea5e9',
        ringColor: 'ring-sky-500/40',
        accentColor: 'text-sky-300',
        status: 'Fair Weather',
        umbrellaRecommended: false,
      };
  }
}

// Convert Geo coordinates (lat, lon) to SVG viewBox coordinates (800 x 480)
export function projectGeoToSvg(lat: number, lon: number): { x: number; y: number } {
  const minLon = 103.58;
  const maxLon = 104.09;
  const minLat = 1.19;
  const maxLat = 1.475;

  const svgWidth = 800;
  const svgHeight = 460;

  const x = ((lon - minLon) / (maxLon - minLon)) * (svgWidth - 80) + 40;
  const y = ((maxLat - lat) / (maxLat - minLat)) * (svgHeight - 80) + 40;

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10
  };
}

export function getRegion(areaName: string): 'North' | 'South' | 'East' | 'West' | 'Central' {
  const north = ['Woodlands', 'Sembawang', 'Yishun', 'Mandai', 'Sungei Kadut', 'Lim Chu Kang', 'Seletar'];
  const south = ['City', 'Bukit Merah', 'Queenstown', 'Sentosa', 'Southern Islands', 'Marine Parade', 'Tanglin'];
  const east = ['Bedok', 'Changi', 'Pasir Ris', 'Tampines', 'Paya Lebar', 'Pulau Ubin', 'Pulau Tekong'];
  const west = ['Boon Lay', 'Bukit Batok', 'Bukit Panjang', 'Choa Chu Kang', 'Clementi', 'Jalan Bahar', 'Jurong East', 'Jurong West', 'Jurong Island', 'Pioneer', 'Tengah', 'Tuas', 'Western Islands', 'Western Water Catchment'];

  if (north.includes(areaName)) return 'North';
  if (south.includes(areaName)) return 'South';
  if (east.includes(areaName)) return 'East';
  if (west.includes(areaName)) return 'West';
  return 'Central'; // Ang Mo Kio, Bishan, Bukit Timah, Central Water Catchment, Geylang, Hougang, Kallang, Novena, Punggol, Sengkang, Serangoon, Toa Payoh
}
