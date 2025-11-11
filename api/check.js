import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

const PROXY_URL = process.env.PROXY_URL;
const agent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : null;

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ ok: false, error: 'Missing url' });
    }

    const r = await fetch(url, { agent: agent || undefined });
    const snip = (await r.text()).slice(0, 200);

    res.status(200).json({
      ok: r.ok,
      status: r.status,
      ctype: r.headers.get('content-type') || '',
      snip,
    });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e) });
  }
}
