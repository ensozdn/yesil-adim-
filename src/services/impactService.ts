import type { EcoImpactData, ScanRecord } from '../types';

export function calculateEcoImpact(lifetimeStars: number, history: ScanRecord[]): EcoImpactData {
  const baseStars = Math.max(0, lifetimeStars);

  let paperCount = 0;
  let plasticCount = 0;
  let glassCount = 0;
  let batteryCount = 0;

  for (const item of history) {
    if (item.binType === 'paper') paperCount++;
    else if (item.binType === 'plastic') plasticCount++;
    else if (item.binType === 'glass') glassCount++;
    else if (item.binType === 'battery') batteryCount++;
  }

  const unrecordedStars = Math.max(0, baseStars - (paperCount + plasticCount + glassCount + batteryCount));
  plasticCount += Math.floor(unrecordedStars * 0.4);
  paperCount += Math.floor(unrecordedStars * 0.3);
  glassCount += Math.floor(unrecordedStars * 0.2);
  batteryCount += Math.ceil(unrecordedStars * 0.1);

  const co2Kg = (plasticCount * 0.12) + (paperCount * 0.08) + (glassCount * 0.15) + (batteryCount * 0.45);
  const waterLiters = (plasticCount * 2.1) + (paperCount * 3.4) + (glassCount * 0.9);
  const trees = paperCount * 0.0035;

  const campusBaseCount = 1420;
  const campusMonthlyTotal = campusBaseCount + (baseStars * 3);

  return {
    co2PreventedKg: co2Kg.toFixed(2),
    waterSavedLiters: waterLiters.toFixed(1),
    treesConserved: trees.toFixed(3),
    campusMonthlyTotal
  };
}
