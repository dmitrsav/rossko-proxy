const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

const API_URL = 'https://api.rossko.ru/service/v2/search';
const API_KEY = process.env.ROSSKO_API_KEY;
const PROXY_URL = process.env.PROXY_URL;

module.exports = async (req, res) => {
  try {
    const { q = '', delivery_id = '', address_id = '' } = req.query;

    if (!API_KEY) {
      throw new Error('ROSSKO_API_KEY is not set');
    }

    const url =
      `${API_URL}?text=${encodeURIComponent(q)}` +
      `&delivery_id=${encodeURIComponent(delivery_id || '')}` +
      `&address_id=${encodeURIComponent(address_id || '')}`;

    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': API_KEY,
      },
    };

    if (PROXY_URL) {
      options.agent = new HttpsProxyAgent(PROXY_URL);
    }

    const response = await fetch(url, options);
    const body = await response.text();

    res.status(response.status).send(body);
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
};
