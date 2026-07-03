import * as XLSX from "xlsx";
import { hoursWorked, dayName, to12, monthLabel, monthKey } from "./time";

/** Build a single worksheet (array-of-arrays) for one month's rows. */
function buildSheet(monthRows, label, pInfo) {
  const statusText = pInfo?.paid
    ? `Status: PAID${pInfo.paid_at ? " on " + pInfo.paid_at.slice(0, 10) : ""}`
    : "Status: UNPAID";

  const aoa = [
    [`Work Hours Report — ${label}`],
    [statusText],
    [],
    ["Date", "Day", "Start", "End", "Hours", "Note"],
  ];

  let total = 0;
  monthRows.forEach((e) => {
    const h = e.end_time ? hoursWorked(e.start_time, e.end_time) : 0;
    total += h;
    aoa.push([
      e.work_date,
      dayName(e.work_date),
      to12(e.start_time),
      to12(e.end_time),
      e.end_time ? Number(h.toFixed(2)) : "in progress",
      e.note || "",
    ]);
  });
  aoa.push([], ["", "", "", "TOTAL", Number(total.toFixed(2)), ""]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 12 },
    { wch: 6 },
    { wch: 11 },
    { wch: 11 },
    { wch: 10 },
    { wch: 24 },
  ];
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
  return ws;
}

/**
 * Export one workbook with a sheet per month key.
 * @param {{ entries: any[], payments: Record<string, any>, keys: string[], filename: string }} opts
 */
export function exportMonths({ entries, payments, keys, filename }) {
  if (!keys.length) {
    alert("No entries to export.");
    return;
  }
  const wb = XLSX.utils.book_new();
  keys.forEach((mk) => {
    const monthRows = entries.filter((e) => monthKey(e.work_date) === mk);
    const safe = monthLabel(mk)
      .replace(/[\\/?*[\]:]/g, "")
      .slice(0, 31);
    XLSX.utils.book_append_sheet(
      wb,
      buildSheet(monthRows, monthLabel(mk), payments[mk]),
      safe,
    );
  });
  XLSX.writeFile(wb, filename);
}
