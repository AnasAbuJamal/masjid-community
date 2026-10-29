"use client";
import {useCallback,useEffect,useState} from "react";
type Child={id:string;firstName:string;lastName:string};
type Enrolled={id:string;student:Child};
type Waiting={id:string;studentId:string;requestedAt:string;student:{firstName:string;lastName:string}};
type Class={id:string;name:string;capacity:number|null;program:{title:string};enrollments:Enrolled[];waitlist:Waiting[]};
type Student={id:string;firstName:string;lastName:string;studentNumber:string};
export default function ClassWaitlists(){
 const [classes,setClasses]=useState<Class[]>([]),[students,setStudents]=useState<Student[]>([]);
 const [classId,setClassId]=useState(""),[studentId,setStudentId]=useState("");
 const [reason,setReason]=useState(""),[reasons,setReasons]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const reload=useCallback(async()=>{
  try{
   const [queue,school]=await Promise.all([
    fetch("/api/v1/admin/school-waitlist",{cache:"no-store"}),
    fetch("/api/v1/admin/school",{cache:"no-store"})
   ]);
   const [a,b]=await Promise.all([queue.json(),school.json()]);
   if(!queue.ok||!school.ok)throw new Error(a.error?.message||b.error?.message||"School permissions required.");
   setClasses(a.data.classes);setStudents(b.data.students);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load class waitlists.");}
 },[]);
 useEffect(()=>{void reload();},[reload]);
 async function send(value:Record<string,unknown>){
  if(busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/v1/admin/school-waitlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Waitlist action unavailable.");
   setNotice(String(value.kind==="queue"?"Added to a reviewed waiting queue, NOT enrolled.":value.kind==="withdraw"?"Student withdrawn; no automatic replacement.":value.kind==="promote"?"Earliest eligible student has been enrolled.":"Waitlist entry cancelled."));
   setReason("");setReasons({});await reload();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save action.");}
  finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand">Class waitlists</span><div className="actions">
 <a className="secondary" href="/admin/school">School operations</a>
 <a className="secondary" href="/admin/enrollment">Guardian applications</a>
 <button className="secondary" onClick={()=>void reload()}>Refresh</button></div></header>
 <main className="container"><div className="hero"><p className="eyebrow">LEARN · CAPACITY REVIEW</p>
 <h1>Give every student a fair place.</h1>
 <p>Only a verified guardian-linked child can enter a full class waiting list. Withdrawals retain historical records and do not auto-enroll another child. A steward must explicitly promote the earliest eligible learner, with an audited reason.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}
 {notice?<p className="notice" role="status">{notice}</p>:null}
 <section className="panel"><h2>Join a full-class waitlist</h2><div className="form">
 <div className="field"><label htmlFor="queue-class">Class</label><select id="queue-class" value={classId} onChange={e=>setClassId(e.target.value)}>
 <option value="">Select class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.program.title} / {c.name} ({c.enrollments.length}{c.capacity===null?" / no limit":" / "+c.capacity})</option>)}</select></div>
 <div className="field"><label htmlFor="queue-child">Verified guardian-linked student</label><select id="queue-child" value={studentId} onChange={e=>setStudentId(e.target.value)}>
 <option value="">Select student</option>{students.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentNumber})</option>)}</select></div>
 <div className="field"><label htmlFor="queue-reason">Reason (10–300 characters, no private medical details)</label>
 <textarea id="queue-reason" maxLength={300} value={reason} onChange={e=>setReason(e.target.value)}/></div>
 <button className="primary" disabled={busy||!classId||!studentId||reason.trim().length<10}
 onClick={()=>void send({kind:"queue",classId,studentId,reason})}>Add to waiting list</button></div></section>
 <section className="panel"><h2>Classes and decisions</h2>
 {classes.map(c=><div className="section" key={c.id}><h3>{c.program.title} / {c.name}</h3>
 <p>Active seats: {c.enrollments.length}{c.capacity===null?" (unlimited)":" / "+c.capacity}. Waiting: {c.waitlist.length} shown.</p>
 <h4>Waiting students (first in line first)</h4>
 {c.waitlist.map((w,i)=><div key={w.id} className="tile section">
 <strong>{i+1}. {w.student.firstName} {w.student.lastName}</strong>
 <p className="small">Queued {new Date(w.requestedAt).toLocaleString()} · no seat reserved yet</p>
 <div className="field"><label htmlFor={"wait-"+w.id}>Required decision reason</label><textarea id={"wait-"+w.id}
 value={reasons[w.id]||""} maxLength={300} onChange={e=>setReasons(old=>({...old,[w.id]:e.target.value}))}/></div>
 <div className="actions">
 <button className="primary" disabled={busy||i!==0||(c.capacity!==null&&c.enrollments.length>=c.capacity)||(reasons[w.id]||"").trim().length<10}
 onClick={()=>void send({kind:"promote",waitlistId:w.id,reason:reasons[w.id]})}>Promote earliest to available seat</button>
 <button className="secondary" disabled={busy||(reasons[w.id]||"").trim().length<10}
 onClick={()=>void send({kind:"cancel",waitlistId:w.id,reason:reasons[w.id]})}>Cancel waiting request</button></div>
 </div>)}
 {!c.waitlist.length?<p className="small">Nobody waiting in this class.</p>:null}
 <h4>Active enrollments</h4>
 {c.enrollments.map(e=><div key={e.id} className="tile section"><strong>{e.student.firstName} {e.student.lastName}</strong>
 <div className="field"><label htmlFor={"withdraw-"+e.id}>Withdrawal reason (required)</label>
 <textarea id={"withdraw-"+e.id} maxLength={300} value={reasons[e.id]||""}
 onChange={v=>setReasons(old=>({...old,[e.id]:v.target.value}))}/></div>
 <button className="secondary" disabled={busy||(reasons[e.id]||"").trim().length<10}
 onClick={()=>void send({kind:"withdraw",enrollmentId:e.id,reason:reasons[e.id]})}>Record withdrawal</button></div>)}
 </div>)}
 {!classes.length?<p>No classes are currently configured.</p>:null}</section>
 <footer className="footer">Capacity, guardian links and FIFO order are rechecked server-side at every action. Past attendance, invoices and school reports are retained under their own safeguarding policy.</footer>
 </main></>;
}
