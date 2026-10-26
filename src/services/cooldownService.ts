import type { WasteBinType, ScanRecord, CooldownCheckResult } from '../types';

export const DAILY_STAR_LIMIT = 5;
export const SAME_BIN_DAILY_LIMIT = 2;
export const SAME_BIN_COOLDOWN_SECONDS = 900;
export const CROSS_BIN_COOLDOWN_SECONDS = 120;
export const SAU_CAMPUS_LAT = 40.741;
export const SAU_CAMPUS_LNG = 30.3325;
export const CAMPUS_MAX_DISTANCE_KM = 2.0;

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return r * c;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getTodayScans(history: ScanRecord[]): ScanRecord[] {
  const now = new Date();
  return history.filter((record) => {
    const recordDate = record.createdAtMs ? new Date(record.createdAtMs) : new Date();
    return isSameDay(now, recordDate);
  });
}

export function getTodayStarsCount(history: ScanRecord[]): number {
  const todayScans = getTodayScans(history);
  return todayScans.reduce((total, scan) => total + scan.starsEarned, 0);
}

export function getTodayBinStarsCount(
  binType: WasteBinType,
  history: ScanRecord[]
): number {
  const todayScans = getTodayScans(history);
  return todayScans
    .filter((s) => s.binType === binType)
    .reduce((total, scan) => total + scan.starsEarned, 0);
}

export function getRemainingSameBinCooldown(
  binType: WasteBinType,
  history: ScanRecord[]
): number {
  const now = Date.now();
  const binScans = history.filter((s) => s.binType === binType && s.createdAtMs);
  if (binScans.length === 0) return 0;

  const lastScanMs = Math.max(...binScans.map((s) => s.createdAtMs));
  const diffSeconds = Math.floor((now - lastScanMs) / 1000);
  return Math.max(0, SAME_BIN_COOLDOWN_SECONDS - diffSeconds);
}

export function getRemainingCrossBinCooldown(history: ScanRecord[]): number {
  const now = Date.now();
  const validScans = history.filter((s) => s.createdAtMs);
  if (validScans.length === 0) return 0;

  const lastScanMs = Math.max(...validScans.map((s) => s.createdAtMs));
  const diffSeconds = Math.floor((now - lastScanMs) / 1000);
  return Math.max(0, CROSS_BIN_COOLDOWN_SECONDS - diffSeconds);
}

export function checkScanEligibility(
  binType: WasteBinType,
  history: ScanRecord[],
  geofenceEnabled: boolean,
  userCoords?: { lat: number; lng: number } | null
): CooldownCheckResult {
  if (geofenceEnabled) {
    if (!userCoords) {
      return {
        canScan: false,
        reason: 'Kampüs konum doğrulaması aktif ancak konum bilginize erişilemedi.'
      };
    }
    const dist = calculateDistanceKm(
      userCoords.lat,
      userCoords.lng,
      SAU_CAMPUS_LAT,
      SAU_CAMPUS_LNG
    );
    if (dist > CAMPUS_MAX_DISTANCE_KM) {
      return {
        canScan: false,
        reason: `SAÜ Esentepe Kampüsü dışındasınız (${dist.toFixed(1)} km uzakta). Yıldız kazanımı kampüs içinde geçerlidir.`
      };
    }
  }

  const todayStars = getTodayStarsCount(history);
  if (todayStars >= DAILY_STAR_LIMIT) {
    return {
      canScan: false,
      reason: 'Bugünkü 5 yıldız kotanı doldurdun. Harika bir iş çıkardın, yarın yeni yıldızlar seni bekliyor!'
    };
  }

  const todayBinStars = getTodayBinStarsCount(binType, history);
  if (todayBinStars >= SAME_BIN_DAILY_LIMIT) {
    return {
      canScan: false,
      reason: 'Bu kutu türünden günlük maksimum 2 yıldız kazanabilirsin. Lütfen diğer kutuları değerlendir.'
    };
  }

  const crossRemaining = getRemainingCrossBinCooldown(history);
  if (crossRemaining > 0) {
    return {
      canScan: false,
      remainingSeconds: crossRemaining,
      reason: `Kutular arası geçiş koruması aktif. ${crossRemaining} saniye sonra okutabilirsin.`
    };
  }

  const sameRemaining = getRemainingSameBinCooldown(binType, history);
  if (sameRemaining > 0) {
    const min = Math.ceil(sameRemaining / 60);
    return {
      canScan: false,
      remainingSeconds: sameRemaining,
      reason: `Bu kutu için soğuma süresi aktif. ${min} dakika sonra tekrar okutabilirsin.`
    };
  }

  return { canScan: true };
}
