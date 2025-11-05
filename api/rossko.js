import fetch from "node-fetch";
import HttpsProxyAgent from "https-proxy-agent";

export default async function handler(req, res) {
  try {
    const { q, delivery_id, address_id } = req.query;

    // Прокси из переменной окружения
    const proxyUrl = process.env.PROXY_URL;
    const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;

    // Собираем URL запроса
    const url = `https://api.rossko.ru/service/v2.1/search?text=${encodeURIComponent(q)}&delivery_id=${delivery_id}&address_id=${address_id}`;

    // Отправляем запрос через прокси
    const response = await fetch(url, {
      headers: {
        "Authorization": `Basic ${Buffer.from(process.env.ROSSKO_API_KEY + ":").toString("base64")}`,
        "Accept": "application/json",
      },
      agent,
    });

    if (!response.ok) {
      throw new Error(`Rossko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
