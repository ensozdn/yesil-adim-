import type { WalletState, AchievementBadge } from '../types';

export function calculateBadges(wallet: WalletState): AchievementBadge[] {
  const distinctBins = new Set(wallet.history.map((s) => s.binType));
  const hasBattery = wallet.history.some((s) => s.binType === 'battery');

  return [
    {
      id: 'first-scan',
      title: 'İlk Adım',
      desc: 'Kampüsteki ilk geri dönüşüm QR kodunu okut.',
      icon: 'spark',
      isUnlocked: wallet.lifetimeStars >= 1,
      progressText: wallet.lifetimeStars >= 1 ? 'Kazanıldı' : '1 Yıldız Gerekli'
    },
    {
      id: 'battery-guard',
      title: 'Pil Muhafızı',
      desc: 'Toprağı korumak için en az 1 atık pil kutusu okut.',
      icon: 'battery',
      isUnlocked: hasBattery,
      progressText: hasBattery ? 'Kazanıldı' : 'Pil Noktası Okut'
    },
    {
      id: 'streak-master',
      title: 'Yeşil Seri',
      desc: 'Kampüste üst üste 2 gün veya daha uzun seri yakala.',
      icon: 'leaf',
      isUnlocked: wallet.streak >= 2,
      progressText: wallet.streak >= 2 ? `${wallet.streak} Günlük Seri` : '2 Günlük Seri Gerekli'
    },
    {
      id: 'diversity-master',
      title: 'Çeşitlilik Ustası',
      desc: 'En az 3 farklı türde atık kutusunu ayrıştır.',
      icon: 'recycle',
      isUnlocked: distinctBins.size >= 3,
      progressText: distinctBins.size >= 3 ? 'Kazanıldı' : `${distinctBins.size}/3 Kutu Kullanıldı`
    },
    {
      id: 'zero-waste',
      title: 'Sıfır Atık Elçisi',
      desc: 'Kampüste toplam 10 veya daha fazla yıldız topla.',
      icon: 'trophy',
      isUnlocked: wallet.lifetimeStars >= 10,
      progressText: wallet.lifetimeStars >= 10 ? 'Kazanıldı' : `${wallet.lifetimeStars}/10 Yıldız`
    }
  ];
}
