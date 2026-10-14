import type { Report } from "./data";

const GREEN = "FF0B3D2E";
const MONEY = '"₹"#,##0;[Red]-"₹"#,##0';

/** Excel workbook with Summary, Bookings, Payments and Expenses sheets. */
export async function buildExcel(report: Report, title: string): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "SSquare";
  wb.created = new Date();

  const sheet = (name: string, columns: { header: string; key: string; width: number; money?: boolean }[], rows: object[]) => {
    const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = columns.map(({ header, key, width }) => ({ header, key, width }));
    rows.forEach((r) => ws.addRow(r));
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    head.alignment = { vertical: "middle" };
    head.height = 22;
    columns.forEach((c, i) => { if (c.money) ws.getColumn(i + 1).numFmt = MONEY; });
    if (rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
    return ws;
  };

  const summary = wb.addWorksheet("Summary");
  summary.columns = [{ width: 36 }, { width: 28 }];
  summary.addRow([title]).font = { bold: true, size: 14, color: { argb: GREEN } };
  summary.addRow([]);
  report.summary.forEach(([k, v]) => {
    const row = summary.addRow([k, v]);
    if (typeof v === "number") row.getCell(2).numFmt = k.startsWith("Bookings") || k.startsWith("Cancelled") ? "0" : MONEY;
    if (!k.startsWith("   ")) row.getCell(1).font = { bold: true };
  });

  sheet("Bookings", [
    { header: "Booking ID", key: "code", width: 11 },
    { header: "Date", key: "date", width: 13 },
    { header: "Time", key: "time", width: 22 },
    { header: "Court", key: "court", width: 28 },
    { header: "Customer", key: "customer", width: 20 },
    { header: "Phone", key: "phone", width: 12 },
    { header: "Status", key: "status", width: 11 },
    { header: "Total", key: "total", width: 10, money: true },
    { header: "Extra", key: "extra", width: 9, money: true },
    { header: "Paid", key: "paid", width: 10, money: true },
    { header: "UPI", key: "upi", width: 10, money: true },
    { header: "Cash", key: "cash", width: 10, money: true },
    { header: "Remaining", key: "remaining", width: 11, money: true },
    { header: "Payment Method", key: "method", width: 14 },
    { header: "Cash Received By", key: "cashBy", width: 20 },
    { header: "Booked By", key: "bookedBy", width: 11 },
    { header: "Notes", key: "note", width: 30 },
  ], report.bookingRows);

  sheet("Payments", [
    { header: "Date & Time", key: "when", width: 18 },
    { header: "Booking ID", key: "code", width: 11 },
    { header: "Customer", key: "customer", width: 20 },
    { header: "Type", key: "type", width: 11 },
    { header: "Method", key: "method", width: 8 },
    { header: "Amount", key: "amount", width: 11, money: true },
    { header: "Received By", key: "receivedBy", width: 13 },
    { header: "Recorded By", key: "recordedBy", width: 13 },
    { header: "UPI Screenshot", key: "proof", width: 14 },
  ], report.paymentRows);

  sheet("Expenses", [
    { header: "Date", key: "date", width: 13 },
    { header: "Category", key: "category", width: 14 },
    { header: "Description", key: "description", width: 34 },
    { header: "Expense By", key: "by", width: 12 },
    { header: "Method", key: "method", width: 8 },
    { header: "Amount", key: "amount", width: 11, money: true },
  ], report.expenseRows);

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
