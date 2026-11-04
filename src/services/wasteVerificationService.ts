import type {
  CampusWasteStation,
  VerificationRecord,
  WalletState,
  WasteStreamType
} from '../types';
import { CAMPUS_WASTE_STATIONS } from './campusWasteLocationsService';

export const GEOFENCE_RADIUS_METERS = 85;
export const DAILY_MAX_VERIFICATIONS = 2;
export const COOLDOWN_HOURS = 2;
export const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

const SIMULATION_STORAGE_KEY = 'green-step-simulation-mode-v1';

export interface NearestStationCheck {
  station: CampusWasteStation;
  distanceMeters: number;
  isWithinGeofence: boolean;
}

export interface VerificationEligibility {
  eligible: boolean;
  reason?: 'daily_limit' | 'cooldown' | 'location';
  remainingDailyCount: number;
  cooldownRemainingMinutes: number;
}

export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

export const getSimulationMode = (): boolean => {
  try {
    const val = localStorage.getItem(SIMULATION_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
};

export const setSimulationMode = (active: boolean): void => {
  try {
    localStorage.setItem(SIMULATION_STORAGE_KEY, active ? 'true' : 'false');
  } catch {}
};

export const findNearestStation = (
  userLat: number,
  userLng: number
): NearestStationCheck => {
  let nearest = CAMPUS_WASTE_STATIONS[0];
  let minDistance = Infinity;

  for (const station of CAMPUS_WASTE_STATIONS) {
    const dist = calculateDistanceMeters(userLat, userLng, station.lat, station.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  }

  return {
    station: nearest,
    distanceMeters: minDistance,
    isWithinGeofence: minDistance <= GEOFENCE_RADIUS_METERS
  };
};

export const getTodayDateKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const checkVerificationEligibility = (
  wallet: WalletState,
  isAtLocation: boolean
): VerificationEligibility => {
  const today = getTodayDateKey();
  const dailyCount =
    wallet.lastVerificationDate === today ? (wallet.dailyVerificationsCount || 0) : 0;
  const remainingDaily = Math.max(0, DAILY_MAX_VERIFICATIONS - dailyCount);

  if (remainingDaily <= 0) {
    return {
      eligible: false,
      reason: 'daily_limit',
      remainingDailyCount: 0,
      cooldownRemainingMinutes: 0
    };
  }

  if (wallet.lastVerificationTimestamp) {
    const elapsed = Date.now() - wallet.lastVerificationTimestamp;
    if (elapsed < COOLDOWN_MS) {
      const remainingMinutes = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
      return {
        eligible: false,
        reason: 'cooldown',
        remainingDailyCount: remainingDaily,
        cooldownRemainingMinutes: remainingMinutes
      };
    }
  }

  if (!isAtLocation) {
    return {
      eligible: false,
      reason: 'location',
      remainingDailyCount: remainingDaily,
      cooldownRemainingMinutes: 0
    };
  }

  return {
    eligible: true,
    remainingDailyCount: remainingDaily,
    cooldownRemainingMinutes: 0
  };
};

export const recordDisposalVerification = (
  wallet: WalletState,
  station: CampusWasteStation,
  stream: WasteStreamType,
  proofImageUrl?: string
): { nextWallet: WalletState; earnedStars: number } => {
  const today = getTodayDateKey();
  const currentDailyCount =
    wallet.lastVerificationDate === today ? (wallet.dailyVerificationsCount || 0) : 0;

  const newRecord: VerificationRecord = {
    stationId: station.id,
    stationTitle: station.title,
    stream,
    timestamp: Date.now(),
    proofImageUrl
  };

  const updatedRecords = [newRecord, ...(wallet.recentVerifications || [])].slice(0, 10);

  const nextWallet: WalletState = {
    ...wallet,
    stars: wallet.stars + 1,
    lifetimeStars: wallet.lifetimeStars + 1,
    dailyVerificationsCount: currentDailyCount + 1,
    lastVerificationDate: today,
    lastVerificationTimestamp: Date.now(),
    recentVerifications: updatedRecords
  };

  return { nextWallet, earnedStars: 1 };
};
