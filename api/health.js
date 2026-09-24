/**
 * Health Check API Handler
 * Compatible with Vercel Serverless Functions and Express route handlers.
 * Reports:
 * 1. LTA DataMall configuration (LTA_ACCOUNT_KEY) and upstream status
 * 2. Singapore Real-time 2-Hour Weather Forecast API status
 * 3. Overall serverless & Express uptime
 */
export default async function handler(req, res) {
  const key = process.env.LTA_ACCOUNT_KEY;
  const keyConfigured = Boolean(key && typeof key === 'string' && key.trim() !== '');

  res.setHeader?.('Cache-Control', 'no-cache, no-store, must-revalidate');

  let ltaAnswered = false;
  let ltaStatus = null;
  let weatherAnswered = false;

  // Probe LTA DataMall if key configured
  if (keyConfigured) {
    try {
      const ltaRes = await fetch('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=04121', {
        method: 'GET',
        headers: {
          AccountKey: key.trim(),
          accept: 'application/json',
        },
      });
      ltaAnswered = true;
      ltaStatus = ltaRes.status;
    } catch (_) {
      ltaAnswered = false;
    }
  }

  // Probe Singapore Weather API
  try {
    const weatherRes = await fetch('https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast', {
      headers: { accept: 'application/json' },
    });
    if (weatherRes.ok) {
      weatherAnswered = true;
    }
  } catch (_) {
    weatherAnswered = false;
  }

  const payload = {
    status: 'ok',
    service: 'singapore-weather-and-lta-bus-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    // LTA fields expected by LTA Bus App health modal
    keyConfigured,
    ltaAnswered,
    upstreamStatus: ltaStatus,
    error: keyConfigured ? undefined : 'LTA_ACCOUNT_KEY is not set. Add it in Vercel or Secrets and redeploy.',
    // Weather API fields
    weatherApiAnswered: weatherAnswered,
    message: 'Singapore Live Weather & Transit API handlers active.'
  };

  if (res.status && typeof res.status === 'function') {
    res.status(200).json(payload);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  }
}
