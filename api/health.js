/**
 * Health Check API Handler
 * Compatible with Vercel Serverless Functions and Express route handlers.
 * Reports whether LTA_ACCOUNT_KEY is configured and whether LTA answered,
 * including upstream HTTP status code. Never reveals the key.
 */

export default async function handler(req, res) {
  const key = process.env.LTA_ACCOUNT_KEY;
  const keyConfigured = Boolean(key && typeof key === 'string' && key.trim() !== '');

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  // If key is not configured, report status without calling LTA at all
  if (!keyConfigured) {
    res.status(200).json({
      keyConfigured: false,
      ltaAnswered: false,
      upstreamStatus: null,
      error: 'LTA_ACCOUNT_KEY is not set. Add it in Vercel and redeploy.',
    });
    return;
  }

  // Probe LTA DataMall endpoint
  try {
    const ltaResponse = await fetch('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=04121', {
      method: 'GET',
      headers: {
        AccountKey: key.trim(),
        accept: 'application/json',
      },
    });

    res.status(200).json({
      keyConfigured: true,
      ltaAnswered: true,
      upstreamStatus: ltaResponse.status,
    });
  } catch (err) {
    res.status(200).json({
      keyConfigured: true,
      ltaAnswered: false,
      upstreamStatus: null,
      error: 'Unable to reach upstream LTA DataMall service.',
    });
  }
}
