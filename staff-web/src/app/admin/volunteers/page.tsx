"use client";
import {useCallback,useEffect,useState} from "react";
type Application={id:string;user:{firstName:string;lastName:string;email:string};opportunity:{title:string}};
type Shift={id:string;startAt:string;endAt:string;checkedInAt:string|null;status:string;volunteer:{firstName:string;lastName:string};opportunity:{title:string}};
export default function VolunteerAdmin(){
 const [apps,setApps]=useState<Application[]>([]),[shifts,setShifts]=useState<Shift[]>([]),[applicationId,setApplicationId]=useState(""),[start,setStart]=useState(""),[end,setEnd]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const load=useCallback(async()=>{
  try{const r=await fetch("/api/v1/admin/shifts");const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Access denied.");
   setApps(j.data.applications);setShifts(j.data.shifts);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Cannot load volunteer shifts.");}
 },[]);
 useEffect(()=>{void load()},[load]);
 async function send(input:Record<string,unknown>){
  setBusy(true);setError("");setNotice("");
  try{const r=await fetch("/api/v1/admin/shifts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Unable to update shift.");setNotice("Volunteer schedule updated.");await load();
  }catch(e){setError(e instanceof Error?e.message:"Unable to update shift.");}finally{setBusy(false);}
 }
 async function schedule(){
  try{await send({kind:"schedule",applicationId,startAt:new Date(start).toISOString(),endAt:new Date(end).toISOString()});}
  catch{setError("Enter valid start and end dates.");}
 }
 return <><header className="masthead"><span className="brand"><span className="mark">✧</span>Volunteer coordination</span><a href="/admin" className="secondary">Control center</a></header>
 <main className="container"><div className="hero"><p className="eyebrow">COMMUNITY · VOLUNTEERS</p><h1>Support that shows up.</h1><p>Schedule approved volunteers, record factual attendance, and keep the community informed. Check-in opens 15 minutes before the shift and closes when it ends. An arrived volunteer cannot be silently cancelled.</p><button className="secondary" onClick={()=>void load()} disabled={busy}>Refresh shift windows</button></div>
 {error?<p role="alert" className="error">{error}</p>:null}{notice?<p role="status" className="notice">{notice}</p>:null}
 <div className="split"><section className="panel"><h2>Schedule shift</h2><div className="form">
 <div className="field"><label htmlFor="volunteer">Approved application</label><select id="volunteer" value={applicationId} onChange={e=>setApplicationId(e.target.value)}><option value="">Select volunteer</option>{apps.map(a=><option value={a.id} key={a.id}>{a.user.firstName} {a.user.lastName} — {a.opportunity.title}</option>)}</select></div>
 <div className="field"><label htmlFor="startsAt">Start</label><input id="startsAt" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)}/></div>
 <div className="field"><label htmlFor="endsAt">End</label><input id="endsAt" type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)}/></div>
 <button className="primary" disabled={busy||!applicationId||!start||!end} onClick={()=>void schedule()}>Schedule shift</button>
 </div></section>
 <section className="panel"><h2>Upcoming and historical shifts</h2>{shifts.map(s=><div className="section tile" key={s.id}><h3>{s.volunteer.firstName} {s.volunteer.lastName}</h3>
 <p className="small">{s.opportunity.title} · {new Date(s.startAt).toLocaleString()} – {new Date(s.endAt).toLocaleString()}</p>
 <p className="small">{s.status} · {s.checkedInAt?"Checked in "+new Date(s.checkedInAt).toLocaleString():"Not checked in"}</p>
 {s.status==="scheduled"?<div className="actions">
 {!s.checkedInAt?<button className="primary"
 disabled={busy||Date.parse(s.startAt)>Date.now()+15*60000||Date.parse(s.endAt)<=Date.now()}
 onClick={()=>void send({kind:"update",shiftId:s.id,action:"check-in"})}>Check in</button>:
 <button className="primary" disabled={busy||Date.parse(s.startAt)>Date.now()}
 onClick={()=>void send({kind:"update",shiftId:s.id,action:"complete"})}>Complete</button>}
 <button className="secondary" disabled={busy||!!s.checkedInAt} onClick={()=>void send({kind:"update",shiftId:s.id,action:"cancel"})}>Cancel</button>
 </div>:null}</div>)}
 {!shifts.length?<p className="small">No shifts have been scheduled.</p>:null}</section></div>
 </main></>;
}
