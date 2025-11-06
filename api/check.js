// api/check.js
const { ProxyAgent, fetch } = require('undici');

module.exports = async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ ok: false, error: 'No url' });

    const proxyUrl = process.env.PROXY_URL || '';
    const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

    const r = await fetch(url, { dispatcher });
    const ctype = r.headers.get('content-type') || '';
    const body = await r.text();

    res.status(200).json({
      ok: true,
      status: r.status,
      ctype,
      snip: body.slice(0, 200)
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};
