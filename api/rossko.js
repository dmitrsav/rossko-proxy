// /api/rossko.js
const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');

module.exports = async (req, res) => {
  try {
    const { q, delivery_id, address_id } = req.query;
    const apiKey = process.env.ROSSKO_API_KEY;
    const proxyUrl = process.env.PROXY_URL;

    if (!apiKey) return res.status(500).json({ ok: false, error: 'Missing ROSSKO_API_KEY' });
    if (!proxyUrl) return res.status(500).json({ ok: false, error: 'Missing PROXY_URL' });

    const agent = new HttpsProxyAgent(proxyUrl);

    const url = 'https://api.rossko.ru/…' /* здесь ваш конечный URL с q, delivery_id, address_id */;
    const r = await fetch(url, {
      method: 'GET', // или POST по вашей схеме
      headers: { 'Authorization': `Bearer ${apiKey}` },
      agent
    });

    // Если РОССКО отвечает HTML (блокировка), аккуратно вернём статус/сниппет
    const ctype = r.headers.get('content-type') || '';
    if (!ctype.includes('json')) {
      const snip = (await r.text()).slice(0, 500);
      return res.status(200).json({ ok: true, status: r.status, ctype, snip });
    }

    const data = await r.json();
    res.status(200).json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};
