import { getSuggestedRate } from '../application/RateCalculator';
import { RateChange } from '../domain/types';

describe('Milk Ledger Rate suggestion and calculation tests', () => {
  const baseRate = 60;
  const rateChanges: RateChange[] = [
    {
      id: 'rc_1',
      vendor_id: 'v_1',
      effective_from: '2026-07-15',
      rate_per_ltr: 65,
    },
    {
      id: 'rc_2',
      vendor_id: 'v_1',
      effective_from: '2026-07-25',
      rate_per_ltr: 68,
    }
  ];

  test('Should return base rate before any effective date', () => {
    const suggested = getSuggestedRate('v_1', '2026-07-01', baseRate, rateChanges);
    expect(suggested).toBe(60);
  });

  test('Should return correct rate on first effective rate change date', () => {
    const suggested = getSuggestedRate('v_1', '2026-07-15', baseRate, rateChanges);
    expect(suggested).toBe(65);
  });

  test('Should return correct rate between first and second rate change date', () => {
    const suggested = getSuggestedRate('v_1', '2026-07-20', baseRate, rateChanges);
    expect(suggested).toBe(65);
  });

  test('Should return second rate change rate on or after its effective date', () => {
    const suggested = getSuggestedRate('v_1', '2026-07-25', baseRate, rateChanges);
    expect(suggested).toBe(68);
  });
});
