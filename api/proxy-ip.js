const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const r = await fetch('https://ifconfig.me/ip');
    const ip = (await r.text()).trim();

    res.status(200).json({ ok: true, ip });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e.message || e) });
  }
};
