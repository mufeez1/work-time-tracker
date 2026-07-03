/* ---------- date / time helpers (pure, framework-agnostic) ---------- */

export const pad = (n) => String(n).padStart(2, "0");

export const todayStr = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const hmStr = (d = new Date()) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const monthKey = (dateStr) => dateStr.slice(0, 7);

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
};

export const dayName = (dateStr) =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    new Date(dateStr + "T00:00:00").getDay()
  ];

// strip seconds if Postgres returns "HH:MM:SS"
export const hm = (t) => (t ? t.slice(0, 5) : "");

export function hoursWorked(start, end) {
  start = hm(start);
  end = hm(end);
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // overnight shift
  return mins / 60;
}

export const fmtHours = (h) => h.toFixed(2);

export function to12(t) {
  t = hm(t);
  if (!t) return "—";
  let [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${pad(m)} ${ap}`;
}

/** Aggregate a set of entries into { total, days, avg } hour stats. */
export function summarizeHours(rows) {
  let total = 0;
  const days = new Set();
  rows.forEach((e) => {
    total += hoursWorked(e.start_time, e.end_time);
    days.add(e.work_date);
  });
  return { total, days: days.size, avg: days.size ? total / days.size : 0 };
}
