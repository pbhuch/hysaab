import { MilkEntry, LaundryEntry, Maid, MaidAttendance, Payment, Vendor, RateChange } from '../domain/types';
import { calculateSalaryForMonth } from './SalaryCalculator';

export class ExportService {
  // Convert objects to CSV string
  static convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (val !== undefined && val !== null ? val : '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  // Format WhatsApp Share text for Milk Summary
  static formatMilkWhatsAppSummary(
    monthName: string,
    year: number,
    vendorName: string,
    entries: MilkEntry[],
    rateChanges: RateChange[],
    baseRate: number
  ): string {
    const totalLitres = entries.reduce((acc, entry) => acc + entry.quantity_ltr, 0);
    const totalAmount = entries.reduce((acc, entry) => acc + entry.total, 0);

    return `*🥛 Milk Purchase Summary - ${monthName} ${year}*\n` +
      `---------------------------------\n` +
      `*Vendor:* ${vendorName}\n` +
      `*Total Litres:* ${totalLitres.toFixed(2)} L\n` +
      `*Average Rate:* ₹${(entries.length > 0 ? totalAmount / totalLitres : baseRate).toFixed(2)}/L\n` +
      `*Total Amount:* ₹${totalAmount.toLocaleString('en-IN')}\n\n` +
      `Generated via Household Ledger App.`;
  }

  // Format WhatsApp Share text for Laundry Summary
  static formatLaundryWhatsAppSummary(
    monthName: string,
    year: number,
    vendorName: string,
    entries: LaundryEntry[]
  ): string {
    const totalItems = entries.reduce((acc, entry) => {
      return acc + Object.values(entry.items).reduce((s, c) => s + c, 0);
    }, 0);
    const totalAmount = entries.reduce((acc, entry) => acc + entry.total, 0);
    const pendingAmount = entries.filter(e => e.status === 'sent').reduce((acc, entry) => acc + entry.total, 0);

    return `*🧺 Laundry Summary - ${monthName} ${year}*\n` +
      `---------------------------------\n` +
      `*Vendor:* ${vendorName}\n` +
      `*Total Clothes Sent:* ${totalItems} pcs\n` +
      `*Total Amount:* ₹${totalAmount.toLocaleString('en-IN')}\n` +
      `*Status:* ${pendingAmount > 0 ? `₹${pendingAmount} Pending Settlement` : 'Fully Settled'}\n\n` +
      `Generated via Household Ledger App.`;
  }

  // Format WhatsApp Share text for Maid Settlement Slip
  static formatMaidWhatsAppSlip(
    monthName: string,
    year: number,
    maid: Maid,
    attendance: MaidAttendance[]
  ): string {
    const breakdown = calculateSalaryForMonth(maid, attendance, year, new Date(`${monthName} 1, ${year}`).getMonth());
    
    return `*👤 Salary Settlement Slip - ${monthName} ${year}*\n` +
      `---------------------------------\n` +
      `*Name:* ${maid.name} (${maid.role.toUpperCase()})\n` +
      `*Monthly Base Rate:* ₹${maid.monthly_rate.toLocaleString('en-IN')}\n` +
      `*Active Days:* ${breakdown.activeDaysInMonth}/${breakdown.totalDaysInMonth}\n` +
      `*Present Days:* ${breakdown.presentDays}\n` +
      `*Paid Leaves:* ${breakdown.paidLeaves}\n` +
      `*Unpaid Leaves:* ${breakdown.unpaidLeaves} (Half-Days: ${breakdown.halfDays})\n` +
      `*Deductions:* ₹${breakdown.deductions.toLocaleString('en-IN')}\n` +
      `---------------------------------\n` +
      `*Net Payable:* ₹${breakdown.finalSalary.toLocaleString('en-IN')}\n` +
      `---------------------------------\n` +
      `*Status:* Payment Due\n\n` +
      `Please review and settle at your earliest.\n` +
      `Generated via Household Ledger App.`;
  }

  // Generate HTML for PDF Print (web & native compatible)
  static generateSummaryHTML(title: string, contentHTML: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
          h1 { margin: 0; color: #1e1b4b; }
          .meta-info { font-size: 14px; color: #666; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px 15px; text-align: left; }
          th { background-color: #f3f4f6; color: #1f2937; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .total-row { font-weight: bold; background-color: #e5e7eb !important; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="meta-info">Generated on ${new Date().toLocaleDateString('en-IN')}</div>
        </div>
        ${contentHTML}
        <div class="footer">
          Household Ledger App - Offline-First Personal Accountant
        </div>
      </body>
      </html>
    `;
  }
}
