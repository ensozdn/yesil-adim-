import type {
  CampusWasteStation,
  WasteStreamMeta,
  WasteStreamType
} from '../types';

export const SAU_CAMPUS_CENTER: [number, number] = [40.7422, 30.3316];

export const WASTE_STREAM_META: Record<WasteStreamType, WasteStreamMeta> = {
  packaging: {
    id: 'packaging',
    label: 'Plastik · Cam · Metal',
    bagLabel: 'Sarı Poşet',
    description: 'Pet şişe, cam içecek şişesi, metal kutu ve temiz plastik ambalajlar.',
    color: '#c98a09',
    bgColor: '#fef6dc'
  },
  paper: {
    id: 'paper',
    label: 'Kâğıt ve Karton',
    bagLabel: 'Mavi Poşet',
    description: 'Defter, ders notları, kitap, gazete ve temiz karton kutular.',
    color: '#1e6bb8',
    bgColor: '#e8f2fc'
  },
  battery: {
    id: 'battery',
    label: 'Atık Pil Kutusu',
    bagLabel: 'Bina Girişi',
    description: 'Bina girişlerinde yer alan kırmızı atık pil toplama kutusu.',
    color: '#b9382c',
    bgColor: '#fceae8'
  },
  domestic: {
    id: 'domestic',
    label: 'Diğer · Evsel Atık',
    bagLabel: 'Koyu Gri Poşet',
    description: 'Geri kazanılamayan yağlı ambalaj, peçete ve evsel nitelikli atıklar.',
    color: '#4a5550',
    bgColor: '#ecefed'
  }
};

export const CAMPUS_WASTE_STATIONS: CampusWasteStation[] = [
  {
    id: 'library-main',
    title: 'Süleyman Demirel Kütüphanesi',
    zone: 'Merkez Kampüs',
    lat: 40.74166,
    lng: 30.33208,
    streams: ['packaging', 'paper', 'domestic', 'battery'],
    unitCount: 18,
    locationDetail: 'Ana giriş turnikeleri yanı ve okuma salonu kat koridorları.'
  },
  {
    id: 'student-cafeteria',
    title: 'Öğrenci Yemekhanesi ve Kafeterya',
    zone: 'Sosyal Alan',
    lat: 40.74427,
    lng: 30.33041,
    streams: ['packaging', 'paper', 'domestic', 'battery'],
    unitCount: 24,
    locationDetail: 'Yemekhane giriş holü, tepsi teslim koridoru ve alt kantin çıkışı.'
  },
  {
    id: 'rectorate',
    title: 'SAÜ Rektörlük Binası',
    zone: 'İdari Merkez',
    lat: 40.74094,
    lng: 30.3329,
    streams: ['packaging', 'paper', 'domestic', 'battery'],
    unitCount: 14,
    locationDetail: 'Ana protokol girişi danışma yanı ve kat merdiven sahanlıkları.'
  },
  {
    id: 'eng-deanery',
    title: 'Mühendislik Fakültesi M2 · M4 · M6',
    zone: 'Mühendislik Kampüsü',
    lat: 40.74218,
    lng: 30.33132,
    streams: ['packaging', 'paper', 'domestic', 'battery'],
    unitCount: 32,
    locationDetail: 'Dekanlık girişi, M2-M4-M6 blok giriş kapıları ve derslik koridorları.'
  },
  {
    id: 'eng-m7',
    title: 'Mühendislik M7 ve İnşaat Bölümü',
    zone: 'Batı Kampüs',
    lat: 40.7419,
    lng: 30.32713,
    streams: ['packaging', 'paper', 'domestic', 'battery'],
    unitCount: 22,
    locationDetail: 'M7 Makine Mühendisliği ana kapısı, laboratuvar koridoru ve kantin önü.'
  },
  {
    id: 'cs-faculty',
    title: 'Bilgisayar ve Bilişim Bilimleri Fakültesi',
    zone: 'Batı Kampüs',
    lat: 40.74228,
    lng: 30.32571,
    streams: ['packaging', 'paper', 'domestic', 'battery'],
    unitCount: 16,
    locationDetail: 'Fakülte ana giriş lobisi, bilgisayar laboratuvarları katı ve amfi girişi.'
  },
  {
    id: 'culture-congress',
    title: 'Kültür ve Kongre Merkezi',
    zone: 'Merkez Meydan',
    lat: 40.74124,
    lng: 30.32933,
    streams: ['packaging', 'paper', 'domestic', 'battery'],
    unitCount: 15,
    locationDetail: 'Ana fuaye alanı, salon girişleri ve bina ana giriş kapısı.'
  },
  {
    id: 'tas-kafe',
    title: 'Taş Kafe ve Genç Ofis Meydanı',
    zone: 'Sosyal Alan',
    lat: 40.7427,
    lng: 30.33318,
    streams: ['packaging', 'paper', 'domestic', 'battery'],
    unitCount: 12,
    locationDetail: 'Genç Ofis bina girişi ve Taş Kafe açık oturma alanı çevresi.'
  },
  {
    id: 'humanities-faculty',
    title: 'İnsan ve Toplum Bilimleri Fakültesi',
    zone: 'Doğu Kampüs',
    lat: 40.74375,
    lng: 30.33626,
    streams: ['packaging', 'paper', 'domestic', 'battery'],
    unitCount: 26,
    locationDetail: 'Fakülte A ve B blok giriş kapıları ile bölüm sekreterlik koridorları.'
  },
  {
    id: 'science-letters',
    title: 'Fen-Edebiyat Fakültesi',
    zone: 'Kuzey Kampüs',
    lat: 40.74469,
    lng: 30.32876,
    streams: ['packaging', 'paper', 'domestic', 'battery'],
    unitCount: 24,
    locationDetail: 'Bina ana girişi, kantin çevresi ve amfi koridorları.'
  },
  {
    id: 'law-faculty',
    title: 'Hukuk Fakültesi',
    zone: 'Doğu Kampüs',
    lat: 40.74089,
    lng: 30.33667,
    streams: ['packaging', 'paper', 'domestic', 'battery'],
    unitCount: 16,
    locationDetail: 'Fakülte ana girişi, duruşma salonu katı ve okuma alanı önü.'
  },
  {
    id: 'art-design',
    title: 'Sanat, Tasarım ve Mimarlık Fakültesi',
    zone: 'Güney Kampüs',
    lat: 40.73979,
    lng: 30.33557,
    streams: ['packaging', 'paper', 'domestic', 'battery'],
    unitCount: 14,
    locationDetail: 'Atölye girişleri, sergi holü ve bina ana giriş kapısı.'
  }
];
