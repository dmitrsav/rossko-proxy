const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

const proxyUrl = process.env.PROXY_URL;

module.exports = async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ ok: false, error: 'Missing url param' });
    }

    const options = {};
    if (proxyUrl) {
      options.agent = new HttpsProxyAgent(proxyUrl);
    }

    const r = await fetch(url, options);
    const text = await r.text();

    res.status(200).json({
      ok: true,
      status: r.status,
      ctype: r.headers.get('content-type'),
      snip: text.slice(0, 200)
    });
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message });
  }
};
