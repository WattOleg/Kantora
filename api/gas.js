const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;

function sendJson(res, status, payload) {
  res
    .status(status)
    .setHeader('Content-Type', 'application/json; charset=utf-8')
    .setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    .setHeader('Pragma', 'no-cache')
    .setHeader('Expires', '0');
  res.send(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (!GAS_WEB_APP_URL) {
    return sendJson(res, 500, {
      error: 'Missing GAS_WEB_APP_URL environment variable',
      status: 'error'
    });
  }

  try {
    const method = (req.method || 'GET').toUpperCase();

    if (method === 'GET') {
      const action = typeof req.query?.action === 'string' ? req.query.action : '';
      const target = new URL(GAS_WEB_APP_URL);
      if (action) target.searchParams.set('action', action);

      const upstream = await fetch(target.toString(), { method: 'GET', cache: 'no-store' });
      const text = await upstream.text();
      res
        .status(upstream.status)
        .setHeader('Content-Type', 'application/json; charset=utf-8')
        .setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        .setHeader('Pragma', 'no-cache')
        .setHeader('Expires', '0');
      return res.send(text);
    }

    if (method === 'POST') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      const upstream = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body
      });
      const text = await upstream.text();
      res
        .status(upstream.status)
        .setHeader('Content-Type', 'application/json; charset=utf-8')
        .setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        .setHeader('Pragma', 'no-cache')
        .setHeader('Expires', '0');
      return res.send(text);
    }

    return sendJson(res, 405, { error: 'Method not allowed', status: 'error' });
  } catch (err) {
    return sendJson(res, 500, {
      error: err?.message || 'Proxy request failed',
      status: 'error'
    });
  }
}
