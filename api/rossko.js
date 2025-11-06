// api/rossko.js
import fetch from "node-fetch";
import HttpsProxyAgent from "https-proxy-agent";

export default async function handler(req, res) {
  try {
    const { q = "", delivery_id = "", address_id = "" } = req.query;

    if (!process.env.ROSSKO_API_KEY) {
      return res.status(500).json({ ok: false, error: "Missing ROSSKO_API_KEY env" });
    }

    // ВАЖНО: проверьте, что это правильный URL и метод для нужного эндпоинта РОССКО.
    // Ниже — пример. Если у вас другой — просто поменяйте `rosskoUrl` и тело/метод.
    const rosskoUrl = `https://api.rossko.ru/service/v2.1/catalog/search`;
    const payload = { text: q, delivery_id, address_id };

    const headers = {
      "Content-Type": "application/json",
      // Какая авторизация у РОССКО у вас на тарифе:
      // Часто это "Authorization: Bearer <token>" или "X-Api-Key: <key>"
      // Поставьте нужный вариант и уберите ненужный.
      "Authorization": `Bearer ${process.env.ROSSKO_API_KEY}`,
      "X-Api-Key": process.env.ROSSKO_API_KEY
    };

    const agent = process.env.PROXY_URL ? new HttpsProxyAgent(process.env.PROXY_URL) : undefined;

    const upstream = await fetch(rosskoUrl, {
      method: "POST",          // Если у РОССКО поиск — GET, замените на "GET" и уберите body
      headers,
      body: JSON.stringify(payload),
      agent,
      timeout: 20000
    });

    const ctype = upstream.headers.get("content-type") || "";
    const text = await upstream.text();

    // Возвращаем всё, что нужно для диагностики
    return res.status(200).json({
      ok: upstream.ok,
      status: upstream.status,
      ctype,
      // кусочек ответа, чтобы не залить логи мегабайтами
      bodyPreview: text.slice(0, 800),
      usedUrl: rosskoUrl,
      sentPayload: payload,
      sentHeaders: {
        // не светим ключ целиком
        ...headers,
        Authorization: headers.Authorization ? "SET" : "NONE",
        "X-Api-Key": headers["X-Api-Key"] ? "SET" : "NONE"
      },
      viaProxy: Boolean(process.env.PROXY_URL)
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
