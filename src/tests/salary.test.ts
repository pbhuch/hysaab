import { calculateSalaryForMonth } from '../application/SalaryCalculator';
import { Maid, MaidAttendance } from '../domain/types';

describe('Maid Salary Pro-rating Calculations', () => {
  const baseMaid: Maid = {
    id: 'm_test_1',
    name: 'Test Cook',
    role: 'cook',
    phone: '9999999999',
    monthly_rate: 30000,
    payment_cycle_start: 1,
    active: true,
    joined_date: '2026-06-01',
  };

  test('Calculate full month salary with no leaves (30-day month: June 2026)', () => {
    const attendance: MaidAttendance[] = [];
    // June is month 5 (0-indexed)
    const breakdown = calculateSalaryForMonth(baseMaid, attendance, 2026, 5);
    expect(breakdown.baseSalary).toBe(30000);
    expect(breakdown.deductions).toBe(0);
    expect(breakdown.finalSalary).toBe(30000);
    expect(breakdown.activeDaysInMonth).toBe(30);
  });

  test('Calculate salary with unpaid leaves (June 2026, 2 unpaid leaves)', () => {
    const attendance: MaidAttendance[] = [
      { id: '1', maid_id: 'm_test_1', date: '2026-06-05', status: 'absent_unpaid' },
      { id: '2', maid_id: 'm_test_1', date: '2026-06-10', status: 'absent_unpaid' },
    ];
    const breakdown = calculateSalaryForMonth(baseMaid, attendance, 2026, 5);
    // Unpaid leave deduction = (30000 / 30) * 2 = 2000
    expect(breakdown.unpaidLeaves).toBe(2);
    expect(breakdown.deductions).toBe(2000);
    expect(breakdown.finalSalary).toBe(28000);
  });

  test('Calculate salary with half-day leaves (June 2026, 1 half-day counts as 0.5 leaves)', () => {
    const attendance: MaidAttendance[] = [
      { id: '1', maid_id: 'm_test_1', date: '2026-06-05', status: 'half_day' },
    ];
    const breakdown = calculateSalaryForMonth(baseMaid, attendance, 2026, 5);
    // Unpaid leave deduction = (30000 / 30) * 0.5 = 500
    expect(breakdown.unpaidLeaves).toBe(0.5);
    expect(breakdown.deductions).toBe(500);
    expect(breakdown.finalSalary).toBe(29500);
  });

  test('Calculate salary for mid-month joiner (June 2026, joined on June 16)', () => {
    const midJoinMaid: Maid = {
      ...baseMaid,
      joined_date: '2026-06-16',
    };
    const attendance: MaidAttendance[] = [];
    const breakdown = calculateSalaryForMonth(midJoinMaid, attendance, 2026, 5);
    // June has 30 days. Active days = June 16 to June 30 = 15 days.
    // Base salary pro-rated = 30000 * (15 / 30) = 15000
    expect(breakdown.activeDaysInMonth).toBe(15);
    expect(breakdown.baseSalary).toBe(15000);
    expect(breakdown.finalSalary).toBe(15000);
  });
});
