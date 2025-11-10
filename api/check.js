const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

const { PROXY_URL } = process.env;
const agent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : null;

module.exports = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      res.status(400).json({ ok: false, error: 'Missing url' });
      return;
    }

    const response = await fetch(url, {
      agent: agent || undefined,
      timeout: 10000
    });

    const text = await response.text();

    res.status(200).json({
      ok: true,
      status: response.status,
      ctype: response.headers.get('content-type') || null,
      snip: text.slice(0, 4000)
    });
  } catch (e) {
    res.status(200).json({
      ok: false,
      error: String(e.message || e)
    });
  }
};
