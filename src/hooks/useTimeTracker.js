import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { timeEntriesApi, paymentsApi } from "../api/timeTracker";
import { monthKey, todayStr, hmStr } from "../utils/time";

/**
 * Owns all time-tracker data: entries + monthly payment status, the realtime
 * subscription, and every mutation. Components stay presentational.
 */
export function useTimeTracker() {
  const [entries, setEntries] = useState([]);
  const [payments, setPayments] = useState({}); // { 'YYYY-MM': { paid, paid_at } }
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchEntries = useCallback(async () => {
    setErr("");
    const { data, error } = await timeEntriesApi.list();
    if (error) setErr(error.message);
    else setEntries(data || []);
    setLoading(false);
  }, []);

  const fetchPayments = useCallback(async () => {
    const { data, error } = await paymentsApi.list();
    if (error) {
      setErr(error.message);
      return;
    }
    setPayments(Object.fromEntries((data || []).map((r) => [r.month, r])));
  }, []);

  /* initial load + realtime sync */
  useEffect(() => {
    fetchEntries();
    fetchPayments();
    const channel = supabase
      .channel("db_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_entries" },
        fetchEntries,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "month_payments" },
        fetchPayments,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEntries, fetchPayments]);

  /* run an entries mutation, surface errors, refresh on success */
  const runEntries = useCallback(
    async (op) => {
      const { error } = await op();
      if (error) {
        setErr(error.message);
        return false;
      }
      await fetchEntries();
      return true;
    },
    [fetchEntries],
  );

  const openEntry = useMemo(() => entries.find((e) => !e.end_time), [entries]);

  const months = useMemo(() => {
    const set = new Set(entries.map((e) => monthKey(e.work_date)));
    return [...set].sort().reverse();
  }, [entries]);

  const clockIn = useCallback(() => {
    if (openEntry) return Promise.resolve(false);
    const d = new Date();
    return runEntries(() =>
      timeEntriesApi.insert({
        work_date: todayStr(d),
        start_time: hmStr(d),
        end_time: null,
        note: "",
      }),
    );
  }, [openEntry, runEntries]);

  const clockOff = useCallback(() => {
    if (!openEntry) return Promise.resolve(false);
    return runEntries(() =>
      timeEntriesApi.update(openEntry.id, { end_time: hmStr(new Date()) }),
    );
  }, [openEntry, runEntries]);

  /** Insert (no id) or update (with id). Returns true on success. */
  const saveEntry = useCallback(
    ({ id, ...payload }) =>
      runEntries(() =>
        id
          ? timeEntriesApi.update(id, payload)
          : timeEntriesApi.insert(payload),
      ),
    [runEntries],
  );

  const deleteEntry = useCallback(
    (id) => {
      if (!confirm("Delete this entry?")) return Promise.resolve(false);
      return runEntries(() => timeEntriesApi.remove(id));
    },
    [runEntries],
  );

  const clearAll = useCallback(() => {
    if (!confirm("Delete ALL entries for everyone? This cannot be undone."))
      return Promise.resolve(false);
    return runEntries(() => timeEntriesApi.clear());
  }, [runEntries]);

  const togglePaid = useCallback(
    async (month) => {
      if (!month) return;
      const nowPaid = !payments[month]?.paid;
      const { error } = await paymentsApi.upsert({
        month,
        paid: nowPaid,
        paid_at: nowPaid ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      });
      if (error) setErr(error.message);
      else fetchPayments();
    },
    [payments, fetchPayments],
  );

  return {
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
  };
}
