import type { SettlementCalc, FeeSchedule } from './types';
export function calculate(totalValue: number, schedule: FeeSchedule): SettlementCalc {
  const platformFee = totalValue * (schedule.platformFeePercent / 100);
  const biobankPayout = schedule.biobankFee;
  const courierPayout = schedule.courierFee;
  return { totalValue, biobankPayout, courierPayout, platformFee };
}
