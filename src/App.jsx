import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from './supabaseClient'

/* ---------- time helpers ---------- */
const pad = (n) => String(n).padStart(2, '0')
const todayStr = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const hmStr = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
const monthKey = (dateStr) => dateStr.slice(0, 7)
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const monthLabel = (key) => {
  const [y, m] = key.split('-')
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`
}
const dayName = (dateStr) =>
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(dateStr + 'T00:00:00').getDay()]

// strip seconds if Postgres returns "HH:MM:SS"
const hm = (t) => (t ? t.slice(0, 5) : '')

function hoursWorked(start, end) {
  start = hm(start); end = hm(end)
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = eh * 60 + em - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60 // overnight shift
  return mins / 60
}
const fmtHours = (h) => h.toFixed(2)
function to12(t) {
  t = hm(t)
  if (!t) return '—'
  let [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12; if (h === 0) h = 12
  return `${h}:${pad(m)} ${ap}`
}

export default function App() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [now, setNow] = useState(new Date())

  const [mDate, setMDate] = useState(todayStr())
  const [mStart, setMStart] = useState('')
  const [mEnd, setMEnd] = useState('')
  const [mNote, setMNote] = useState('')
  const [editId, setEditId] = useState(null)

  const [month, setMonth] = useState('')

  /* live clock */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  /* load + realtime */
  useEffect(() => {
    fetchEntries()
    const ch = supabase
      .channel('time_entries_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, fetchEntries)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchEntries() {
    setErr('')
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .order('work_date', { ascending: true })
      .order('start_time', { ascending: true })
    if (error) setErr(error.message)
    else setEntries(data || [])
    setLoading(false)
  }

  const openEntry = useMemo(() => entries.find((e) => !e.end_time), [entries])

  /* clock in / off */
  async function clockIn() {
    if (openEntry) return
    const d = new Date()
    const { error } = await supabase.from('time_entries').insert({
      work_date: todayStr(d), start_time: hmStr(d), end_time: null, note: '',
    })
    if (error) setErr(error.message); else fetchEntries()
  }
  async function clockOff() {
    if (!openEntry) return
    const { error } = await supabase
      .from('time_entries').update({ end_time: hmStr(new Date()) }).eq('id', openEntry.id)
    if (error) setErr(error.message); else fetchEntries()
  }

  /* manual add / edit */
  function resetForm() {
    setEditId(null); setMDate(todayStr()); setMStart(''); setMEnd(''); setMNote('')
  }
  async function saveEntry() {
    if (!mDate || !mStart) { alert('Please enter at least a date and a start time.'); return }
    const payload = { work_date: mDate, start_time: mStart, end_time: mEnd || null, note: mNote.trim() }
    const { error } = editId
      ? await supabase.from('time_entries').update(payload).eq('id', editId)
      : await supabase.from('time_entries').insert(payload)
    if (error) { setErr(error.message); return }
    resetForm(); fetchEntries()
  }
  function editEntry(e) {
    setEditId(e.id); setMDate(e.work_date); setMStart(hm(e.start_time))
    setMEnd(hm(e.end_time)); setMNote(e.note || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  async function delEntry(id) {
    if (!confirm('Delete this entry?')) return
    const { error } = await supabase.from('time_entries').delete().eq('id', id)
    if (error) setErr(error.message); else fetchEntries()
  }
  async function clearAll() {
    if (!confirm('Delete ALL entries for everyone? This cannot be undone.')) return
    const { error } = await supabase.from('time_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) setErr(error.message); else fetchEntries()
  }

  /* months + filtered rows */
  const months = useMemo(() => {
    const s = new Set(entries.map((e) => monthKey(e.work_date)))
    return [...s].sort().reverse()
  }, [entries])

  useEffect(() => {
    if (months.length && !months.includes(month)) setMonth(months[0])
  }, [months]) // eslint-disable-line

  const rows = useMemo(
    () => entries.filter((e) => monthKey(e.work_date) === month),
    [entries, month]
  )
  const stats = useMemo(() => {
    let total = 0; const days = new Set()
    rows.forEach((e) => { total += hoursWorked(e.start_time, e.end_time); days.add(e.work_date) })
    return { total, days: days.size, avg: days.size ? total / days.size : 0 }
  }, [rows])

  /* Excel export */
  function buildSheet(monthRows, label) {
    const aoa = [[`Work Hours Report — ${label}`], [], ['Date','Day','Start','End','Hours','Note']]
    let total = 0
    monthRows.forEach((e) => {
      const h = e.end_time ? hoursWorked(e.start_time, e.end_time) : 0
      total += h
      aoa.push([e.work_date, dayName(e.work_date), to12(e.start_time), to12(e.end_time),
        e.end_time ? Number(h.toFixed(2)) : 'in progress', e.note || ''])
    })
    aoa.push([], ['', '', '', 'TOTAL', Number(total.toFixed(2)), ''])
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 11 }, { wch: 11 }, { wch: 10 }, { wch: 24 }]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]
    return ws
  }
  function exportMonths(keys, filename) {
    if (!keys.length) { alert('No entries to export.'); return }
    const wb = XLSX.utils.book_new()
    keys.forEach((mk) => {
      const mr = entries.filter((e) => monthKey(e.work_date) === mk)
      const safe = monthLabel(mk).replace(/[\\/?*[\]:]/g, '').slice(0, 31)
      XLSX.utils.book_append_sheet(wb, buildSheet(mr, monthLabel(mk)), safe)
    })
    XLSX.writeFile(wb, filename)
  }

  return (
    <div className="wrap">
      <h1>⏱️ Work Time Tracker</h1>
      <p className="sub">
        Shared board — anyone with the link can clock in/out and view the monthly report.
        Saved live to Supabase.
      </p>

      {err && <div className="err">⚠️ {err}</div>}

      {/* Clock card */}
      <div className="card">
        <div className="clock">
          <div className="now">
            <div className="time">{pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}</div>
            <div className="date">
              {now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="status">
            {openEntry
              ? <>Clocked in at <b>{to12(openEntry.start_time)}</b> on {openEntry.work_date}</>
              : 'Not clocked in.'}
          </div>
          <div className="btns">
            <button className="in" onClick={clockIn} disabled={!!openEntry}>Clock In</button>
            <button className="out" onClick={clockOff} disabled={!openEntry}>Clock Off</button>
          </div>
        </div>
      </div>

      {/* Manual add / edit */}
      <div className="card">
        <div className="toolbar"><strong>{editId ? `Editing entry — ${mDate}` : 'Add entry manually'}</strong></div>
        <div className="row">
          <div className="field"><label>Date</label>
            <input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} /></div>
          <div className="field"><label>Start time</label>
            <input type="time" value={mStart} onChange={(e) => setMStart(e.target.value)} /></div>
          <div className="field"><label>End time</label>
            <input type="time" value={mEnd} onChange={(e) => setMEnd(e.target.value)} /></div>
          <div className="field"><label>Note (optional)</label>
            <input type="text" placeholder="e.g. project name" value={mNote} onChange={(e) => setMNote(e.target.value)} /></div>
          <button className="accent" onClick={saveEntry}>{editId ? 'Update entry' : 'Save entry'}</button>
          {editId && <button className="ghost" onClick={resetForm}>Cancel</button>}
        </div>
      </div>

      {/* Entries + report */}
      <div className="card">
        <div className="toolbar">
          <div className="field"><label>Show month</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {months.length === 0 && <option value="">— no entries —</option>}
              {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
          </div>
          <div className="btns">
            <button className="accent mini" onClick={() => exportMonths([month], `Work-Hours-${month}.xlsx`)}>Export this month</button>
            <button className="ghost mini" onClick={() => exportMonths(months.slice().reverse(), 'Work-Hours-All-Months.xlsx')}>Export all months</button>
            <button className="ghost mini" onClick={clearAll}>Clear all</button>
          </div>
        </div>

        {loading ? (
          <div className="empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty">No entries yet. Use <b>Clock In</b> above or add one manually.</div>
        ) : (
          <table>
            <thead><tr><th>Date</th><th>Day</th><th>Start</th><th>End</th><th>Hours</th><th>Note</th><th></th></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="num">{e.work_date}</td>
                  <td>{dayName(e.work_date)}</td>
                  <td className="num">{to12(e.start_time)}</td>
                  <td className="num">{to12(e.end_time)}</td>
                  <td className="num">{e.end_time ? fmtHours(hoursWorked(e.start_time, e.end_time)) : <span className="pill">in progress</span>}</td>
                  <td>{e.note}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="link" onClick={() => editEntry(e)}>Edit</button>
                    <button className="link danger" onClick={() => delEntry(e.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {rows.length > 0 && (
          <div className="totalbar">
            <div className="stat"><div className="k">Days worked</div><div className="v">{stats.days}</div></div>
            <div className="stat"><div className="k">Total hours ({monthLabel(month)})</div><div className="v">{fmtHours(stats.total)}</div></div>
            <div className="stat"><div className="k">Avg hours / day</div><div className="v">{fmtHours(stats.avg)}</div></div>
          </div>
        )}
      </div>

      <p className="foot">Data stored in Supabase · Times handle overnight shifts · Built with React + Vite</p>
    </div>
  )
}
