const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

const ROSSKO_API_URL = 'https://api.rossko.ru/service/v2';

module.exports = async (req, res) => {
  try {
    const apiKey = process.env.ROSSKO_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'ROSSKO_API_KEY is not set' });
    }

    const proxyUrl = process.env.PROXY_URL || '';
    let agent = undefined;

    if (proxyUrl) {
      try {
        agent = new HttpsProxyAgent(proxyUrl);
      } catch (e) {
        console.error('Bad PROXY_URL:', e);
        return res
          .status(500)
          .json({ ok: false, error: 'Invalid PROXY_URL in environment' });
      }
    }

    const { q, delivery_id, address_id } = req.query;

    if (!q || !delivery_id || !address_id) {
      return res.status(400).json({
        ok: false,
        error: 'Missing q, delivery_id or address_id',
      });
    }

    const url =
      `${ROSSKO_API_URL}/search` +
      `?text=${encodeURIComponent(q)}` +
      `&delivery_id=${encodeURIComponent(delivery_id)}` +
      `&address_id=${encodeURIComponent(address_id)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      ...(agent ? { agent } : {}),
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (contentType.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        return res.status(response.status).json(json);
      } catch (e) {
        return res.status(502).json({
          ok: false,
          error: 'ROSSKO returned invalid JSON',
          body: text.slice(0, 4000),
        });
      }
    }

    return res.status(502).json({
      ok: false,
      status: response.status,
      ctype: contentType,
      snip: text.slice(0, 4000),
    });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Internal Server Error',
    });
  }
};
