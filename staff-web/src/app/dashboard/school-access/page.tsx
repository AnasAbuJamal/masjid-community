'use client';
import { useEffect, useState } from 'react';
type User = { id: number; firstName: string; lastName: string; email: string; role: string };
type Data = { classes: { id: number; name: string; teacherId: number | null }[]; students: { id: number; firstName: string; lastName: string; userId: number | null }[]; users: User[] };
export default function SchoolAccessPage() {
 const [data, setData] = useState<Data | null>(null);
 const [message, setMessage] = useState('');
 const [busy, setBusy] = useState(false);
 async function load() {
  try { const res = await fetch('/api/school/access'); if (!res.ok) throw new Error(); setData(await res.json()); }
  catch { setMessage('Unable to load school access. An administrator account is required.'); }
 }
 useEffect(() => { void load(); }, []);
 async function save(kind: 'teacher' | 'student', recordId: number, value: string) {
  setBusy(true); setMessage('');
  try {
   const res = await fetch('/api/school/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, recordId, userId: value ? Number(value) : null }) });
   const result = await res.json(); if (!res.ok) throw new Error(result.error || 'Unable to save');
   await load(); setMessage('Account access updated.');
  } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save'); }
  finally { setBusy(false); }
 }
 const select = (kind: 'teacher' | 'student', id: number, current: number | null, label: string) => <label className="flex flex-col gap-2 rounded-xl border bg-white p-4" key={`${kind}-${id}`}>
  <span className="font-medium">{label}</span>
  <select className="min-h-11 rounded-lg border p-2" aria-label={`${label}: ${kind} account`} value={current ?? ''} disabled={busy} onChange={event => void save(kind, id, event.target.value)}>
   <option value="">No account assigned</option>
   {data?.users.filter(user => user.role === kind).map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.email})</option>)}
  </select>
 </label>;
 return <div className="mx-auto max-w-3xl space-y-6">
  <h1 className="text-2xl font-semibold">School account access</h1>
  <p>Assign teachers to classes and link students to their own accounts. Unassigned teacher and student accounts cannot access school records. Parents use a verified account matching the parent email on their child’s record.</p>
  {message && <p role="status" className="rounded-lg border p-3">{message}</p>}
  {!data ? <button className="min-h-11 underline" onClick={() => void load()}>Load school records</button> : <>
   <section className="space-y-3"><h2 className="text-xl font-semibold">Teacher assignments</h2>{data.classes.map(row => select('teacher', row.id, row.teacherId, row.name))}{!data.classes.length && <p>No classes yet.</p>}</section>
   <section className="space-y-3"><h2 className="text-xl font-semibold">Student accounts</h2>{data.students.map(row => select('student', row.id, row.userId, `${row.firstName} ${row.lastName}`))}{!data.students.length && <p>No enrolled students yet.</p>}</section>
  </>}
 </div>;
}
