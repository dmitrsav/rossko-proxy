// api/rossko.js
import { HttpsProxyAgent } from 'https-proxy-agent';

export default async function handler(req, res) {
  const { q = '', delivery_id = '', address_id = '', debug } = req.query;

  try {
    const API_KEY = process.env.ROSSKO_API_KEY;
    const PROXY_URL = process.env.PROXY_URL;

    if (!API_KEY) {
      return res.status(500).json({ ok: false, error: 'ROSSKO_API_KEY is missing' });
    }
    if (!PROXY_URL) {
      return res.status(500).json({ ok: false, error: 'PROXY_URL is missing' });
    }

    const agent = new HttpsProxyAgent(PROXY_URL);

    // Пример эндпоинта (замените на ваш фактический URL РОССКО)
    const url = `https://api.rossko.ru/service/v2.1/goods.get?text=${encodeURIComponent(q)}&delivery_id=${encodeURIComponent(delivery_id)}&address_id=${encodeURIComponent(address_id)}`;

    const r = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        'Accept': 'application/json',
      },
      agent,
      cache: 'no-store',
    });

    const ctype = r.headers.get('content-type') || '';
    const raw = await r.text();

    // Если API вернул не JSON — покажем срез ответа
    if (!ctype.includes('application/json')) {
      return res.status(r.status).json({
        ok: false,
        status: r.status,
        ctype,
        snip: raw.slice(0, 400),
        hint: 'РОССКО вернул не JSON (скорее всего блок/капча/HTML). Проверьте IP прокси и доступы.',
        ...(debug ? { debug: { url, proxy: PROXY_URL.replace(/:\/\/[^@]+@/, '://***:***@') } } : {}),
      });
    }

    const data = JSON.parse(raw);
    return res.status(r.ok ? 200 : r.status).json({
      ok: r.ok,
      status: r.status,
      data,
      ...(debug ? { debug: { url, proxy: PROXY_URL.replace(/:\/\/[^@]+@/, '://***:***@') } } : {}),
    });

  } catch (e) {
    // Лог в логи Vercel, а клиенту — чистый текст
    console.error('ROSSKO handler error:', e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
