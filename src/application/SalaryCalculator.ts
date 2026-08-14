import { Maid, MaidAttendance, Payment, Advance } from '../domain/types';

export interface SalaryBreakdown {
  baseSalary: number;
  unpaidLeaves: number;
  paidLeaves: number;
  presentDays: number;
  halfDays: number;
  deductions: number;
  finalSalary: number;
  activeDaysInMonth: number;
  totalDaysInMonth: number;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function calculateSalaryForMonth(
  maid: Maid,
  attendance: MaidAttendance[],
  year: number,
  month: number
): SalaryBreakdown {
  const totalDaysInMonth = getDaysInMonth(year, month);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, totalDaysInMonth);

  // Compute active days in this month
  const joinDate = new Date(maid.joined_date);
  const exitDate = maid.exit_date ? new Date(maid.exit_date) : null;

  let activeDaysInMonth = 0;
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const currentDate = new Date(year, month, d);
    
    // Normalize dates to midnight for comparison
    currentDate.setHours(0,0,0,0);
    const normalizedJoin = new Date(joinDate);
    normalizedJoin.setHours(0,0,0,0);
    
    let isAfterJoin = currentDate >= normalizedJoin;
    let isBeforeExit = true;
    if (exitDate) {
      const normalizedExit = new Date(exitDate);
      normalizedExit.setHours(0,0,0,0);
      isBeforeExit = currentDate <= normalizedExit;
    }

    if (isAfterJoin && isBeforeExit) {
      activeDaysInMonth++;
    }
  }

  // If activeDaysInMonth is 0, salary is 0
  if (activeDaysInMonth === 0 || !maid.active) {
    return {
      baseSalary: 0,
      unpaidLeaves: 0,
      paidLeaves: 0,
      presentDays: 0,
      halfDays: 0,
      deductions: 0,
      finalSalary: 0,
      activeDaysInMonth: 0,
      totalDaysInMonth,
    };
  }

  // Calculate base salary pro-rated by active days in month
  const baseSalary = Math.round((maid.monthly_rate * activeDaysInMonth) / totalDaysInMonth);

  // Filter attendance for the active period in this month
  // Attendance is logged as YYYY-MM-DD
  const attendanceMap = new Map<string, string>();
  attendance.forEach(att => {
    attendanceMap.set(att.date, att.status);
  });

  let presentDays = 0;
  let paidLeaves = 0;
  let unpaidLeaves = 0;
  let halfDays = 0;

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const currentDate = new Date(year, month, d);
    currentDate.setHours(0,0,0,0);

    const normalizedJoin = new Date(joinDate);
    normalizedJoin.setHours(0,0,0,0);
    const normalizedExit = exitDate ? new Date(exitDate) : null;
    if (normalizedExit) normalizedExit.setHours(0,0,0,0);

    const isActive = currentDate >= normalizedJoin && (!normalizedExit || currentDate <= normalizedExit);

    if (isActive) {
      const status = attendanceMap.get(dayStr);
      if (status === 'present') {
        presentDays++;
      } else if (status === 'absent_paid') {
        paidLeaves++;
      } else if (status === 'absent_unpaid') {
        unpaidLeaves++;
      } else if (status === 'half_day') {
        halfDays++;
        // Half-day counts as 0.5 present and 0.5 unpaid leave
        presentDays += 0.5;
        unpaidLeaves += 0.5;
      } else {
        // Default: If not logged, assume present (so users don't have to log every single day)
        presentDays++;
      }
    }
  }

  // Deductions are based on base daily rate: (monthly_rate / totalDaysInMonth) * unpaidLeaves
  const dailyRate = maid.monthly_rate / totalDaysInMonth;
  const deductions = Math.round(dailyRate * unpaidLeaves);

  const finalSalary = Math.max(0, baseSalary - deductions);

  return {
    baseSalary,
    unpaidLeaves,
    paidLeaves,
    presentDays,
    halfDays,
    deductions,
    finalSalary,
    activeDaysInMonth,
    totalDaysInMonth,
  };
}

export interface MaidMonthlyStatement {
  year: number;
  month: number; // 0-indexed
  monthKey: string; // YYYY-MM
  earnings: number;
  advancesGiven: number;
  carriedOverAdvance: number;
  advanceDeduction: number;
  netPayable: number;
  remainingAdvance: number;
  paymentsMade: number;
  dueAmount: number;
}

export function getMonthsRange(startYearMonth: string, endYearMonth: string): { year: number; month: number; key: string }[] {
  const result: { year: number; month: number; key: string }[] = [];
  const [startYear, startMonth] = startYearMonth.split('-').map(Number);
  const [endYear, endMonth] = endYearMonth.split('-').map(Number);
  
  let currYear = startYear;
  let currMonth = startMonth - 1; // 0-indexed for JS Date
  
  const endDate = new Date(endYear, endMonth - 1, 1);
  
  while (new Date(currYear, currMonth, 1) <= endDate) {
    const key = `${currYear}-${String(currMonth + 1).padStart(2, '0')}`;
    result.push({ year: currYear, month: currMonth, key });
    currMonth++;
    if (currMonth > 11) {
      currMonth = 0;
      currYear++;
    }
  }
  return result;
}

export function calculateMaidStatements(
  maid: Maid,
  attendance: MaidAttendance[],
  payments: Payment[],
  advances: Advance[],
  targetYear: number,
  targetMonth: number
): MaidMonthlyStatement[] {
  const joinMonthKey = maid.joined_date.substring(0, 7); // "YYYY-MM"
  const targetMonthKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
  
  if (targetMonthKey < joinMonthKey) {
    return [];
  }
  
  const months = getMonthsRange(joinMonthKey, targetMonthKey);
  const statements: MaidMonthlyStatement[] = [];
  
  let carriedOverAdvance = 0;
  
  for (const { year, month, key } of months) {
    // 1. Calculate earnings based on attendance
    const mAtt = attendance.filter(a => a.maid_id === maid.id && a.date.startsWith(key));
    const breakdown = calculateSalaryForMonth(maid, mAtt, year, month);
    const earnings = breakdown.finalSalary;
    
    // 2. Sum advances given in this month
    const mAdvances = advances.filter(a => a.ref_id === maid.id && a.module === 'maid' && a.date.startsWith(key));
    const advancesGiven = mAdvances.reduce((sum, a) => sum + a.amount, 0);
    
    // 3. Compute outstanding advance and deductions
    const totalOutstandingAdvance = carriedOverAdvance + advancesGiven;
    const advanceDeduction = Math.min(earnings, totalOutstandingAdvance);
    const netPayable = earnings - advanceDeduction;
    const remainingAdvance = totalOutstandingAdvance - advanceDeduction;
    
    // 4. Sum payments made for this month
    const mPayments = payments.filter(p => p.ref_id === maid.id && p.module === 'maid' && p.period_start.startsWith(key));
    const paymentsMade = mPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const dueAmount = Math.max(0, netPayable - paymentsMade);
    
    statements.push({
      year,
      month,
      monthKey: key,
      earnings,
      advancesGiven,
      carriedOverAdvance,
      advanceDeduction,
      netPayable,
      remainingAdvance,
      paymentsMade,
      dueAmount,
    });
    
    carriedOverAdvance = remainingAdvance;
  }
  
  return statements;
}

