import { supabase } from "../supabaseClient";

// Sentinel used to match "every row" on a uuid primary key.
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/* ---------- data-access layer: every Supabase call lives here ---------- */

export const timeEntriesApi = {
  list: () =>
    supabase
      .from("time_entries")
      .select("*")
      .order("work_date", { ascending: true })
      .order("start_time", { ascending: true }),
  insert: (payload) => supabase.from("time_entries").insert(payload),
  update: (id, payload) =>
    supabase.from("time_entries").update(payload).eq("id", id),
  remove: (id) => supabase.from("time_entries").delete().eq("id", id),
  clear: () => supabase.from("time_entries").delete().neq("id", ZERO_UUID),
};

export const paymentsApi = {
  list: () => supabase.from("month_payments").select("*"),
  upsert: (row) => supabase.from("month_payments").upsert(row),
};
