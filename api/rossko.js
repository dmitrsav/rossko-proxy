const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

const API_KEY = process.env.ROSSKO_API_KEY;
const proxyUrl = process.env.PROXY_URL;

module.exports = async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ ok: false, error: 'ROSSKO_API_KEY is not set' });
    }

    const q = req.query.q || '';
    const delivery_id = req.query.delivery_id || '';
    const address_id = req.query.address_id || '';

    const url = `https://api.rossko.ru/service/v2/search?text=${encodeURIComponent(
      q
    )}&delivery_id=${encodeURIComponent(delivery_id)}&address_id=${encodeURIComponent(address_id)}`;

    const headers = { 'X-Api-Key': API_KEY };
    const options = { headers };

    if (proxyUrl) {
      options.agent = new HttpsProxyAgent(proxyUrl);
    }

    const r = await fetch(url, options);
    const text = await r.text();

    if (!r.ok) {
      return res.status(200).json({
        ok: false,
        status: r.status,
        error: text || `ROSSKO returned ${r.status}`
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(200).json({
        ok: false,
        error: 'ROSSKO response is not JSON',
        raw: text.slice(0, 200)
      });
    }

    res.status(200).json({ ok: true, data });
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message });
  }
};
