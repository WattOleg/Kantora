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

async function getRawBody(req) {
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
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
      let body = '';
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (req.body && typeof req.body === 'object') {
        body = JSON.stringify(req.body);
      } else {
        body = await getRawBody(req);
      }

      if (!body) {
        return sendJson(res, 400, { error: 'Empty request body', status: 'error' });
      }

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
