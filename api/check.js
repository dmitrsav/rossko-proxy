export default async function handler(req, res) {
  const url = req.query.url || 'https://api.rossko.ru/';
  try {
    const r = await fetch(url, { cache: 'no-store' });
    const text = await r.text();
    res.status(200).json({
      ok: true,
      status: r.status,
      ctype: r.headers.get('content-type'),
      snip: text.slice(0, 200)
    });
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e) });
  }
}
