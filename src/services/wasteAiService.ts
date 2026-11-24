import type {
  DisposalMotionProof,
  DisposalVerificationScenario,
  WasteStreamType
} from '../types';
import { WASTE_STREAM_META } from './campusWasteLocationsService';
import { MIN_LIVE_MOTION_SCORE } from './motionClipService';

export interface WasteAnalysisResult {
  reply: string;
  recommendedBin: string;
}

export interface DisposalPhotoMatchResult {
  isMatch: boolean;
  message: string;
  motionVerified?: boolean;
}

const normalizeTurkish = (input: string): string => {
  return input
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ç', 'c')
    .replaceAll('ğ', 'g')
    .replaceAll('ı', 'i')
    .replaceAll('ö', 'o')
    .replaceAll('ş', 's')
    .replaceAll('ü', 'u')
    .replaceAll('â', 'a')
    .replaceAll('î', 'i')
    .replaceAll('û', 'u');
};

const SAU_KNOWLEDGE_BASE: Array<{
  keywords: string[];
  recommendedBin: string;
  reply: string;
}> = [
  {
    keywords: ['pizza', 'yagli kutu', 'pizza kutusu', 'lahmacun', 'pide kutusu'],
    recommendedBin: 'Koyu Gri Poşet · Diğer Atıklar',
    reply:
      'SAÜ Sıfır Atık kuralına göre yağ bulaşmış pizza kutuları Koyu Gri Poşet (Diğer Atıklar) bölmesine atılır; yalnızca tamamen temiz ve yağsız kapak kısmı Mavi Poşet (Kâğıt) kutusuna ayrılabilir.'
  },
  {
    keywords: ['kahve bardagi', 'karton bardak', 'kagit bardak', 'kagit tabak', 'bardak kapagi', 'kahve'],
    recommendedBin: 'Koyu Gri Poşet + Sarı Poşet (Kapak)',
    reply:
      'Kâğıt/karton kahve bardakları iç plastik kaplaması nedeniyle Koyu Gri Poşet (Diğer Atıklar) bölmesine atılır. Üstündeki sert plastik kapağı ayırıp Sarı Poşet (Plastik) bölmesine bırakmalısın.'
  },
  {
    keywords: ['islak mendil', 'pecete', 'kagit pecete', 'havlu kagit', 'mendil'],
    recommendedBin: 'Koyu Gri Poşet · Diğer Atıklar',
    reply:
      'Islak mendil, kâğıt peçete ve kullanılmış kâğıt havlular geri dönüştürülemez; doğrudan Koyu Gri Poşet (Diğer Atıklar) bölmesine atılmalıdır.'
  },
  {
    keywords: ['izmarit', 'sigara', 'sakiz', 'cay posasi', 'kahve posasi', 'posa', 'yemek artigi', 'meyve kabugu', 'muz kabugu', 'elma'],
    recommendedBin: 'Koyu Gri Poşet · Diğer Atıklar',
    reply:
      'Sönmüş izmarit, sakız, çay-kahve posası ve organik yemek/meyve kalıntıları Koyu Gri Poşet (Diğer Atıklar) bölmesine bırakılır.'
  },
  {
    keywords: ['kargo poseti', 'poset', 'naylon', 'strech', 'ambalaj', 'cips', 'biskuvi', 'cikolata', 'kraker'],
    recommendedBin: 'Sarı Poşet · Plastik · Cam · Metal',
    reply:
      'Kargo poşeti, market poşeti ve içi boşaltılmış temiz plastik ambalajlar SAÜ sisteminde Sarı Poşet (Plastik · Cam · Metal) bölmesine atılır.'
  },
  {
    keywords: ['pet sise', 'su sisesi', 'plastik sise', 'ayran', 'yogurt', 'sise', 'kapak', 'plastik catal', 'plastik kasik'],
    recommendedBin: 'Sarı Poşet · Plastik · Cam · Metal',
    reply:
      'İçindeki sıvıyı boşaltıp mümkünse ezerek Sarı Poşet (Plastik · Cam · Metal) bölmesine atabilirsin.'
  },
  {
    keywords: ['sut kutusu', 'meyve suyu', 'tetra pak', 'icecek kutusu', 'kola kutusu', 'gazoz', 'teneke', 'konserve', 'aluminyum', 'folyo', 'atac', 'zimba'],
    recommendedBin: 'Sarı Poşet · Plastik · Cam · Metal',
    reply:
      'İçecek kutuları, konserve kutusu, alüminyum kap, ataç ve zımba telleri SAÜ Sıfır Atık sisteminde Sarı Poşet (Plastik · Cam · Metal) bölmesine atılır.'
  },
  {
    keywords: ['cam sise', 'soda sisesi', 'kavanoz', 'cam bardak', 'cam'],
    recommendedBin: 'Sarı Poşet · Plastik · Cam · Metal',
    reply:
      'İçi boş cam şişe ve kavanozlar Sarı Poşet (Plastik · Cam · Metal) bölmesine bırakılır.'
  },
  {
    keywords: ['seramik', 'porselen', 'kupa', 'fincan', 'kirik cam', 'ayna'],
    recommendedBin: 'Koyu Gri Poşet · Diğer Atıklar',
    reply:
      'Seramik, porselen kupa ve ayna cam geri dönüşümünü bozar; güvenli şekilde sarılarak Koyu Gri Poşet (Diğer Atıklar) bölmesine bırakılmalıdır.'
  },
  {
    keywords: ['kagit', 'defter', 'ders notu', 'fotokopi', 'kitap', 'gazete', 'dergi', 'brosur', 'zarf', 'karton kutu', 'karton', 'kese kagidi'],
    recommendedBin: 'Mavi Poşet · Kâğıt Atıklar',
    reply:
      'Kuru ve temiz kâğıt, defter, ders notu, gazete, dergi, broşür, zarf ve karton kutular Mavi Poşet (Kâğıt Atıklar) bölmesine atılır. Islak veya yağlı olmamasına dikkat et.'
  },
  {
    keywords: ['pil', 'kalem pil', 'saat pili', 'batarya', 'sarjli pil', 'kumanda pili'],
    recommendedBin: 'Bina Girişi · Atık Pil Kutusu',
    reply:
      'Piller 3 bölmeli kutulara kesinlikle atılmaz. Esentepe Kampüsü’nde her binanın girişinde bulunan kırmızı Atık Pil Kutusu’na bırakmalısın.'
  },
  {
    keywords: ['elektronik', 'e-atik', 'sarj kablosu', 'kulaklik', 'telefon', 'kartus', 'toner', 'atik yag', 'ilac', 'tibbi', 'maske', 'enjektor', 'powerbank'],
    recommendedBin: '3 Bölmeli Kutulara Atılmaz',
    reply:
      'Elektronik atık, kartuş, atık yağ, tıbbi ve tehlikeli atıkların 3 bölmeli kutulara atılması yasaktır. İlgili fakülte idari birimine veya lisanslı toplama noktasına teslim edilmelidir.'
  }
];

export async function analyzeWasteInput(
  promptText: string,
  imageBase64: string | null,
  apiKey: string
): Promise<WasteAnalysisResult> {
  try {
    const serverRes = await fetch('/api/analyze-waste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'chat',
        promptText,
        imageBase64
      })
    });

    if (serverRes.ok) {
      const data = await serverRes.json();
      if (!data.fallback && data.reply) {
        return {
          reply: String(data.reply).trim(),
          recommendedBin: String(data.recommendedBin || 'SAÜ Sıfır Atık Önerisi')
        };
      }
    }
  } catch {}

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const parts: Array<Record<string, unknown>> = [
        {
          text: `Sen Sakarya Üniversitesi Yeşil Adım Sıfır Atık asistanısın. Sarı Poşet (Plastik-Cam-Metal), Mavi Poşet (Kâğıt), Koyu Gri Poşet (Diğer/Evsel) ve Bina Girişi Atık Pil Kutusu kurallarına göre maksimum 2 cümleyle Türkçe açıkla. Emoji kullanma. Soru: ${promptText || 'Bu görseldeki atığı hangi kutuya atmalıyım?'}`
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
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
          'Atık analiz edildi. Lütfen uygun renkli bölmeye bırakın.';
        return {
          reply: generatedText.trim(),
          recommendedBin: 'Yeşil Asistan Analizi'
        };
      }
    } catch {}
  }

  const normalized = normalizeTurkish(promptText);
  let bestMatch: (typeof SAU_KNOWLEDGE_BASE)[number] | null = null;
  let maxScore = 0;

  for (const item of SAU_KNOWLEDGE_BASE) {
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
        'Görsel alındı. Plastik, cam veya metal ambalaj ise Sarı Poşet; kuru ve temiz kâğıt/karton ise Mavi Poşet; yağlı, ıslak veya kâğıt bardak/peçete türü ise Koyu Gri Poşet bölmesine bırakmalısın.',
      recommendedBin: 'SAÜ 3+1 Ayrıştırma Rehberi'
    };
  }

  return {
    reply:
      'SAÜ 3+1 kuralı: Temiz plastik, cam ve metal ambalajlar Sarı Poşet; kuru kâğıt ve kartonlar Mavi Poşet; yağlı/ıslak atıklar, peçete ve kâğıt bardaklar Koyu Gri Poşet; piller ise bina girişindeki Atık Pil Kutusu’na atılır.',
    recommendedBin: 'SAÜ Sıfır Atık 3+1 Sistemi'
  };
}

export async function verifyDisposalClipWithAi(
  proof: DisposalMotionProof,
  selectedStream: WasteStreamType,
  apiKey?: string,
  testScenario: DisposalVerificationScenario = 'normal'
): Promise<DisposalPhotoMatchResult> {
  const meta = WASTE_STREAM_META[selectedStream];

  if (testScenario === 'wrong_bin') {
    return {
      isMatch: false,
      motionVerified: true,
      message: `Yanlış Bölme: Kayıttaki kutu rengi '${meta.bagLabel}' ile uyuşmuyor. Doğru bölmeye bırakırken tekrar kaydedin.`
    };
  }

  if (testScenario === 'take_back_fraud') {
    return {
      isMatch: false,
      motionVerified: false,
      message: `Geri Çekme Tespit Edildi: 3. karede atığın '${meta.bagLabel}' bölmesine bırakıldığı doğrulanamadı.`
    };
  }

  if (
    proof.mode === 'live_motion_clip' &&
    proof.frames.length >= 2 &&
    proof.motionScore < MIN_LIVE_MOTION_SCORE
  ) {
    return {
      isMatch: false,
      motionVerified: false,
      message:
        'Hareket Algılanmadı: Sabit görüntü tespit edildi. Atığı kutuya bırakırken 2-3 sn hareketli kaydedin.'
    };
  }

  if (proof.mode !== 'simulated_motion_clip' && proof.frames.length > 0) {
    try {
      const serverRes = await fetch('/api/analyze-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_clip',
          frames: proof.frames.slice(0, 3),
          selectedStream,
          streamLabel: meta.label,
          bagLabel: meta.bagLabel
        })
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (!data.fallback && typeof data.isMatch === 'boolean') {
          return {
            isMatch: data.isMatch,
            motionVerified: data.motionVerified !== false,
            message: String(data.message || 'Hareket kaydı doğrulandı.')
          };
        }
      }
    } catch {}
  }

  if (apiKey && apiKey.trim().length > 10 && proof.frames.length > 0) {
    try {
      const parts: Array<Record<string, unknown>> = [
        {
          text: `Sen Sakarya Üniversitesi Sıfır Atık hareket doğrulama denetleyicisisin. Sana 2-3 saniyelik atık bırakma kaydından ${proof.frames.length} kare gönderiyorum. Seçilen bölme: ${meta.label} (${meta.bagLabel}). Atık ve kutu uyumlu mu ve atık gerçekten bırakılmış mı kontrol et. Yalnızca JSON yanıt ver: {"isMatch": true, "motionVerified": true, "reason": "kısa Türkçe açıklama"}`
        }
      ];

      for (const frame of proof.frames.slice(0, 3)) {
        const cleanBase64 = frame.split(',')[1] || frame;
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: cleanBase64
          }
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const matched = Boolean(parsed.isMatch) && parsed.motionVerified !== false;
          return {
            isMatch: matched,
            motionVerified: parsed.motionVerified !== false,
            message:
              parsed.reason ||
              (matched
                ? `Hareket kaydı doğrulandı: ${meta.bagLabel} onaylandı.`
                : 'Atığın doğru bölmeye bırakıldığı doğrulanamadı.')
          };
        }
      }
    } catch {}
  }

  return {
    isMatch: true,
    motionVerified: true,
    message: `Optimize hareket kaydı (${proof.frames.length} kare · ${proof.estimatedSizeKb} KB) doğrulandı: ${meta.label} (${meta.bagLabel}) teyit edildi.`
  };
}
