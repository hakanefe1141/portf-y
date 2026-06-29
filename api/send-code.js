const nodemailer = require("nodemailer");

const FB = "https://firestore.googleapis.com/v1/projects/hakan-efe-portfolyo/databases/(default)/documents";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    let body = req.body || {};
    if (typeof body === "string") { try { body = JSON.parse(body); } catch {} }

    const email = (body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({ error: "Geçersiz e-posta" });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Kodu Firestore'a kaydet
    await fetch(`${FB}/verifications/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: {
        code:      { stringValue: code },
        expiresAt: { stringValue: expiresAt },
      }}),
    });

    // Gmail ile gönder
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Hakan Efe Portfolyo" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Geri Bildirim Doğrulama Kodunuz",
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:28px">
          <h2 style="color:#7c3aed;margin-bottom:8px">Doğrulama Kodu</h2>
          <p style="color:#444;margin-bottom:20px">hakanefe.com sitesine geri bildirim göndermek için kodunuz:</p>
          <div style="font-size:2.2rem;font-weight:700;letter-spacing:0.35em;color:#7c3aed;
                      padding:20px;background:#f5f3ff;border-radius:12px;text-align:center">
            ${code}
          </div>
          <p style="color:#999;font-size:0.85rem;margin-top:16px">Bu kod 10 dakika geçerlidir.</p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error("send-code error:", e);
    return res.status(500).json({ error: e.message || "Sunucu hatası" });
  }
};
