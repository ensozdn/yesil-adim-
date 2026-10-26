export interface WasteAnalysisResult {
  reply: string;
  recommendedBin: string;
}

const LOCAL_KNOWLEDGE_BASE: Array<{
  keywords: string[];
  recommendedBin: string;
  reply: string;
}> = [
  {
    keywords: ['pizza', 'yağlı pizza', 'pizza kutusu', 'yağlı kutu'],
    recommendedBin: 'Ayırarak Atık Kutusu (Kâğıt + Genel Çöp)',
    reply:
      'Pizza kutularının yağ ve yemek kalıntısı bulaşmış alt kısmı kâğıt geri dönüşüm sürecini bozar. Yağlı alt tabanı Genel Çöp kutusuna, temiz kalan üst kapağı ise Kâğıt/Karton geri dönüşüm kutusuna bırakmalısın.'
  },
  {
    keywords: ['kahve', 'karton bardak', 'kahve bardağı', 'bardak kapağı'],
    recommendedBin: 'Plastik Kapak + Genel Çöp',
    reply:
      'Karton kahve bardaklarının iç yüzeyinde sıvı geçirmemesi için ince bir plastik kaplama bulunur. Bu nedenle bardağın gövdesini Genel Çöp kutusuna, üstündeki sert plastik kapağı ise Plastik geri dönüşüm kutusuna atmalısın.'
  },
  {
    keywords: ['şişe', 'pet şişe', 'su şişesi', 'plastik şişe', 'ayran kutusu'],
    recommendedBin: 'Plastik Geri Dönüşüm Kutusu',
    reply:
      'Plastik şişenin içindeki sıvıyı tamamen boşalttıktan ve mümkünse ezerek hacmini küçülttükten sonra doğrudan Plastik geri dönüşüm kutusuna atabilirsin.'
  },
  {
    keywords: ['pil', 'kalem pil', 'batarya', 'şarjlı pil', 'e-atık'],
    recommendedBin: 'Atık Pil / E-Atık Kutusu',
    reply:
      'Piller ve elektronik parçalar toprağa ve suya zararlı ağır metaller içerir. Kesinlikle normal çöpe atılmamalı, fakülte girişlerindeki Atık Pil veya Elektronik Atık noktalarına bırakılmalıdır.'
  },
  {
    keywords: ['kupa', 'seramik', 'porselen', 'kırık cam', 'cam kavanoz'],
    recommendedBin: 'Cam Kutusu / Evsel Atık Kontrolü',
    reply:
      'İçecek şişeleri ve kavanozlar Cam geri dönüşüm kutusuna atılır. Ancak kırık seramik veya porselen kupalar camın erime derecesini bozduğu için Cam kutusuna değil, korunaklı şekilde Genel Çöp kutusuna bırakılmalıdır.'
  }
];

export async function analyzeWasteInput(
  promptText: string,
  imageBase64: string | null,
  apiKey: string
): Promise<WasteAnalysisResult> {
  const normalized = promptText.toLocaleLowerCase('tr-TR');

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const parts: Array<Record<string, unknown>> = [
        {
          text: `Sen Sakarya Üniversitesi Yeşil Adım kampüs geri dönüşüm asistanısın. Kullanıcının sorduğu veya fotoğrafını yüklediği atığın hangi kutuya atılması gerektiğini maksimum 3 cümleyle, net ve Türkçe olarak açıkla. Emoji kullanma. Soru: ${promptText || 'Bu görseldeki atığı hangi kutuya atmalıyım?'}`
        }
      ];

      if (imageBase64) {
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: cleanBase64
          }
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generatedText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          'Atık analiz edildi. Lütfen kutu üzerindeki yönlendirmelere dikkat ederek ayrıştırın.';
        return {
          reply: generatedText.trim(),
          recommendedBin: 'AI Analiz Sonucu'
        };
      }
    } catch {
    }
  }

  let bestMatch: (typeof LOCAL_KNOWLEDGE_BASE)[number] | null = null;
  let maxScore = 0;

  for (const item of LOCAL_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of item.keywords) {
      if (normalized.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && maxScore > 0) {
    return {
      reply: bestMatch.reply,
      recommendedBin: bestMatch.recommendedBin
    };
  }

  if (imageBase64) {
    return {
      reply:
        'Görseldeki atığı inceledim. Eğer üzerinde yemek veya yağ kalıntısı varsa (örneğin pizza kutusu altlığı veya kirli peçete) Genel Çöp kutusuna, temiz ve kuru ambalaj niteliğindeyse ilgili Kâğıt veya Plastik geri dönüşüm kutusuna bırakmalısın.',
      recommendedBin: 'Temizlik Durumuna Göre Kâğıt / Plastik'
    };
  }

  return {
    reply:
      'Bu atık için temel kuralımız: Ambalaj temiz, kuru ve kalıntısız ise türüne göre Kâğıt, Plastik veya Cam kutusuna; yoğun yemek yağı veya sıvı bulaşmışsa diğer geri dönüştürülebilir atıkları kirletmemesi için Genel Çöp kutusuna atılmalıdır.',
    recommendedBin: 'Kampüs Ayrıştırma Noktası'
  };
}
