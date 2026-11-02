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
  | 'arrow-right';

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

export type NavigationTab = 'home' | 'assistant' | 'profile';

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

export interface WalletState {
  stars: number;
  lifetimeStars: number;
  streak: number;
  redeemedRewards: string[];
  profile: StudentProfile;
  apiKey: string;
}
