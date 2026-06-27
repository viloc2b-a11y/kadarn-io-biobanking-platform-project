export interface FeeSchedule { biobankFee: number; courierFee: number; platformFeePercent: number; }
export interface SettlementCalc { totalValue: number; biobankPayout: number; courierPayout: number; platformFee: number; }
export interface FinancialAdapter { calculateSettlement(fulfillmentId: string): Promise<SettlementCalc>; }
