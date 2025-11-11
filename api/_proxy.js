// api/_proxy.js
const { HttpsProxyAgent } = require('https-proxy-agent');

function getProxyOptions() {
  const proxyUrl = process.env.PROXY_URL;
  if (!proxyUrl) return {};

  const agent = new HttpsProxyAgent(proxyUrl);
  const u = new URL(proxyUrl);

  const headers = {};
  if (u.username || u.password) {
    const auth = Buffer
      .from(`${decodeURIComponent(u.username)}:${decodeURIComponent(u.password)}`)
      .toString('base64');
    headers['Proxy-Authorization'] = `Basic ${auth}`;
  }

  return { agent, headers };
}

module.exports = { getProxyOptions };
