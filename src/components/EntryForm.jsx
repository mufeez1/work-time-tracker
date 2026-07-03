import { useEffect, useState } from "react";
import { hm, todayStr } from "../utils/time";
import Card from "./ui/Card";
import Field from "./ui/Field";
import Badge from "./ui/Badge";

const blank = () => ({ date: todayStr(), start: "", end: "", note: "" });

/**
 * Add / edit form. Fields are locked when the selected date falls in a
 * month that has already been marked paid.
 *
 * @param editing     entry being edited, or null for add mode
 * @param monthPaid   is the currently selected report month paid?
 * @param isMonthPaid (dateStr) => boolean
 * @param onSave      (payload) => Promise<boolean>  // true on success
 * @param onCancel    () => void                     // clears edit state
 */
export default function EntryForm({
  editing,
  monthPaid,
  isMonthPaid,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState(blank);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    setForm(
      editing
        ? {
            date: editing.work_date,
            start: hm(editing.start_time),
            end: hm(editing.end_time),
            note: editing.note || "",
          }
        : blank(),
    );
  }, [editing]);

  // Locked if the selected month is paid, or the entry's own month is paid.
  const locked = monthPaid || isMonthPaid(form.date);

  const handleSave = async () => {
    if (!form.date || !form.start) {
      alert("Please enter at least a date and a start time.");
      return;
    }
    const ok = await onSave({
      id: editing?.id,
      work_date: form.date,
      start_time: form.start,
      end_time: form.end || null,
      note: form.note.trim(),
    });
    if (ok) {
      setForm(blank());
      onCancel();
    }
  };

  return (
    <Card>
      <div className="toolbar">
        <strong>
          {editing ? `Editing entry — ${form.date}` : "Add entry manually"}
        </strong>
        {locked && <Badge variant="paid">Month paid — locked</Badge>}
      </div>
      <div className="row">
        <Field label="Date">
          <input type="date" value={form.date} onChange={set("date")} />
        </Field>
        <Field label="Start time">
          <input
            type="time"
            value={form.start}
            onChange={set("start")}
            disabled={locked}
          />
        </Field>
        <Field label="End time">
          <input
            type="time"
            value={form.end}
            onChange={set("end")}
            disabled={locked}
          />
        </Field>
        <Field label="Note (optional)">
          <input
            type="text"
            placeholder="e.g. project name"
            value={form.note}
            onChange={set("note")}
            disabled={locked}
          />
        </Field>
        <button className="accent" onClick={handleSave} disabled={locked}>
          {editing ? "Update entry" : "Save entry"}
        </button>
        {editing && (
          <button className="ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </Card>
  );
}
