const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

const SAU_RULES_PROMPT =
  'Sen Sakarya Universitesi (SAU) Esentepe Kampusu Yesil Adim Sifir Atik asistanisin. ' +
  'SAU resmi 3+1 sistem kurallari: ' +
  '1) Sari Poset (Plastik, Cam, Metal): Pet sise, cam sise, kapak, kavanoz, teneke icecek/konserve kutusu, aluminyum kap/folyo, atac, zimba teli, kargo poseti, temiz sut/meyve suyu kartonu, temiz plastik ambalaj. ' +
  '2) Mavi Poset (Kagit Atiklar): Kuru ve temiz kagit, defter, ders notu, gazete, dergi, kitap, brosur, zarf, temiz karton kutu (islak veya yagli kagit atilmaz). ' +
  '3) Koyu Gri Poset (Diger Atiklar): Pizza kutusu, karton/kagit kahve bardagi ve tabagi, islak mendil, kagit pecete, sonmus izmarit, sakiz, cay-kahve posasi, yemek artigi, kirik porselen/seramik. ' +
  '4) Bina Girisi Atik Pil Kutusu: Tum piller ve bataryalar yalnizca bina girislerindeki kirmizi atik pil kutusuna atilir. ' +
  '5) 3lu Kutulara Yasak: Elektronik atik, kartus, atik yag, tibbi ve tehlikeli atiklar bu kutulara atilmaz. ' +
  'Emoji kullanma, kisa ve net Turkce yaz.';

const callGemini = async (apiKey, parts) => {
  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) return text;
    }
  }
  return null;
};

const jsonResponse = (body, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
};

export default async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return jsonResponse({ fallback: true }, 200);
  }

  try {
    const payload = await request.json();
    const action = payload?.action || 'chat';

    if (action === 'verify_clip') {
      const frames = Array.isArray(payload.frames) ? payload.frames.slice(0, 3) : [];
      const streamLabel = payload.streamLabel || 'Secili Bolme';
      const bagLabel = payload.bagLabel || '';

      if (frames.length === 0) {
        return jsonResponse({ fallback: true }, 200);
      }

      const parts = [
        {
          text:
            `${SAU_RULES_PROMPT} ` +
            `Sana 2-3 saniyelik atik birakma kaydindan kronolojik sirayla ${frames.length} kare gonderiyorum. ` +
            `Secilen kategori: ${streamLabel} (${bagLabel}). ` +
            'Atik ve bolme uyumlu mu ve atik gercekten birakilmis mi (geri cekilmemis mi) kontrol et. ' +
            'Yalnizca su JSON formatinda yanit ver: {"isMatch": true, "motionVerified": true, "message": "en fazla 2 cumle Turkce sonuc"}'
        }
      ];

      for (const frame of frames) {
        const clean = String(frame).split(',')[1] || String(frame);
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: clean
          }
        });
      }

      const raw = await callGemini(apiKey, parts);
      if (!raw) return jsonResponse({ fallback: true }, 200);

      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return jsonResponse({ fallback: true }, 200);

      const parsed = JSON.parse(match[0]);
      const isMatch = Boolean(parsed.isMatch) && parsed.motionVerified !== false;
      return jsonResponse({
        fallback: false,
        isMatch,
        motionVerified: parsed.motionVerified !== false,
        message: parsed.message || (isMatch ? 'Hareket kaydi dogrulandi.' : 'Dogrulama reddedildi.')
      });
    }

    const promptText = String(payload.promptText || '').trim();
    const imageBase64 = payload.imageBase64 ? String(payload.imageBase64) : null;

    const parts = [
      {
        text:
          `${SAU_RULES_PROMPT} ` +
          `Kullanicinin sorusu: "${promptText || 'Bu gorseldeki atigi hangi kutuya atmaliyim?'}" ` +
          'En fazla 2 kisa ve net Turkce cumle ile cevap ver. ' +
          'Yalnizca su JSON formatinda yanit ver: {"recommendedBin": "Sari Poset · Plastik, Cam, Metal veya Mavi Poset · Kagit veya Koyu Gri Poset · Diger Atiklar veya Bina Girisi · Atik Pil Kutusu", "reply": "kisa Turkce aciklama"}'
      }
    ];

    if (imageBase64) {
      const clean = imageBase64.split(',')[1] || imageBase64;
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: clean
        }
      });
    }

    const raw = await callGemini(apiKey, parts);
    if (!raw) return jsonResponse({ fallback: true }, 200);

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return jsonResponse({ fallback: true }, 200);

    const parsed = JSON.parse(match[0]);
    return jsonResponse({
      fallback: false,
      recommendedBin: parsed.recommendedBin || 'SAÜ Sıfır Atık Önerisi',
      reply: parsed.reply || 'Atığı uygun SAÜ renkli bölmesine bırakabilirsiniz.'
    });
  } catch {
    return jsonResponse({ fallback: true }, 200);
  }
};
