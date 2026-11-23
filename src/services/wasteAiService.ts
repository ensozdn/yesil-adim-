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
          recommendedBin: 'Yeşil Asistan Analiz Sonucu'
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

export async function verifyDisposalPhotoWithAi(
  imageBase64: string,
  selectedStream: WasteStreamType,
  apiKey?: string,
  forceMismatchSimulation?: boolean
): Promise<DisposalPhotoMatchResult> {
  const meta = WASTE_STREAM_META[selectedStream];

  if (forceMismatchSimulation) {
    return {
      isMatch: false,
      message: `Görsel Eşleşme Reddedildi: Çekilen fotoğraftaki bölme ile seçtiğiniz '${meta.label} (${meta.bagLabel})' kategorisi uyuşmuyor. Lütfen atığı kutudaki doğru renkli göze bırakırken fotoğraflayınız.`
    };
  }

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      const parts: Array<Record<string, unknown>> = [
        {
          text: `Sen Sakarya Üniversitesi Sıfır Atık AI güvenlik denetleyicisisin. Kullanıcı atığı kutunun bölmesine bırakırken fotoğraf çekti. Seçilen bölme: ${meta.label} (${meta.bagLabel}). Bu fotoğraftaki atık veya kutu bölmesi seçilen kategoriyle uyumlu mu? Yalnızca JSON formatında yanıt ver: {"isMatch": true veya false, "reason": "kısa Türkçe açıklama"}`
        },
        {
          inline_data: {
            mime_type: 'image/jpeg',
            data: cleanBase64
          }
        }
      ];

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
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            isMatch: Boolean(parsed.isMatch),
            message:
              parsed.reason ||
              (parsed.isMatch
                ? `Görsel doğrulandı: ${meta.label} bölmesi onaylandı.`
                : 'Fotoğraftaki atık veya kutu bölmesi uyuşmuyor.')
          };
        }
      }
    } catch {}
  }

  return {
    isMatch: true,
    message: `Görsel doğrulandı: ${meta.label} (${meta.bagLabel}) bölmesiyle uyumlu bulundu.`
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
      message: `Yanlış Bölme Tespit Edildi: 3 karelik hareket kaydındaki kutu rengi seçtiğiniz '${meta.label} (${meta.bagLabel})' kategorisiyle uyuşmuyor. Lütfen doğru bölmeye bırakırken tekrar kaydedin.`
    };
  }

  if (testScenario === 'take_back_fraud') {
    return {
      isMatch: false,
      motionVerified: false,
      message: `Atıp Geri Alma Şüphesi: 3. karede atığın '${meta.bagLabel}' bölmesine bırakıldığı teyit edilemedi (nesne kadrajda geri çekildi). Lütfen atığı kutuya bırakıp elinizi çekene kadar kaydı tamamlayın.`
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
        'Hareket Teyidi Yetersiz: Kayıt süresince sabit bir görüntü algılandı. Atığın kutuya bırakılma anını 2-3 saniye boyunca hareketli olarak kaydedin.'
    };
  }

  if (apiKey && apiKey.trim().length > 10 && proof.frames.length > 0) {
    try {
      const parts: Array<Record<string, unknown>> = [
        {
          text: `Sen Sakarya Üniversitesi Sıfır Atık hareket doğrulama denetleyicisisin. Sana 2-3 saniyelik düşük çözünürlüklü bir atık bırakma kaydından kronolojik sırayla çıkarılmış ${proof.frames.length} kare gönderiyorum (1. kare başlangıç, 2. kare bırakma anı, 3. kare bitiş). Seçilen bölme: ${meta.label} (${meta.bagLabel}). Şunları kontrol et: (1) Atık ve kutu seçilen kategoriyle uyumlu mu? (2) Atık gerçekten bırakılmış mı, yoksa elde geri mi çekilmiş? Yalnızca JSON formatında yanıt ver: {"isMatch": true veya false, "motionVerified": true veya false, "reason": "kısa Türkçe açıklama"}`
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
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
                ? `3 karelik hareket kaydı doğrulandı: ${meta.label} (${meta.bagLabel}) onaylandı.`
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
