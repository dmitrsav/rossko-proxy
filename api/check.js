const fetch = require('node-fetch');
const { getProxyOptions } = require('./_proxy');

module.exports = async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ ok: false, error: 'Missing url' });
    }

    const { agent, headers } = getProxyOptions();

    const r = await fetch(url, { agent, headers, method: 'GET' });
    const text = await r.text();

    res.json({
      ok: true,
      status: r.status,
      ctype: r.headers.get('content-type') || null,
      snip: text.slice(0, 200)
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
