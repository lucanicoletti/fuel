import type { DayName, DayPlan } from './types';
import { SAT_OUT_ESTIMATE, CHOC_ADD } from './generator';

export interface MacroTotals { kcal: number; p: number; c: number; f: number }

export function dayKcal(day: DayPlan, hasChoc: boolean): number {
  const isSat = day.day === 'SAT';
  let k = (day.breakfast.snapshot?.kcal ?? 0) + (day.snack.snapshot?.kcal ?? 0);
  if (hasChoc) k += CHOC_ADD.kcal;
  if (isSat) {
    k += SAT_OUT_ESTIMATE.kcal;
  } else {
    k += day.lunch?.snapshot?.kcal ?? 0;
    k += day.dinner?.snapshot?.kcal ?? 0;
  }
  return k;
}

export function weekAverages(plan: DayPlan[], chocState: Partial<Record<DayName, boolean>>): MacroTotals {
  let tk = 0, tp = 0, tc = 0, tf = 0, days = 0;
  plan.forEach(day => {
    const isSat = day.day === 'SAT';
    const hasChoc = chocState[day.day] ?? false;
    const b = day.breakfast.snapshot; const s = day.snack.snapshot;
    let k = (b?.kcal ?? 0) + (s?.kcal ?? 0) + (hasChoc ? CHOC_ADD.kcal : 0);
    let p = (b?.protein_g ?? 0) + (s?.protein_g ?? 0);
    let c = (b?.carbs_g ?? 0) + (s?.carbs_g ?? 0) + (hasChoc ? CHOC_ADD.c : 0);
    let f = (b?.fat_g ?? 0) + (s?.fat_g ?? 0) + (hasChoc ? CHOC_ADD.f : 0);
    if (isSat) {
      k += SAT_OUT_ESTIMATE.kcal; p += SAT_OUT_ESTIMATE.p; c += SAT_OUT_ESTIMATE.c; f += SAT_OUT_ESTIMATE.f;
    } else {
      const l = day.lunch?.snapshot; const d = day.dinner?.snapshot;
      if (l) { k += l.kcal; p += l.protein_g; c += l.carbs_g; f += l.fat_g; }
      if (d) { k += d.kcal; p += d.protein_g; c += d.carbs_g; f += d.fat_g; }
    }
    tk += k; tp += p; tc += c; tf += f; days++;
  });
  return { kcal: Math.round(tk / days), p: Math.round(tp / days), c: Math.round(tc / days), f: Math.round(tf / days) };
}
