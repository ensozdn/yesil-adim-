import type { CampusOffer } from '../types';

export const CAMPUS_OFFERS: CampusOffer[] = [
  {
    id: 'adabahce-chicken-chips',
    partner: 'Adabahçe',
    badge: '%10 İNDİRİM',
    title: 'Chicken Chips Menü',
    desc: 'Öğrenci indirimi',
    stars: 5,
    icon: 'food',
    gradientFrom: '#c7672e',
    gradientTo: '#e48b3f'
  },
  {
    id: 'sau-cafe-coffee',
    partner: 'SAÜ Kafe',
    badge: '%20 İNDİRİM',
    title: 'Kahve İndirimi',
    desc: 'Filtre kahve ve latte',
    stars: 4,
    icon: 'coffee',
    gradientFrom: '#5e4030',
    gradientTo: '#8a5a3c'
  },
  {
    id: 'sau-refectory-meal',
    partner: 'SAÜ Yemekhane',
    badge: '15 TL İNDİRİM',
    title: 'Tabldot Menü',
    desc: 'Günlük öğle yemeği',
    stars: 8,
    icon: 'food',
    gradientFrom: '#1f6a43',
    gradientTo: '#3d8655'
  },
  {
    id: 'campus-stationery',
    partner: 'Kampüs Kırtasiye',
    badge: '%15 İNDİRİM',
    title: 'Defter & Kalem',
    desc: 'Tüm kırtasiye ürünleri',
    stars: 6,
    icon: 'book',
    gradientFrom: '#2b6cb0',
    gradientTo: '#4a90d2'
  },
  {
    id: 'campus-canteen-tea',
    partner: 'Kampüs Kantin',
    badge: 'İKRAM',
    title: 'Çay + Simit',
    desc: 'Kampüs kantinlerinde geçerli',
    stars: 3,
    icon: 'tag',
    gradientFrom: '#a3701b',
    gradientTo: '#d4a03c'
  }
];
