import { describe, it, expect } from 'vitest';
import { calculate } from '../packages/financial-engine/src/engine.js';
describe('financial engine', () => {
  it('should calculate settlement', () => {
    const r = calculate(10000, { biobankFee:5000, courierFee:500, platformFeePercent:3 });
    expect(r.biobankPayout).toBe(5000); expect(r.courierPayout).toBe(500); expect(r.platformFee).toBe(300);
  });
  it('should handle zero values', () => {
    const r = calculate(0, { biobankFee:0, courierFee:0, platformFeePercent:0 });
    expect(r.platformFee).toBe(0);
  });
});
