import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

const ROSSCO_URL = 'https://api.rossko.ru/service/v2/search';
const PROXY_URL = process.env.PROXY_URL;

const agent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : null;

export default async function handler(req, res) {
  try {
    const { q, delivery_id, address_id } = req.query;

    if (!q) {
      return res.status(400).json({ ok: false, error: 'Missing q' });
    }

    const url = new URL(ROSSCO_URL);
    url.searchParams.set('text', q);
    if (delivery_id) url.searchParams.set('delivery_id', delivery_id);
    if (address_id) url.searchParams.set('address_id', address_id);

    const response = await fetch(url.toString(), {
      // тут подставь свои реальные заголовки Rossko (ключ и т.п.)
      headers: {
        'Content-Type': 'application/json',
      },
      agent: agent || undefined,
    });

    const text = await response.text();

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ ok: false, status: response.status, body: text });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return res.status(200).json({ ok: true, data });
  } catch (error) {
    console.error('ROSSKO PROXY ERROR', error);
    return res.status(500).json({ ok: false, error: String(error) });
  }
}
