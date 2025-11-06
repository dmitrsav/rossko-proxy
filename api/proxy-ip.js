// /api/proxy-ip.js
const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');

module.exports = async (req, res) => {
  try {
    const proxyUrl = process.env.PROXY_URL; // вида http://login:pass@IP:PORT
    if (!proxyUrl) {
      return res.status(500).json({ ok: false, error: 'Missing PROXY_URL' });
    }

    const agent = new HttpsProxyAgent(proxyUrl);
    const r = await fetch('https://ifconfig.me/ip', { agent });
    const text = await r.text();

    res.status(200).json({ ok: true, ip: text.trim() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};
