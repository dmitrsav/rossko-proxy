// api/proxy-ip.js
import { HttpsProxyAgent } from 'https-proxy-agent';

export default async function handler(req, res) {
  try {
    const proxyUrl = process.env.PROXY_URL; // формат: http://user:pass@IP:PORT
    if (!proxyUrl) {
      return res.status(500).json({ ok: false, error: 'PROXY_URL env is missing' });
    }

    const agent = new HttpsProxyAgent(proxyUrl);
    const r = await fetch('https://ifconfig.me/ip', { agent, cache: 'no-store' });
    const text = await r.text();

    res.json({
      ok: true,
      proxy: proxyUrl.replace(/:\/\/[^@]+@/, '://***:***@'), // маскируем логин/пароль
      status: r.status,
      ip: text.trim(),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
