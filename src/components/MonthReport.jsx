import { monthLabel } from "../utils/time";
import Card from "./ui/Card";
import Field from "./ui/Field";
import { PaymentBadge } from "./ui/Badge";
import EntriesTable from "./EntriesTable";
import TableSkeleton from "./TableSkeleton";
import StatsBar from "./StatsBar";

/** Month picker + toolbar + entries table + totals. */
export default function MonthReport({
  loading,
  months,
  month,
  onMonthChange,
  rows,
  stats,
  isPaid,
  paidInfo,
  onTogglePaid,
  onExportMonth,
  onExportAll,
  onClearAll,
  onEdit,
  onDelete,
}) {
  return (
    <Card>
      <div className="toolbar">
        <Field label="Show month">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={month} onChange={(e) => onMonthChange(e.target.value)}>
              {months.length === 0 && <option value="">— no entries —</option>}
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
            {month && <PaymentBadge paid={isPaid} />}
          </div>
        </Field>
        <div className="btns">
          {month && (
            <button
              className={isPaid ? "ghost mini" : "paid mini"}
              onClick={onTogglePaid}
            >
              {isPaid ? "Mark unpaid" : "Mark as paid"}
            </button>
          )}
          <button className="accent mini" onClick={onExportMonth}>
            Export this month
          </button>
          <button className="ghost mini" onClick={onExportAll}>
            Export all months
          </button>
          <button className="ghost mini" onClick={onClearAll}>
            Clear all
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <div className="empty">
          No entries yet. Use <b>Clock In</b> above or add one manually.
        </div>
      ) : (
        <EntriesTable
          rows={rows}
          paid={isPaid}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}

      {rows.length > 0 && (
        <StatsBar
          stats={stats}
          month={month}
          isPaid={isPaid}
          paidAt={paidInfo?.paid_at}
        />
      )}
    </Card>
  );
}
