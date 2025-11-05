// /api/rossko.js
// Принудительно направляем все fetch через прокси из PROXY_URL (undici ProxyAgent)
import { ProxyAgent, setGlobalDispatcher } from 'undici';

const proxyUrl = process.env.PROXY_URL || '';
if (proxyUrl) {
  try { setGlobalDispatcher(new ProxyAgent(proxyUrl)); } catch (e) { /* ignore */ }
}

export default async function handler(req, res) {
  try {
    const key = process.env.ROSSKO_API_KEY || '';
    if (!key) return res.status(500).json({ ok: false, error: 'ROSSKO_API_KEY is missing' });

    const q = (req.query.q || '').toString().trim();
    const delivery_id = (req.query.delivery_id || '000000002').toString();
    const address_id  = (req.query.address_id  || '301007').toString();

    if (!q) return res.status(400).json({ ok: false, error: 'Param "q" is required' });

    // Пример end-point'а (скажу прямо: у Росско несколько версий; этот вариант обычно работает)
    const url = new URL('https://api.rossko.ru/v2/public/guest/search');
    url.searchParams.set('text', q);
    url.searchParams.set('delivery_id', delivery_id);
    url.searchParams.set('address_id', address_id);

    const r = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': key
      }
      // таймаут можно задать через AbortController при желании
    });

    const ctype = r.headers.get('content-type') || '';
    const raw = await r.text();

    if (!r.ok) {
      return res.status(502).json({
        ok: false,
        status: r.status,
        ctype,
        body: raw.slice(0, 1200)
      });
    }

    // Иногда Росско отдаёт HTML при блокировке — ловим это
    if (!/application\/json/i.test(ctype)) {
      return res.status(200).json({
        ok: true,
        nonjson: true,
        ctype,
        snip: raw.slice(0, 1200)
      });
    }

    let data;
    try { data = JSON.parse(raw); }
    catch {
      return res.status(200).json({ ok: true, nonjson: true, ctype, snip: raw.slice(0, 1200) });
    }

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
