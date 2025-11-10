const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

const ROSSKO_API_URL = 'https://api.rossko.ru/service/v2';

module.exports = async (req, res) => {
  try {
    console.log('rossko handler start');

    const apiKey = process.env.ROSSKO_API_KEY;
    if (!apiKey) {
      console.error('No ROSSKO_API_KEY');
      return res
        .status(500)
        .json({ ok: false, error: 'ROSSKO_API_KEY is not set' });
    }

    const proxyUrl = process.env.PROXY_URL || '';
    let agent;

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

    console.log('Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: apiKey,
      },
      ...(agent ? { agent } : {}),
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    console.log('ROSSKO status', response.status, contentType);

    if (contentType.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        return res.status(response.status).json(json);
      } catch (e) {
        console.error('JSON parse error:', e);
        return res.status(502).json({
          ok: false,
          error: 'ROSSKO returned invalid JSON',
          body: text.slice(0, 1000),
        });
      }
    }

    return res.status(502).json({
      ok: false,
      status: response.status,
      ctype: contentType,
      body: text.slice(0, 1000),
    });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Internal Server Error',
    });
  }
};
