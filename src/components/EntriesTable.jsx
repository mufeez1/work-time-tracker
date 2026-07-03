import { dayName, to12, hoursWorked, fmtHours } from "../utils/time";

/**
 * Entries table. When `paid` is true the month is locked: rows are struck
 * through and the edit/delete actions are hidden.
 */
export default function EntriesTable({ rows, paid, onEdit, onDelete }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Day</th>
          <th>Start</th>
          <th>End</th>
          <th>Hours</th>
          <th>Note</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((e) => (
          <tr
            key={e.id}
            style={paid ? { textDecoration: "line-through" } : undefined}
          >
            <td className="num">{e.work_date}</td>
            <td>{dayName(e.work_date)}</td>
            <td className="num">{to12(e.start_time)}</td>
            <td className="num">{to12(e.end_time)}</td>
            <td className="num">
              {e.end_time ? (
                fmtHours(hoursWorked(e.start_time, e.end_time))
              ) : (
                <span className="pill">in progress</span>
              )}
            </td>
            <td>{e.note}</td>
            <td style={{ whiteSpace: "nowrap" }}>
              {!paid && (
                <>
                  <button className="link" onClick={() => onEdit(e)}>
                    Edit
                  </button>
                  <button
                    className="link danger"
                    onClick={() => onDelete(e.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
