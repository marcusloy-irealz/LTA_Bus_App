/**
 * Live Bus Arrival API Handler
 * Compatible with Vercel Serverless Functions and Express route handlers.
 * Calls LTA DataMall v3 BusArrival API and returns a simplified list of services.
 */

export default async function handler(req, res) {
  // Read credential from environment variable
  const key = process.env.LTA_ACCOUNT_KEY;

  // BEFORE the fetch, if that variable is missing or empty, return 503
  // Never let an unset variable reach the header.
  if (!key || typeof key !== 'string' || key.trim() === '') {
    res.status(503).json({
      error: "LTA_ACCOUNT_KEY is not set. Add it in Vercel and redeploy.",
    });
    return;
  }

  // Parse BusStopCode query parameter, defaulting to 04121
  const query = req.query || {};
  let busStopCode = query.BusStopCode || query.busStopCode;

  if (!busStopCode && req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      busStopCode = parsedUrl.searchParams.get('BusStopCode') || parsedUrl.searchParams.get('busStopCode');
    } catch (_) {
      // Ignore URL parsing errors
    }
  }

  if (!busStopCode || typeof busStopCode !== 'string' || busStopCode.trim() === '') {
    busStopCode = '04121';
  } else {
    busStopCode = busStopCode.trim();
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

    // AFTER the fetch, check response.ok before reading the body.
    // LTA returns an empty body on 401, so calling response.json() on a failed reply throws.
    if (!response.ok) {
      res.status(response.status).json({
        error: `Upstream LTA service returned status ${response.status} (${response.statusText || 'Error'})`,
      });
      return;
    }

    const data = await response.json();

    // Cache-Control: s-maxage=20, stale-while-revalidate=40
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');

    // Treat an empty Services array as "no buses running", not as an error
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
              // Round down to whole minutes as LTA's guide asks
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

      if (nextBuses.length > 0) {
        item.nextBus = nextBuses[0];
      }
      if (nextBuses.length > 1) {
        item.nextBus2 = nextBuses[1];
      }

      return item;
    });

    res.status(200).json(simplifiedList);
  } catch (err) {
    res.status(502).json({
      error: 'Failed to connect to upstream LTA DataMall service.',
    });
  }
}
