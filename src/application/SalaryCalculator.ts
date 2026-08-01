import { Maid, MaidAttendance } from '../domain/types';

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
