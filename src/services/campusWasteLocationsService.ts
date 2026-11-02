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
    description:
      'Şişe, kapak, kavanoz, içecek ve konserve kutusu, alüminyum kap, ataç, zımba teli, kargo poşeti.',
    color: '#6fb42c',
    bgColor: '#f1f9e8'
  },
  paper: {
    id: 'paper',
    label: 'Kağıt Atıklar',
    bagLabel: 'Mavi Poşet',
    description:
      'Kağıt, gazete, dergi, kitap, broşür, zarf, karton kutu. Bu kutuya ıslak atık atmayınız.',
    color: '#144d8c',
    bgColor: '#eaf1f9'
  },
  domestic: {
    id: 'domestic',
    label: 'Diğer Atıklar',
    bagLabel: 'Koyu Gri Poşet',
    description:
      'Pizza kutusu, kağıt bardak-tabak, ıslak mendil, kağıt peçete, çay-kahve posası, sönmüş izmarit.',
    color: '#58595b',
    bgColor: '#eff0f1'
  },
  battery: {
    id: 'battery',
    label: 'Atık Pil Kutusu',
    bagLabel: 'Bina Girişi',
    description:
      '3 bölmeli kutulara pil atılması yasaktır; her binanın girişindeki atık pil kutusuna bırakılır.',
    color: '#c9382b',
    bgColor: '#fceae8'
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

