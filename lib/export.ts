export type Row = Record<string, string | number>;
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function safe(value: unknown) {
  const s = String(value ?? "");
  return /^[=+@-]/.test(s) ? "'" + s : s;
}
export async function exportRows(
  title: string,
  rows: Row[],
  format: "csv" | "xlsx" | "pdf",
) {
  const name = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
  const keys = Object.keys(rows[0] || {});
  if (format === "csv") {
    const csv = [keys, ...rows.map((r) => keys.map((k) => r[k]))]
      .map((row) =>
        row.map((v) => '"' + safe(v).replaceAll('"', '""') + '"').join(";"),
      )
      .join("\r\n");
    download(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
      name + ".csv",
    );
    return;
  }
  if (format === "xlsx") {
    const ExcelJS = (await import("exceljs")).default;
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("Relatório");
    sheet.columns = keys.map((k) => ({ header: k, key: k, width: 28 }));
    rows.forEach((r) => sheet.addRow(r));
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD95142" },
    };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    const buffer = await book.xlsx.writeBuffer();
    download(
      new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      name + ".xlsx",
    );
    return;
  }
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18);
  doc.text("Bicou Brincou · " + title, 14, 20);
  doc.setFontSize(9);
  doc.text("Gerado em " + new Date().toLocaleDateString("pt-BR"), 14, 28);
  let y = 40;
  const width = 269 / Math.max(keys.length, 1);
  const header = () => {
    doc.setFillColor(217, 81, 66);
    doc.rect(14, y - 5, 269, 9, "F");
    doc.setTextColor(255, 255, 255);
    keys.forEach((k, i) =>
      doc.text(k, 16 + i * width, y, { maxWidth: width - 4 }),
    );
    doc.setTextColor(50, 50, 50);
    y += 12;
  };
  header();
  for (const row of rows) {
    const cells = keys.map(
      (k) => doc.splitTextToSize(String(row[k] ?? ""), width - 4) as string[],
    );
    const height = Math.max(1, ...cells.map((c) => c.length)) * 5 + 4;
    if (y + height > 195) {
      doc.addPage();
      y = 20;
      header();
    }
    cells.forEach((cell, i) => doc.text(cell, 16 + i * width, y));
    y += height;
    doc.setDrawColor(229, 226, 222);
    doc.line(14, y - 3, 283, y - 3);
  }
  doc.save(name + ".pdf");
}
