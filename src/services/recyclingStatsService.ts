import type { ScanRecord, BinCategoryStat } from '../types';

export interface BreakdownResult {
  totalCount: number;
  categories: BinCategoryStat[];
}

export function calculateRecyclingBreakdown(history: ScanRecord[]): BreakdownResult {
  const counts = {
    plastic: 0,
    paper: 0,
    glass: 0,
    battery: 0
  };

  for (const item of history) {
    if (item.binType in counts) {
      counts[item.binType as keyof typeof counts]++;
    }
  }

  const totalCount = counts.plastic + counts.paper + counts.glass + counts.battery;

  const categories: BinCategoryStat[] = [
    {
      binType: 'plastic',
      label: 'Plastik Ambalaj',
      icon: 'plastic',
      count: counts.plastic,
      percent: totalCount > 0 ? Math.round((counts.plastic / totalCount) * 100) : 0,
      color: '#d49413'
    },
    {
      binType: 'paper',
      label: 'Kâğıt ve Karton',
      icon: 'paper',
      count: counts.paper,
      percent: totalCount > 0 ? Math.round((counts.paper / totalCount) * 100) : 0,
      color: '#2b78b8'
    },
    {
      binType: 'glass',
      label: 'Cam Şişe ve Atık',
      icon: 'glass',
      count: counts.glass,
      percent: totalCount > 0 ? Math.round((counts.glass / totalCount) * 100) : 0,
      color: '#23633f'
    },
    {
      binType: 'battery',
      label: 'Atık Pil ve E-Atık',
      icon: 'battery',
      count: counts.battery,
      percent: totalCount > 0 ? Math.round((counts.battery / totalCount) * 100) : 0,
      color: '#b03d31'
    }
  ];

  return {
    totalCount,
    categories
  };
}
