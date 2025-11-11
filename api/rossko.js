const fetch = require('node-fetch');
const { getProxyOptions } = require('./_proxy');

const ROSSKO_URL = 'https://api.rossko.ru/service/v2/search';

module.exports = async (req, res) => {
  try {
    const { q, delivery_id, address_id } = req.query;
    if (!q || !delivery_id || !address_id) {
      return res.status(400).json({ ok: false, error: 'Missing q/delivery_id/address_id' });
    }

    const url = `${ROSSKO_URL}?text=${encodeURIComponent(q)}&delivery_id=${encodeURIComponent(
      delivery_id
    )}&address_id=${encodeURIComponent(address_id)}`;

    const { agent, headers } = getProxyOptions();

    const r = await fetch(url, {
      agent,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        // сюда же, если нужно, ключи/заголовки Росско
        // 'Authorization': '...'
      },
      method: 'GET'
    });

    const data = await r.text();

    res
      .status(r.ok ? 200 : r.status)
      .send(data);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
