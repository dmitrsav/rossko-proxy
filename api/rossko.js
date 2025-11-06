// api/rossko.js
const { ProxyAgent, fetch } = require('undici');

module.exports = async (req, res) => {
  try {
    const { q = '', delivery_id = '', address_id = '' } = req.query;

    if (!process.env.ROSSKO_API_KEY) {
      return res.status(500).json({ ok: false, error: 'No ROSSKO_API_KEY' });
    }

    // Агент прокси берём из переменной окружения PROXY_URL (формат http://user:pass@ip:port)
    const proxyUrl = process.env.PROXY_URL || '';
    const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

    const url = `https://api.rossko.ru/v2/search?text=${encodeURIComponent(q)}&delivery_id=${encodeURIComponent(delivery_id)}&address_id=${encodeURIComponent(address_id)}`;

    const r = await fetch(url, {
      dispatcher,                            // вот сюда подставляем прокси
      headers: {
        'Authorization': `Bearer ${process.env.ROSSKO_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const ctype = r.headers.get('content-type') || '';
    const txt = await r.text();

    // Rossko иногда может отдать HTML-страницу ошибки — отловим это красиво
    if (!r.ok) {
      return res.status(r.status).json({ ok: false, status: r.status, ctype, body: txt.slice(0, 500) });
    }
    if (!ctype.includes('application/json')) {
      return res.status(502).json({ ok: false, error: 'Upstream returned non-JSON', ctype, snip: txt.slice(0, 500) });
    }

    return res.status(200).send(txt);       // уже текст JSON — отдаем как есть
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
};
