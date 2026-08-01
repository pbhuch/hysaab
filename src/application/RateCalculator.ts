import { RateChange } from '../domain/types';

export const getSuggestedRate = (
  vendorId: string,
  dateStr: string,
  baseRate: number,
  rateChanges: RateChange[]
): number => {
  const matching = rateChanges.filter(rc => rc.vendor_id === vendorId && rc.effective_from <= dateStr);
  if (matching.length === 0) return baseRate;
  // Sort descending by effective_from
  matching.sort((a, b) => b.effective_from.localeCompare(a.effective_from));
  return matching[0].rate_per_ltr;
};
