// api/rossko.js

const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

const ROSS_API_URL = 'https://api.rossko.ru/service/v2/search';

module.exports = async function handler(req, res) {
  const { q, delivery_id, address_id } = req.query;

  if (!q) {
    return res
      .status(400)
      .json({ ok: false, error: 'Отсутствует обязательный параметр q' });
  }

  const proxyUrl = process.env.PROXY_URL || null;

  // если прокси указан — используем его
  const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

  // собираем URL к Росско
  const url =
    ROSS_API_URL +
    '?text=' +
    encodeURIComponent(q) +
    (delivery_id ? '&delivery_id=' + encodeURIComponent(delivery_id) : '') +
    (address_id ? '&address_id=' + encodeURIComponent(address_id) : '');

  try {
    const response = await fetch(url, {
      agent,
      timeout: 15000,
    });

    const ctype = response.headers.get('content-type') || '';
    const text = await response.text();

    // если Росско ответил ошибкой — покажем, что именно
    if (!response.ok) {
      return res.status(200).json({
        ok: false,
        status: response.status,
        ctype,
        snip: text.slice(0, 500),
      });
    }

    // если это JSON — отдадим как JSON
    if (ctype.includes('application/json')) {
      try {
        return res.status(200).json(JSON.parse(text));
      } catch (e) {
        // вдруг там кривой json
        return res.status(200).json({
          ok: true,
          status: response.status,
          ctype,
          snip: text.slice(0, 500),
        });
      }
    }

    // иначе вернём кусок ответа для дебага
    return res.status(200).json({
      ok: true,
      status: response.status,
      ctype,
      snip: text.slice(0, 500),
    });
  } catch (err) {
    // сюда как раз падают ошибки вида "Client network socket disconnected…"
    return res.status(200).json({
      ok: false,
      error: String(err && err.message ? err.message : err),
    });
  }
};
