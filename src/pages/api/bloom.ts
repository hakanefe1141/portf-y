import type { APIRoute } from "astro";
import Groq from "groq-sdk";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { konu, hedefKitle, sure, seviye } = await request.json();

    if (!konu?.trim()) {
      return new Response(JSON.stringify({ error: "Konu boş olamaz" }), { status: 400 });
    }

    const client = new Groq({ apiKey: import.meta.env.GROQ_API_KEY });

    const prompt = `Sen deneyimli bir eğitim tasarımı uzmanısın. Aşağıdaki bilgilere göre Bloom Taksonomisinin 6 seviyesine uygun, ölçülebilir öğrenme hedefleri oluştur.

Konu: ${konu}
Hedef Kitle: ${hedefKitle || "Genel"}
Eğitim Süresi: ${sure || "Belirtilmedi"}
Seviye: ${seviye || "Orta"}

Öğrenme hedeflerini tam olarak bu JSON formatında döndür (başka hiçbir metin ekleme):
{
  "hedefler": [
    { "seviye": "Hatırlama", "renk": "#ef4444", "eylem": "listeler", "hedef": "..." },
    { "seviye": "Anlama", "renk": "#f97316", "eylem": "açıklar", "hedef": "..." },
    { "seviye": "Uygulama", "renk": "#eab308", "eylem": "uygular", "hedef": "..." },
    { "seviye": "Analiz", "renk": "#22c55e", "eylem": "analiz eder", "hedef": "..." },
    { "seviye": "Değerlendirme", "renk": "#3b82f6", "eylem": "değerlendirir", "hedef": "..." },
    { "seviye": "Yaratma", "renk": "#a78bfa", "eylem": "tasarlar", "hedef": "..." }
  ],
  "ipuclari": ["...", "...", "..."]
}

Her hedef cümlesi "Eğitim sonunda katılımcı/öğrenci; [eylem fiili]..." şeklinde başlasın. Hedefler somut, gözlemlenebilir ve ölçülebilir olsun.`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
      temperature: 0.6,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // JSON'u parse et
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Geçersiz yanıt formatı");
    const data = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Bloom API hatası:", err?.message);
    return new Response(
      JSON.stringify({ error: "Hedefler oluşturulamadı, tekrar dene." }),
      { status: 500 }
    );
  }
};
