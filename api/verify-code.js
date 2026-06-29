const FB = "https://firestore.googleapis.com/v1/projects/hakan-efe-portfolyo/databases/(default)/documents";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    let body = req.body || {};
    if (typeof body === "string") { try { body = JSON.parse(body); } catch {} }

    const email = (body.email || "").trim().toLowerCase();
    const code  = (body.code  || "").trim();

    const r = await fetch(`${FB}/verifications/${encodeURIComponent(email)}`);
    if (!r.ok) return res.status(400).json({ ok: false, error: "Kod bulunamadı. Tekrar gönder." });

    const data = await r.json();
    const storedCode = data.fields?.code?.stringValue;
    const expiresAt  = data.fields?.expiresAt?.stringValue;

    if (!storedCode || (expiresAt && new Date() > new Date(expiresAt))) {
      return res.status(400).json({ ok: false, error: "Kodun süresi dolmuş. Tekrar gönder." });
    }

    if (storedCode !== code) {
      return res.status(400).json({ ok: false, error: "Yanlış kod, tekrar dene." });
    }

    await fetch(`${FB}/verifications/${encodeURIComponent(email)}`, { method: "DELETE" });

    return res.status(200).json({ ok: true });

  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || "Sunucu hatası" });
  }
}
