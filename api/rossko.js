const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

const { PROXY_URL, ROSSKO_API_KEY } = process.env;

if (!ROSSKO_API_KEY) {
  throw new Error('ROSSKO_API_KEY is not set');
}

let agent = null;
if (PROXY_URL) {
  agent = new HttpsProxyAgent(PROXY_URL);
}

module.exports = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      res.status(400).json({ ok: false, error: 'Missing q' });
      return;
    }

    const url = 'https://api.rossko.ru/service/v2/search?' + q;

    const response = await fetch(url, {
      agent: agent || undefined,
      headers: {
        'Authorization': `Basic ${ROSSKO_API_KEY}`,
        'Content-Type': 'application/json'
      },
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
