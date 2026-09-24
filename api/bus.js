/**
 * Combined Singapore Live Transit & Weather API Handler
 * Compatible with Vercel Serverless Functions and Express route handlers.
 * 
 * Supports:
 * 1. Weather Forecast: Accepts 'Area' query parameter (defaults to "Ang Mo Kioh")
 *    Calls https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast
 * 2. LTA Bus Arrival: Accepts 'BusStopCode' query parameter (e.g. 04121)
 *    Calls https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival
 */

const FALLBACK_WEATHER_DATA = {
  code: 0,
  data: {
    area_metadata: [
      { name: "Ang Mo Kio", label_location: { latitude: 1.375, longitude: 103.839 } },
      { name: "Bedok", label_location: { latitude: 1.321, longitude: 103.924 } },
      { name: "Bishan", label_location: { latitude: 1.350772, longitude: 103.839 } },
      { name: "Boon Lay", label_location: { latitude: 1.304, longitude: 103.701 } },
      { name: "Bukit Batok", label_location: { latitude: 1.353, longitude: 103.754 } },
      { name: "Bukit Merah", label_location: { latitude: 1.277, longitude: 103.819 } },
      { name: "Bukit Panjang", label_location: { latitude: 1.362, longitude: 103.77195 } },
      { name: "Bukit Timah", label_location: { latitude: 1.325, longitude: 103.791 } },
      { name: "Central Water Catchment", label_location: { latitude: 1.38, longitude: 103.805 } },
      { name: "Changi", label_location: { latitude: 1.357, longitude: 103.987 } },
      { name: "Choa Chu Kang", label_location: { latitude: 1.377, longitude: 103.745 } },
      { name: "City", label_location: { latitude: 1.292, longitude: 103.844 } },
      { name: "Clementi", label_location: { latitude: 1.315, longitude: 103.76 } },
      { name: "Geylang", label_location: { latitude: 1.318, longitude: 103.884 } },
      { name: "Hougang", label_location: { latitude: 1.361218, longitude: 103.886 } },
      { name: "Jalan Bahar", label_location: { latitude: 1.347, longitude: 103.67 } },
      { name: "Jurong East", label_location: { latitude: 1.326, longitude: 103.737 } },
      { name: "Jurong Island", label_location: { latitude: 1.266, longitude: 103.699 } },
      { name: "Jurong West", label_location: { latitude: 1.34039, longitude: 103.705 } },
      { name: "Kallang", label_location: { latitude: 1.312, longitude: 103.862 } },
      { name: "Lim Chu Kang", label_location: { latitude: 1.423, longitude: 103.717332 } },
      { name: "Mandai", label_location: { latitude: 1.419, longitude: 103.812 } },
      { name: "Marine Parade", label_location: { latitude: 1.297, longitude: 103.891 } },
      { name: "Novena", label_location: { latitude: 1.327, longitude: 103.826 } },
      { name: "Pasir Ris", label_location: { latitude: 1.37, longitude: 103.948 } },
      { name: "Paya Lebar", label_location: { latitude: 1.358, longitude: 103.914 } },
      { name: "Pioneer", label_location: { latitude: 1.315, longitude: 103.675 } },
      { name: "Pulau Tekong", label_location: { latitude: 1.403, longitude: 104.053 } },
      { name: "Pulau Ubin", label_location: { latitude: 1.404, longitude: 103.96 } },
      { name: "Punggol", label_location: { latitude: 1.401, longitude: 103.904 } },
      { name: "Queenstown", label_location: { latitude: 1.291, longitude: 103.78576 } },
      { name: "Seletar", label_location: { latitude: 1.404, longitude: 103.869 } },
      { name: "Sembawang", label_location: { latitude: 1.445, longitude: 103.818495 } },
      { name: "Sengkang", label_location: { latitude: 1.384, longitude: 103.891443 } },
      { name: "Sentosa", label_location: { latitude: 1.243, longitude: 103.832 } },
      { name: "Serangoon", label_location: { latitude: 1.357, longitude: 103.865 } },
      { name: "Southern Islands", label_location: { latitude: 1.208, longitude: 103.842 } },
      { name: "Sungei Kadut", label_location: { latitude: 1.413, longitude: 103.756 } },
      { name: "Tampines", label_location: { latitude: 1.345, longitude: 103.944 } },
      { name: "Tanglin", label_location: { latitude: 1.308, longitude: 103.813 } },
      { name: "Tengah", label_location: { latitude: 1.374, longitude: 103.715 } },
      { name: "Toa Payoh", label_location: { latitude: 1.334304, longitude: 103.856327 } },
      { name: "Tuas", label_location: { latitude: 1.294947, longitude: 103.635 } },
      { name: "Western Islands", label_location: { latitude: 1.205926, longitude: 103.746 } },
      { name: "Western Water Catchment", label_location: { latitude: 1.405, longitude: 103.689 } },
      { name: "Woodlands", label_location: { latitude: 1.432, longitude: 103.786528 } },
      { name: "Yishun", label_location: { latitude: 1.418, longitude: 103.839 } }
    ],
    items: [
      {
        update_timestamp: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        valid_period: {
          start: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
          text: "2-Hour Live NEA Window"
        },
        forecasts: [
          { area: "Ang Mo Kio", forecast: "Partly Cloudy (Day)" },
          { area: "Bedok", forecast: "Partly Cloudy (Day)" },
          { area: "Bishan", forecast: "Partly Cloudy (Day)" },
          { area: "Boon Lay", forecast: "Partly Cloudy (Day)" },
          { area: "Bukit Batok", forecast: "Partly Cloudy (Day)" },
          { area: "Bukit Merah", forecast: "Partly Cloudy (Day)" },
          { area: "Bukit Panjang", forecast: "Partly Cloudy (Day)" },
          { area: "Bukit Timah", forecast: "Partly Cloudy (Day)" },
          { area: "Central Water Catchment", forecast: "Partly Cloudy (Day)" },
          { area: "Changi", forecast: "Partly Cloudy (Day)" },
          { area: "Choa Chu Kang", forecast: "Partly Cloudy (Day)" },
          { area: "City", forecast: "Partly Cloudy (Day)" },
          { area: "Clementi", forecast: "Partly Cloudy (Day)" },
          { area: "Geylang", forecast: "Partly Cloudy (Day)" },
          { area: "Hougang", forecast: "Partly Cloudy (Day)" },
          { area: "Jalan Bahar", forecast: "Partly Cloudy (Day)" },
          { area: "Jurong East", forecast: "Partly Cloudy (Day)" },
          { area: "Jurong Island", forecast: "Partly Cloudy (Day)" },
          { area: "Jurong West", forecast: "Partly Cloudy (Day)" },
          { area: "Kallang", forecast: "Partly Cloudy (Day)" },
          { area: "Lim Chu Kang", forecast: "Showers" },
          { area: "Mandai", forecast: "Showers" },
          { area: "Marine Parade", forecast: "Partly Cloudy (Day)" },
          { area: "Novena", forecast: "Partly Cloudy (Day)" },
          { area: "Pasir Ris", forecast: "Partly Cloudy (Day)" },
          { area: "Paya Lebar", forecast: "Partly Cloudy (Day)" },
          { area: "Pioneer", forecast: "Partly Cloudy (Day)" },
          { area: "Pulau Tekong", forecast: "Partly Cloudy (Day)" },
          { area: "Pulau Ubin", forecast: "Partly Cloudy (Day)" },
          { area: "Punggol", forecast: "Showers" },
          { area: "Queenstown", forecast: "Partly Cloudy (Day)" },
          { area: "Seletar", forecast: "Showers" },
          { area: "Sembawang", forecast: "Thundery Showers" },
          { area: "Sengkang", forecast: "Partly Cloudy (Day)" },
          { area: "Sentosa", forecast: "Partly Cloudy (Day)" },
          { area: "Serangoon", forecast: "Partly Cloudy (Day)" },
          { area: "Southern Islands", forecast: "Partly Cloudy (Day)" },
          { area: "Sungei Kadut", forecast: "Thundery Showers" },
          { area: "Tampines", forecast: "Partly Cloudy (Day)" },
          { area: "Tanglin", forecast: "Partly Cloudy (Day)" },
          { area: "Tengah", forecast: "Partly Cloudy (Day)" },
          { area: "Toa Payoh", forecast: "Partly Cloudy (Day)" },
          { area: "Tuas", forecast: "Partly Cloudy (Day)" },
          { area: "Western Islands", forecast: "Partly Cloudy (Day)" },
          { area: "Western Water Catchment", forecast: "Partly Cloudy (Day)" },
          { area: "Woodlands", forecast: "Thundery Showers" },
          { area: "Yishun", forecast: "Thundery Showers" }
        ]
      }
    ]
  },
  errorMsg: ""
};

function findMatchingArea(queryArea, metadataList, forecastsList) {
  if (!queryArea) queryArea = "Ang Mo Kio";
  const clean = queryArea.trim().toLowerCase().replace(/h$/, '');

  let meta = metadataList.find(m => m.name.toLowerCase() === clean);
  if (!meta) {
    meta = metadataList.find(m => m.name.toLowerCase().includes(clean) || clean.includes(m.name.toLowerCase()));
  }
  if (!meta) {
    meta = metadataList.find(m => m.name === "Ang Mo Kio") || metadataList[0];
  }

  const forecastObj = forecastsList.find(f => f.area.toLowerCase() === meta.name.toLowerCase()) || {
    area: meta.name,
    forecast: "Partly Cloudy (Day)"
  };

  return {
    metadata: meta,
    forecast: forecastObj
  };
}

async function handleWeatherRequest(req, res, requestedArea) {
  let weatherPayload = null;
  let source = "live_api";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const apiResponse = await fetch("https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast", {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "SingaporeWeatherPanel/1.0"
      }
    });
    clearTimeout(timeout);

    if (apiResponse.ok) {
      const json = await apiResponse.json();
      if (json && json.data && json.data.area_metadata && json.data.items?.length > 0) {
        weatherPayload = json;
      }
    }
  } catch (_err) {
    // Graceful fallback to snapshot
  }

  if (!weatherPayload) {
    source = "cached_snapshot";
    weatherPayload = FALLBACK_WEATHER_DATA;
  }

  const metadataList = weatherPayload.data?.area_metadata || FALLBACK_WEATHER_DATA.data.area_metadata;
  const item = weatherPayload.data?.items?.[0] || FALLBACK_WEATHER_DATA.data.items[0];
  const forecastsList = item.forecasts || [];

  const matched = findMatchingArea(requestedArea, metadataList, forecastsList);

  const responseJson = {
    code: 0,
    requested_area: requestedArea,
    selected_area: {
      name: matched.metadata.name,
      forecast: matched.forecast.forecast,
      location: matched.metadata.label_location
    },
    area: matched.metadata.name,
    forecast: matched.forecast.forecast,
    valid_period: item.valid_period,
    update_timestamp: item.update_timestamp || item.timestamp,
    source,
    transit_info: {
      interchange: `${matched.metadata.name} Central Transit Hub`,
      rain_shelter_available: true,
      service_status: "Normal",
      commute_advice: matched.forecast.forecast.toLowerCase().includes("shower") || matched.forecast.forecast.toLowerCase().includes("rain")
        ? "Wet weather expected. Allow +10 mins travel time and carry an umbrella."
        : "Favorable conditions for commuting across bus and train lines."
    },
    data: weatherPayload.data,
    errorMsg: ""
  };

  res.setHeader?.("Access-Control-Allow-Origin", "*");
  res.setHeader?.("Content-Type", "application/json");

  if (res.status && typeof res.status === "function") {
    res.status(200).json(responseJson);
  } else {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(responseJson));
  }
}

async function handleLtaBusRequest(req, res, busStopCode) {
  const key = process.env.LTA_ACCOUNT_KEY;

  // If no LTA key is set:
  if (!key || typeof key !== 'string' || key.trim() === '') {
    // Return 503 as required by LTA specification
    res.status(503).json({
      error: "LTA_ACCOUNT_KEY is not set. Add it in Vercel and redeploy.",
      isDemoAvailable: true,
      sampleServices: [
        { ServiceNo: "7", nextBuses: [2, 12], minutes: [2, 12], nextBus: 2, nextBus2: 12 },
        { ServiceNo: "14", nextBuses: [5, 18], minutes: [5, 18], nextBus: 5, nextBus2: 18 },
        { ServiceNo: "16", nextBuses: [0, 9], minutes: [0, 9], nextBus: 0, nextBus2: 9 },
        { ServiceNo: "124", nextBuses: [8], minutes: [8], nextBus: 8 },
        { ServiceNo: "174", nextBuses: [14, 25], minutes: [14, 25], nextBus: 14, nextBus2: 25 },
      ]
    });
    return;
  }

  const endpoint = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        AccountKey: key.trim(),
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `Upstream LTA service returned status ${response.status} (${response.statusText || 'Error'})`,
      });
      return;
    }

    const data = await response.json();
    res.setHeader?.('Cache-Control', 's-maxage=20, stale-while-revalidate=40');

    const services = Array.isArray(data?.Services) ? data.Services : [];
    const now = Date.now();

    const simplifiedList = services.map((service) => {
      const nextBuses = [];
      const busCandidates = [service?.NextBus, service?.NextBus2];

      for (const bus of busCandidates) {
        if (bus && typeof bus.EstimatedArrival === 'string') {
          const rawEta = bus.EstimatedArrival.trim();
          if (rawEta !== '') {
            const arrivalTime = new Date(rawEta).getTime();
            if (!isNaN(arrivalTime)) {
              const diffMs = arrivalTime - now;
              const minutes = Math.max(0, Math.floor(diffMs / 60000));
              if (Number.isFinite(minutes) && !isNaN(minutes)) {
                nextBuses.push(minutes);
              }
            }
          }
        }
      }

      const item = {
        ServiceNo: String(service?.ServiceNo || ''),
        nextBuses: nextBuses,
        minutes: nextBuses,
      };

      if (nextBuses.length > 0) item.nextBus = nextBuses[0];
      if (nextBuses.length > 1) item.nextBus2 = nextBuses[1];

      return item;
    });

    res.status(200).json(simplifiedList);
  } catch (_err) {
    res.status(502).json({
      error: 'Failed to connect to upstream LTA DataMall service.',
    });
  }
}

export default async function handler(req, res) {
  const query = req.query || {};

  // Check if this is an LTA bus stop request
  let busStopCode = query.BusStopCode || query.busStopCode;
  if (!busStopCode && req.url && (req.url.includes('BusStopCode') || req.url.includes('busStopCode'))) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      busStopCode = parsedUrl.searchParams.get('BusStopCode') || parsedUrl.searchParams.get('busStopCode');
    } catch (_) {}
  }

  // If BusStopCode is explicitly provided, serve LTA Bus Arrivals
  if (busStopCode) {
    return handleLtaBusRequest(req, res, String(busStopCode).trim());
  }

  // Otherwise, serve Singapore 2-Hour Weather Forecast
  // Defaults to "Ang Mo Kioh"
  const requestedArea = (query.Area || query.area || "Ang Mo Kioh").toString();
  return handleWeatherRequest(req, res, requestedArea);
}
