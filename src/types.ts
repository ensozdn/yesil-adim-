export type IconName =
  | 'leaf'
  | 'star'
  | 'qr'
  | 'chat'
  | 'user'
  | 'home'
  | 'camera'
  | 'send'
  | 'check'
  | 'spark'
  | 'recycle'
  | 'paper'
  | 'plastic'
  | 'glass'
  | 'battery'
  | 'coffee'
  | 'logout'
  | 'plus'
  | 'close'
  | 'water'
  | 'cloud'
  | 'timer';

export interface RewardTier {
  id: string;
  stars: number;
  title: string;
  desc: string;
}

export type NavigationTab = 'home' | 'assistant' | 'profile';

export type WasteBinType = 'paper' | 'plastic' | 'glass' | 'battery' | 'general';

export interface ScanRecord {
  id: string;
  binType: WasteBinType;
  label: string;
  timestamp: string;
  starsEarned: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  recommendedBin?: string;
  timestamp: string;
}

export interface StudentProfile {
  studentId: string;
  fullName: string;
  department: string;
  isLoggedIn: boolean;
}

export interface EcoImpactData {
  co2PreventedKg: string;
  waterSavedLiters: string;
  treesConserved: string;
  campusMonthlyTotal: number;
}

export interface WalletState {
  stars: number;
  lifetimeStars: number;
  streak: number;
  lastScanDate: string | null;
  history: ScanRecord[];
  redeemedRewards: string[];
  profile: StudentProfile;
  apiKey: string;
}
