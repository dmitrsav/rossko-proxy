// api/rossko.js
export default async function handler(req, res) {
  try {
    return res.status(200).json({
      ok: true,
      route: "/api/rossko",
      query: req.query,
      env: {
        has_ROSSKO_API_KEY: Boolean(process.env.ROSSKO_API_KEY),
        has_PROXY_URL: Boolean(process.env.PROXY_URL),
      },
      note: "Это тест-ответ. Значит функция исполняется и не падает."
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
