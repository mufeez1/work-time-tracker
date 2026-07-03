import { useEffect, useMemo, useState } from "react";
import { useNow } from "./hooks/useNow";
import { useTimeTracker } from "./hooks/useTimeTracker";
import { monthKey, summarizeHours } from "./utils/time";
import { exportMonths } from "./utils/excel";
import ClockCard from "./components/ClockCard";
import EntryForm from "./components/EntryForm";
import MonthReport from "./components/MonthReport";

export default function App() {
  const now = useNow();
  const {
    entries,
    payments,
    months,
    openEntry,
    loading,
    err,
    clockIn,
    clockOff,
    saveEntry,
    deleteEntry,
    clearAll,
    togglePaid,
  } = useTimeTracker();

  const [month, setMonth] = useState("");
  const [editing, setEditing] = useState(null);

  // keep a valid month selected as data loads / changes
  useEffect(() => {
    if (months.length && !months.includes(month)) setMonth(months[0]);
  }, [months]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(
    () => entries.filter((e) => monthKey(e.work_date) === month),
    [entries, month],
  );
  const stats = useMemo(() => summarizeHours(rows), [rows]);

  const paidInfo = payments[month];
  const isPaid = !!paidInfo?.paid;
  const isMonthPaid = (dateStr) =>
    !!(dateStr && payments[monthKey(dateStr)]?.paid);

  const handleEdit = (entry) => {
    setEditing(entry);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="wrap">
      <h1>⏱️ Work Time Tracker</h1>
      <p className="sub">
        Shared board — anyone with the link can clock in/out and view the
        monthly report. Saved live to Supabase.
      </p>

      {err && <div className="err">⚠️ {err}</div>}

      <ClockCard
        now={now}
        openEntry={openEntry}
        onClockIn={clockIn}
        onClockOff={clockOff}
      />

      <EntryForm
        editing={editing}
        monthPaid={isPaid}
        isMonthPaid={isMonthPaid}
        onSave={saveEntry}
        onCancel={() => setEditing(null)}
      />

      <MonthReport
        loading={loading}
        months={months}
        month={month}
        onMonthChange={setMonth}
        rows={rows}
        stats={stats}
        isPaid={isPaid}
        paidInfo={paidInfo}
        onTogglePaid={() => togglePaid(month)}
        onExportMonth={() =>
          exportMonths({
            entries,
            payments,
            keys: [month],
            filename: `Work-Hours-${month}.xlsx`,
          })
        }
        onExportAll={() =>
          exportMonths({
            entries,
            payments,
            keys: months.slice().reverse(),
            filename: "Work-Hours-All-Months.xlsx",
          })
        }
        onClearAll={clearAll}
        onEdit={handleEdit}
        onDelete={deleteEntry}
      />

      <p className="foot">
        Data stored in Supabase · Times handle overnight shifts · Built with
        React + Vite
      </p>
    </div>
  );
}
