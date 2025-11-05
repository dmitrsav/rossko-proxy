// api/rossko.js  — Node.js Serverless Function на Vercel
export default async function handler(req, res) {
  try {
    // Разбираем входные параметры
    const { q = '', delivery_id = '', address_id = '' } = req.query;

    if (!q) {
      return res.status(400).json({ ok: false, error: "Параметр q обязателен" });
    }

    // Ключ из переменных окружения Vercel
    const API_KEY = process.env.ROSSKO_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ ok: false, error: "Нет ROSSKO_API_KEY" });
    }

    // ВНИМАНИЕ: укажите правильный URL их API (пример! замените на тот, что у вас в документации)
    const upstreamUrl = new URL('https://api.rossko.ru/service/v2/search'); // пример
    upstreamUrl.searchParams.set('q', q);
    if (delivery_id) upstreamUrl.searchParams.set('delivery_id', delivery_id);
    if (address_id)  upstreamUrl.searchParams.set('address_id', address_id);

    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'rossko-proxy (+vercel)',
      // подставьте нужный заголовок авторизации из их документации:
      'Authorization': `Bearer ${API_KEY}`,
      // либо, если у них другой формат:
      // 'X-Api-Key': API_KEY,
    };

    const r = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers,
      // чтобы не кешировалось Vercel’ем
      cache: 'no-store',
      // на всякий случай уменьшим риск обрыва
      redirect: 'follow',
    });

    const text = await r.text();

    // Если ответ не JSON — вернём диагностический блок
    try {
      const data = JSON.parse(text);
      return res.status(r.ok ? 200 : r.status).json(data);
    } catch {
      return res.status(r.status || 502).json({
        ok: false,
        error: 'Upstream returned non-JSON',
        diag: { ctype: r.headers.get('content-type'), snip: text.slice(0, 300) }
      });
    }
  } catch (e) {
    return res.status(502).json({ ok: false, error: String(e) });
  }
}
