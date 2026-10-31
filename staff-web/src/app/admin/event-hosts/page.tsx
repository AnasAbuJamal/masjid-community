"use client";
import {useCallback,useEffect,useState} from "react";
type Host={id:string;hostId:string;host:{firstName:string;lastName:string}};
type Event={id:string;title:string;startAt:string;endAt:string;hostAssignments:Host[]};
type Member={id:string;firstName:string;lastName:string;role:string};
export default function EventHostAdmin(){
 const [events,setEvents]=useState<Event[]>([]),[members,setMembers]=useState<Member[]>([]);
 const [eventId,setEventId]=useState(""),[hostId,setHostId]=useState("");
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{
  try{
   const r=await fetch("/api/v1/admin/event-hosts",{cache:"no-store"});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Host assignments unavailable.");
   setEvents(j.data.events);setMembers(j.data.members);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load host assignments.");}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 const selected=events.find(x=>x.id===eventId);
 async function change(host:string,action:"assign"|"revoke"){
  if(!eventId||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/v1/admin/event-hosts",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({eventId,hostId:host,action})});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Cannot change host assignment.");
   setNotice(action==="assign"?"The member may now access this gathering's private check-in roster.":"Host access revoked.");
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Host assignment failed.");}
  finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand">Gathering hosts</span>
  <div className="actions"><a className="secondary" href="/admin">Control center</a><a className="secondary" href="/host/check-in">Host check-in</a></div>
 </header><main className="container"><div className="hero"><p className="eyebrow">GATHER · HOST PERMISSIONS</p>
 <h1>Assign hosts deliberately.</h1><p>Only a verified, active, non-student member of this mosque can be assigned. Student role exclusion is not an age-certification or safeguarding clearance. An assignment grants access to the confirmed attendee roster for one gathering, not any other event.</p></div>
 {error?<p role="alert" className="error">{error}</p>:null}
 {notice?<p role="status" className="notice">{notice}</p>:null}
 <section className="panel"><h2>Host assignments</h2><div className="form">
 <div className="field"><label htmlFor="gather-host-event">Published gathering</label><select id="gather-host-event" value={eventId}
 onChange={e=>{setEventId(e.target.value);setNotice("");}}>
 <option value="">Choose a gathering</option>{events.map(e=><option key={e.id} value={e.id}>{e.title} — {new Date(e.startAt).toLocaleString()}</option>)}
 </select></div>
 <div className="field"><label htmlFor="gather-host-person">Verified mosque member</label><select id="gather-host-person" value={hostId} onChange={e=>setHostId(e.target.value)}>
 <option value="">Choose a member</option>{members.map(m=><option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.role})</option>)}
 </select></div><button className="primary" disabled={busy||!eventId||!hostId} onClick={()=>void change(hostId,"assign")}>Assign host</button>
 </div>
 {selected?<div className="section"><h3>Currently assigned hosts</h3>
 {selected.hostAssignments.map(h=><div className="actions" key={h.id}><span>{h.host.firstName} {h.host.lastName}</span>
 <button className="secondary" disabled={busy} onClick={()=>void change(h.hostId,"revoke")}>Revoke access</button></div>)}
 {!selected.hostAssignments.length?<p>No active hosts assigned to this gathering.</p>:null}
 </div>:null}
 {!events.length?<p>No recent published gatherings are available for host assignment.</p>:null}
 </section></main></>;
}
