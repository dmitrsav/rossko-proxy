// /api/rossko.js
export default async function handler(req, res) {
  try {
    const { q = "", delivery_id = "", address_id = "" } = req.query;

    if (!process.env.ROSSKO_API_KEY) {
      return res.status(500).json({ ok: false, error: "Missing ROSSKO_API_KEY" });
    }
    if (!q || !delivery_id || !address_id) {
      return res.status(400).json({ ok: false, error: "q, delivery_id, address_id are required" });
    }

    const url = `https://b2b.rossko.ru/service/v2.1/search/byname?q=${encodeURIComponent(q)}&delivery_id=${encodeURIComponent(delivery_id)}&address_id=${encodeURIComponent(address_id)}`;

    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "AutocPro/1.0",
        "Accept": "application/json",
        "X-Api-Key": process.env.ROSSKO_API_KEY,
      },
    });

    const ctype = upstream.headers.get("content-type") || "";
    const bodyText = await upstream.text();

    if (!upstream.ok) {
      return res.status(502).json({
        ok: false,
        error: `Upstream HTTP ${upstream.status}`,
        diag: { url, status: upstream.status, body: bodyText.slice(0, 400) },
      });
    }

    // ROSSKO иногда отдаёт HTML при ошибках — ловим это
    if (!ctype.includes("application/json")) {
      return res.status(502).json({
        ok: false,
        error: "Upstream returned non-JSON",
        diag: { ctype, snip: bodyText.slice(0, 400) },
      });
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).send(bodyText);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}

