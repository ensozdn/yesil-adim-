import type { WasteSampleItem } from '../types';

export const SAMPLE_WASTE_ITEMS: WasteSampleItem[] = [
  {
    id: 'pizza-box',
    title: 'Yağlı Pizza Kutusu',
    subtitle: 'Gıda kalıntılı ambalaj',
    category: 'general',
    prompt: 'Yağlı bir pizza kutusu atacağım, hangi kutuya atmalıyım?',
    accentColor: '#d96b43',
    badgeText: 'Kritik Ayrım',
    imageDataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"><rect width="160" height="120" rx="14" fill="%23fdf3eb"/><path d="M25 55 L80 25 L135 55 L80 85 Z" fill="%23e8a87c" stroke="%23c47d4e" stroke-width="2.5"/><path d="M25 55 L80 85 L80 102 L25 72 Z" fill="%23d4895c"/><path d="M135 55 L80 85 L80 102 L135 72 Z" fill="%23b87042"/><path d="M60 46 L95 65 L70 78 Z" fill="%23e25d33"/><circle cx="75" cy="62" r="3" fill="%23ffd166"/><circle cx="85" cy="68" r="2.5" fill="%23ffd166"/><circle cx="68" cy="54" r="2.5" fill="%23ffd166"/></svg>'
  },
  {
    id: 'coffee-cup',
    title: 'Karton Kahve Bardağı',
    subtitle: 'Plastik kapak + içi kaplamalı bardak',
    category: 'plastic',
    prompt: 'Karton kahve bardağı hangi kutuya atılır?',
    accentColor: '#c97a3e',
    badgeText: 'Çift Malzeme',
    imageDataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"><rect width="160" height="120" rx="14" fill="%23fbf5ee"/><ellipse cx="80" cy="30" rx="26" ry="7" fill="%232b2b2b"/><rect x="54" y="27" width="52" height="7" rx="2" fill="%233a3a3a"/><path d="M57 34 L64 96 C65 99 68 101 71 101 L89 101 C92 101 95 99 96 96 L103 34 Z" fill="%23ede4d8" stroke="%23d1c4b2" stroke-width="2"/><path d="M60 55 L62 76 L98 76 L100 55 Z" fill="%23a6704b"/><circle cx="80" cy="65.5" r="7" fill="%23ffffff"/><path d="M78 62 L82 65.5 L78 69" stroke="%2323633f" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>'
  },
  {
    id: 'battery',
    title: 'Bitmiş Kalem Pil',
    subtitle: 'Ağır metal içeren kimyasal atık',
    category: 'battery',
    prompt: 'Bitmiş kalem pil nereye bırakılır?',
    accentColor: '#c53030',
    badgeText: 'Tehlikeli E-Atık',
    imageDataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"><rect width="160" height="120" rx="14" fill="%23fdeeed"/><rect x="73" y="20" width="14" height="6" rx="2" fill="%238a8a8a"/><rect x="58" y="26" width="44" height="78" rx="8" fill="%232b2d42" stroke="%231a1b28" stroke-width="2"/><rect x="58" y="26" width="44" height="24" rx="6" fill="%23d90429"/><text x="76" y="42" fill="%23ffffff" font-size="14" font-family="sans-serif" font-weight="bold">+</text><path d="M82 62 L76 73 L83 73 L78 86" stroke="%23ffd166" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  {
    id: 'pet-bottle',
    title: 'Plastik Su Şişesi',
    subtitle: 'Ezilmiş ve kapağı takılı PET şişe',
    category: 'plastic',
    prompt: 'Plastik su şişesini nasıl geri dönüştürmeliyim?',
    accentColor: '#2b78b8',
    badgeText: 'Hacim Küçültme',
    imageDataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120"><rect width="160" height="120" rx="14" fill="%23edf4fb"/><rect x="74" y="16" width="12" height="8" rx="2" fill="%231976d2"/><rect x="72" y="24" width="16" height="6" fill="%2390caf9"/><path d="M72 30 C64 36 60 46 60 56 L60 92 C60 97 64 101 69 101 L91 101 C96 101 100 97 100 92 L100 56 C100 46 96 36 88 30 Z" fill="%23e3f2fd" stroke="%2390caf9" stroke-width="2"/><rect x="60" y="58" width="40" height="20" fill="%23bbdefb"/><path d="M73 68 C77 65 83 65 87 68" stroke="%231565c0" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>'
  }
];
