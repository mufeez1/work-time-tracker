import Skeleton from "./ui/Skeleton";

// Widths roughly match the real entries-table columns.
const COLUMNS = [
  { header: "Date", w: 90 },
  { header: "Day", w: 40 },
  { header: "Start", w: 70 },
  { header: "End", w: 70 },
  { header: "Hours", w: 50 },
  { header: "Note", w: 150 },
  { header: "", w: 90 },
];

/** Loading placeholder that mirrors the entries table layout. */
export default function TableSkeleton({ rows = 5 }) {
  return (
    <table>
      <thead>
        <tr>
          {COLUMNS.map((c, i) => (
            <th key={i}>{c.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {COLUMNS.map((c, i) => (
              <td key={i}>
                <Skeleton width={c.w} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
