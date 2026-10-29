"use client";
import {useCallback,useEffect,useState} from "react";
type Event={id:string;title:string;startAt:string;endAt:string};
type Attendee={id:string;checkedInAt:string|null;checkInRevision:number;user:{firstName:string;lastName:string}};
export default function HostCheckIn(){
 const [events,setEvents]=useState<Event[]>([]),[eventId,setEventId]=useState("");
 const [roster,setRoster]=useState<Attendee[]>([]),[event,setEvent]=useState<Event|null>(null);
 const [complete,setComplete]=useState(true),[reasons,setReasons]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const loadEvents=useCallback(async()=>{
  try{const r=await fetch("/api/v1/events/check-in",{cache:"no-store"});const j=await r.json();
   if(!r.ok)throw new Error(j.error?.message||"Cannot list assigned gatherings.");
   setEvents(j.data.events);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load assigned gatherings.");}
 },[]);
 const loadRoster=useCallback(async()=>{
  if(!eventId){setRoster([]);setEvent(null);return;}
  try{const r=await fetch("/api/v1/events/check-in?eventId="+encodeURIComponent(eventId),{cache:"no-store"});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Roster unavailable.");
   setRoster(j.data.roster);setEvent(j.data.event);setComplete(j.data.complete);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to view gathering roster.");setRoster([]);setEvent(null);}
 },[eventId]);
 useEffect(()=>{void loadEvents()},[loadEvents]);
 useEffect(()=>{void loadRoster()},[loadRoster]);
 async function record(a:Attendee,action:"arrive"|"correct"){
  if(busy)return;
  setBusy(a.id);setError("");setNotice("");
  try{
   const r=await fetch("/api/v1/events/check-in",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({eventId,rsvpId:a.id,expectedRevision:a.checkInRevision,action,
     ...(action==="correct"?{reason:reasons[a.id]||""}:{})})});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Attendance could not be recorded.");
   setNotice(action==="arrive"?"Arrival recorded.":"Correction recorded in the audit history.");
   setReasons(old=>({...old,[a.id]:""}));await loadRoster();
  }catch(e){setError(e instanceof Error?e.message:"Attendance update failed. Refresh the roster.");}
  finally{setBusy("");}
 }
 return <><header className="masthead"><span className="brand">Gathering check-in</span>
 <div className="actions"><a className="secondary" href="/staff">Staff home</a><button className="secondary" onClick={()=>{void loadEvents();void loadRoster();}}>Refresh</button></div></header>
 <main className="container"><div className="hero"><p className="eyebrow">GATHER · PRIVATE ATTENDANCE</p>
 <h1>Welcome people who are confirmed.</h1><p>This attendee roster is visible only to an explicitly assigned, active host. Do not photograph, export or share it. Waitlisted members are not confirmed.</p></div>
 {error?<p role="alert" className="error">{error}</p>:null}
 {notice?<p role="status" className="notice">{notice}</p>:null}
 <section className="panel"><div className="field"><label htmlFor="host-gathering">Your assigned gathering</label>
 <select id="host-gathering" value={eventId} onChange={e=>{setEventId(e.target.value);setNotice("");}}>
 <option value="">Select gathering</option>{events.map(e=><option key={e.id} value={e.id}>{e.title} — {new Date(e.startAt).toLocaleString()}</option>)}
 </select></div>{!events.length?<p>No assigned gatherings. Ask your organization steward for a specific host assignment.</p>:null}</section>
 {event?<section className="panel"><h2>{event.title}</h2>
 <p className="small">{new Date(event.startAt).toLocaleString()} – {new Date(event.endAt).toLocaleString()}</p>
 <p>Confirmed attendees ({roster.length}{!complete?"+":""}). Arrivals are recorded no earlier than two hours before and no later than one hour after the gathering ends. Corrections require a reason and are limited to 24 hours after.</p>
 {!complete?<p role="alert" className="notice">The roster contains more than 300 people. Do not infer complete attendance from this list; contact an organizer.</p>:null}
 <div className="grid">{roster.map(a=><article className="tile" key={a.id}>
 <h3>{a.user.firstName} {a.user.lastName}</h3>
 <p className="small">{a.checkedInAt?"Arrived "+new Date(a.checkedInAt).toLocaleString():"Not checked in"} · revision {a.checkInRevision}</p>
 {!a.checkedInAt?<button className="primary" disabled={!!busy} onClick={()=>void record(a,"arrive")}>Confirm arrival</button>:<>
 <div className="field"><label htmlFor={"checkin-reason-"+a.id}>Correction reason (required, no sensitive details)</label>
 <input id={"checkin-reason-"+a.id} type="text" value={reasons[a.id]||""} maxLength={300}
 onChange={e=>setReasons(old=>({...old,[a.id]:e.target.value}))}/></div>
 <button className="secondary" disabled={!!busy||(reasons[a.id]||"").trim().length<10}
 onClick={()=>void record(a,"correct")}>Correct check-in</button></>}
 </article>)}</div>{!roster.length?<p>No confirmed reservations to check in.</p>:null}
 </section>:null}
 </main></>;
}
