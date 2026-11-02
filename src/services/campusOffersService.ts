import type { CampusOffer } from '../types';

export const CAMPUS_OFFERS: CampusOffer[] = [
  {
    id: 'adabahce-chicken-chips',
    partner: 'Adabahçe',
    badge: '%10 İNDİRİM',
    title: 'Chicken Chips Menü',
    desc: 'Adabahçe şubelerinde Chicken Chips menüde öğrenci indirimi.',
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
    desc: 'SAÜ Kafe şubelerinde filtre kahve ve latte çeşitlerinde indirim.',
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
    desc: 'SAÜ yemekhanesinde günlük tabldot menüde indirim.',
    stars: 8,
    icon: 'food',
    gradientFrom: '#1f6a43',
    gradientTo: '#3d8655'
  },
  {
    id: 'campus-stationery',
    partner: 'Kampüs Kırtasiye',
    badge: '%15 İNDİRİM',
    title: 'Defter ve Kalem Seti',
    desc: 'Kampüs kırtasiyesinde defter, kalem ve ofis ürünlerinde indirim.',
    stars: 6,
    icon: 'book',
    gradientFrom: '#2b6cb0',
    gradientTo: '#4a90d2'
  },
  {
    id: 'campus-canteen-tea',
    partner: 'Kampüs Kantin',
    badge: 'İKRAM',
    title: 'Çay + Simit Menüsü',
    desc: 'Kantinlerde bir çay ve simit ikramı kazan.',
    stars: 3,
    icon: 'tag',
    gradientFrom: '#a3701b',
    gradientTo: '#d4a03c'
  }
];
