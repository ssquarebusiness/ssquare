import type { Report } from "./data";

// Built-in PDF fonts have no ₹ glyph, so amounts use "Rs".
const rs = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;
const GREEN: [number, number, number] = [11, 61, 46];

/** Branded, landscape PDF with the same tables as the Excel file. */
export async function buildPdf(report: Report, title: string): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();

  doc.setFillColor(...GREEN);
  doc.rect(0, 0, width, 56, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18).setFont("helvetica", "bold").text("SSquare", 32, 35);
  doc.setFontSize(11).setFont("helvetica", "normal").text(title, width - 32, 35, { align: "right" });

  const head = { fillColor: GREEN, textColor: 255, fontStyle: "bold" as const };
  const styles = { fontSize: 8, cellPadding: 4 };
  let y = 76;
  const next = () => ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY ?? y) + 24;
  const heading = (text: string) => {
    if (y > doc.internal.pageSize.getHeight() - 90) {
      doc.addPage();
      y = 40;
    }
    doc.setTextColor(...GREEN).setFontSize(12).setFont("helvetica", "bold").text(text, 32, y);
    y += 8;
  };

  heading("Summary");
  autoTable(doc, {
    startY: y,
    body: report.summary.map(([k, v]) => [k, typeof v === "number" ? (k.startsWith("Bookings") || k.startsWith("Cancelled") ? String(v) : rs(v)) : v]),
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 220 } },
    theme: "plain",
    margin: { left: 32 },
    tableWidth: 420,
  });
  y = next();

  heading("Bookings");
  autoTable(doc, {
    startY: y,
    head: [["ID", "Date", "Time", "Court", "Customer", "Phone", "Status", "Total", "Paid", "UPI", "Cash", "Remaining", "Cash By", "Booked By"]],
    body: report.bookingRows.map((r) => [r.code, r.date, r.time, r.court, r.customer, r.phone, r.status, rs(r.total + r.extra), rs(r.paid), rs(r.upi), rs(r.cash), rs(r.remaining), r.cashBy, r.bookedBy]),
    headStyles: head, styles, margin: { left: 32, right: 32 },
  });
  y = next();

  if (report.paymentRows.length) {
    heading("Payments received");
    autoTable(doc, {
      startY: y,
      head: [["Date & Time", "ID", "Customer", "Type", "Method", "Amount", "Received By", "Recorded By"]],
      body: report.paymentRows.map((r) => [r.when, r.code, r.customer, r.type, r.method, rs(r.amount), r.receivedBy, r.recordedBy]),
      headStyles: head, styles, margin: { left: 32, right: 32 },
    });
    y = next();
  }

  if (report.expenseRows.length) {
    heading("Expenses");
    autoTable(doc, {
      startY: y,
      head: [["Date", "Category", "Description", "By", "Method", "Amount"]],
      body: report.expenseRows.map((r) => [r.date, r.category, r.description, r.by, r.method, rs(r.amount)]),
      headStyles: head, styles, margin: { left: 32, right: 32 },
    });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8).setTextColor(120).text(`Page ${i} of ${pages}`, width - 32, doc.internal.pageSize.getHeight() - 16, { align: "right" });
  }
  return doc.output("blob");
}
