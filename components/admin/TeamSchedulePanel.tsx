"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TEAM_DAYS,
  formatScheduleCell,
  parseScheduleCell,
  weeklyHours,
  type TeamDay,
  type TeamMember,
  type TeamSchedule,
} from "@/lib/team-schedule";

type Props = { onSessionExpired: () => void };
type DraftRow = { id: string; name: string; active: boolean; cells: Record<TeamDay, string> };

function toRows(schedule: TeamSchedule): DraftRow[] {
  return schedule.members.map((member) => ({
    id: member.id,
    name: member.name,
    active: member.active !== false,
    cells: Object.fromEntries(TEAM_DAYS.map((day) => [day, formatScheduleCell(member.shifts[day])])) as Record<TeamDay, string>,
  }));
}

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `team-${Date.now()}`;
}

export function TeamSchedulePanel({ onSessionExpired }: Props) {
  const [schedule, setSchedule] = useState<TeamSchedule | null>(null);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [status, setStatus] = useState("Loading team schedule…");
  const [busy, setBusy] = useState(false);

  async function request(method: "GET" | "POST", body?: unknown) {
    const response = await fetch("/api/admin/team-schedule", {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (response.status === 401) { onSessionExpired(); throw new Error("Admin session expired."); }
    const data = await response.json() as { schedule?: TeamSchedule; error?: string };
    if (!response.ok || !data.schedule) throw new Error(data.error || "Could not load team schedule.");
    return data.schedule;
  }

  useEffect(() => {
    request("GET").then((next) => {
      setSchedule(next); setRows(toRows(next)); setStatus("Schedule loaded. The mirror updates in realtime after Save.");
    }).catch((error) => setStatus(error instanceof Error ? error.message : "Could not load schedule."));
  }, []);

  function patchCell(index: number, day: TeamDay, value: string) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, cells: { ...row.cells, [day]: value } } : row));
  }

  function patchRow(index: number, patch: Partial<DraftRow>) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  const previewMembers = useMemo<TeamMember[]>(() => rows.map((row) => ({
    id: row.id,
    name: row.name,
    active: row.active,
    shifts: Object.fromEntries(TEAM_DAYS.map((day) => [day, parseScheduleCell(row.cells[day])])) as TeamMember["shifts"],
  })), [rows]);

  async function save() {
    if (!schedule) return;
    setBusy(true);
    try {
      const next: TeamSchedule = {
        ...schedule,
        members: previewMembers.filter((member) => member.name.trim()),
        updatedAt: new Date().toISOString(),
      };
      const saved = await request("POST", { schedule: next });
      setSchedule(saved); setRows(toRows(saved)); setStatus(`Saved ${saved.members.length} team members · mirror widgets update automatically.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not save schedule."); }
    finally { setBusy(false); }
  }

  async function reset() {
    if (!window.confirm("Reset the schedule to the timetable seeded from the photo you supplied?")) return;
    setBusy(true);
    try {
      const next = await request("POST", { action: "reset" });
      setSchedule(next); setRows(toRows(next)); setStatus("Reset to the photo-seeded weekly schedule.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not reset schedule."); }
    finally { setBusy(false); }
  }

  if (!schedule) return <section className="team-admin-page"><div className="team-admin-loading">{status}</div></section>;

  return <section className="team-admin-page">
    <div className="team-admin-hero">
      <div><span className="admin-kicker">TEAM SCHEDULE</span><h1>One roster powers every schedule widget.</h1><p>Update the weekly schedule here. “Who’s In Now”, “Coming Up”, “Today’s Team” and “Weekly Team Schedule” widgets all recalculate automatically from the mirror’s local Wichita time.</p></div>
      <div className="team-admin-actions"><button onClick={reset} disabled={busy}>Reset to photo seed</button><button className="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save schedule"}</button></div>
    </div>

    <div className="team-admin-meta">
      <label><span>Schedule title</span><input value={schedule.title} onChange={(event) => setSchedule({ ...schedule, title: event.target.value })}/></label>
      <label><span>Timezone</span><input value={schedule.timezone} onChange={(event) => setSchedule({ ...schedule, timezone: event.target.value })}/></label>
      <div><span>LAST SAVED</span><b>{new Date(schedule.updatedAt).getTime() ? new Date(schedule.updatedAt).toLocaleString() : "Photo seed"}</b></div>
    </div>

    <div className="team-admin-status">{status}</div>
    <div className="team-table-wrap">
      <table className="team-table"><thead><tr><th>Active</th><th>Employee</th>{TEAM_DAYS.map((day) => <th key={day}>{day.slice(0,3)}</th>)}<th>Hours</th><th/></tr></thead><tbody>
        {rows.map((row, index) => <tr key={row.id} className={row.active ? "" : "is-inactive"}>
          <td><input type="checkbox" checked={row.active} onChange={(event) => patchRow(index, { active: event.target.checked })}/></td>
          <td><input className="team-name-input" value={row.name} onChange={(event) => patchRow(index, { name: event.target.value, id: row.id || slug(event.target.value) })}/></td>
          {TEAM_DAYS.map((day) => <td key={day}><textarea rows={2} value={row.cells[day]} onChange={(event) => patchCell(index, day, event.target.value)} placeholder="OFF"/></td>)}
          <td className="team-hours">{weeklyHours(previewMembers[index] as TeamMember)}</td>
          <td><button className="team-remove" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}>×</button></td>
        </tr>)}
      </tbody></table>
    </div>
    <div className="team-table-help"><b>Cell format:</b> <code>8:45 AM-5:00 PM Opening</code> · split shifts: <code>9:30 AM-12:15 PM / 2:00 PM-9:00 PM Split</code> · or <code>OFF</code>.</div>
    <button className="team-add" onClick={() => setRows((current) => [...current, { id: `team-${Date.now()}`, name: "New person", active: true, cells: Object.fromEntries(TEAM_DAYS.map((day) => [day, "OFF"])) as Record<TeamDay, string> }])}>+ Add team member</button>
  </section>;
}
