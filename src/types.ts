export type IconName =
  | 'leaf'
  | 'star'
  | 'chat'
  | 'user'
  | 'home'
  | 'camera'
  | 'send'
  | 'check'
  | 'spark'
  | 'recycle'
  | 'coffee'
  | 'food'
  | 'tag'
  | 'book'
  | 'logout'
  | 'close'
  | 'timer'
  | 'eye'
  | 'eye-off'
  | 'arrow-right'
  | 'map-pin'
  | 'locate'
  | 'battery'
  | 'shield-check'
  | 'navigation';

export interface RewardTier {
  id: string;
  stars: number;
  title: string;
  desc: string;
}

export interface CampusOffer extends RewardTier {
  partner: string;
  badge: string;
  icon: IconName;
  gradientFrom: string;
  gradientTo: string;
}

export type NavigationTab = 'home' | 'map' | 'assistant' | 'profile';

export type WasteStreamType = 'packaging' | 'paper' | 'domestic' | 'battery';

export type WasteFilterType = 'all' | WasteStreamType;

export interface WasteStreamMeta {
  id: WasteStreamType;
  label: string;
  bagLabel: string;
  description: string;
  color: string;
  bgColor: string;
}

export interface CampusWasteStation {
  id: string;
  title: string;
  zone: string;
  lat: number;
  lng: number;
  streams: WasteStreamType[];
  unitCount: number;
  locationDetail: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  recommendedBin?: string;
  timestamp: string;
}

export interface VerificationRecord {
  stationId: string;
  stationTitle: string;
  stream: WasteStreamType;
  timestamp: number;
  proofImageUrl?: string;
}

export interface StudentProfile {
  studentId: string;
  fullName: string;
  department: string;
  isLoggedIn: boolean;
}

export interface WalletState {
  stars: number;
  lifetimeStars: number;
  streak: number;
  redeemedRewards: string[];
  profile: StudentProfile;
  apiKey: string;
  dailyVerificationsCount?: number;
  lastVerificationDate?: string;
  lastVerificationTimestamp?: number;
  recentVerifications?: VerificationRecord[];
}
