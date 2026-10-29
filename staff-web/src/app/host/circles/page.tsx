"use client";
import {useCallback,useEffect,useState} from "react";
type Circle={id:string;title:string;cadence:string};
type Member={id:string;status:"requested"|"approved";requestedAt:string;member:{firstName:string;lastName:string}};
type Update={id:string;body:string;publishedAt:string;revision:number};
export default function HostCircles(){
 const [circles,setCircles]=useState<Circle[]>([]),[circleId,setCircleId]=useState("");
 const [detail,setDetail]=useState<{circle:Circle;members:Member[];updates:Update[];rosterComplete:boolean}|null>(null);
 const [reasons,setReasons]=useState<Record<string,string>>({}),[body,setBody]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const loadCircles=useCallback(async()=>{
  try{const r=await fetch("/api/v1/circles/host",{cache:"no-store"});const j=await r.json();
   if(!r.ok)throw new Error(j.error?.message||"Assigned circles unavailable.");
   setCircles(j.data.circles);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Cannot load circles.");}
 },[]);
 const loadDetail=useCallback(async()=>{
  if(!circleId){setDetail(null);return;}
  try{const r=await fetch("/api/v1/circles/host?circleId="+encodeURIComponent(circleId),{cache:"no-store"});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Private circle unavailable.");
   setDetail(j.data);setError("");
  }catch(e){setDetail(null);setError(e instanceof Error?e.message:"Unable to load circle roster.");}
 },[circleId]);
 useEffect(()=>{void loadCircles();},[loadCircles]);
 useEffect(()=>{void loadDetail();},[loadDetail]);
 async function send(input:Record<string,unknown>){
  if(busy||!circleId)return;
  setBusy(true);setError("");setNotice("");
  try{const r=await fetch("/api/v1/circles/host",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({circleId,...input})});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Request failed.");
   setNotice(input.action==="decide"?"Review recorded; a generic private notice was created.":"Update published to approved circle members.");
   setBody("");setReasons({});await loadDetail();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save.");}finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand">Host a circle</span>
 <div className="actions"><a href="/staff" className="secondary">Staff home</a><a href="/admin/circles" className="secondary">Steward setup</a><button className="secondary" onClick={()=>{void loadCircles();void loadDetail();}}>Refresh</button></div></header>
 <main className="container"><div className="hero"><p className="eyebrow">GATHER · HOST-ONLY</p><h1>Welcome people with care.</h1>
 <p>This workspace is for the active host of an explicitly assigned circle. Never share or photograph the roster. Only verified adult members can be approved. Leave review reasons free of unnecessary sensitive details.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}
 {notice?<p className="notice" role="status">{notice}</p>:null}
 <section className="panel"><div className="field"><label htmlFor="host-circle">Your assigned circle</label><select id="host-circle" value={circleId} onChange={e=>setCircleId(e.target.value)}>
 <option value="">Choose an assigned circle</option>{circles.map(c=><option key={c.id} value={c.id}>{c.title} · {c.cadence}</option>)}
 </select></div>{!circles.length?<p>No active circles assigned to you.</p>:null}</section>
 {detail?<><section className="panel"><h2>Member requests</h2>
 {!detail.rosterComplete?<p role="alert">More than 100 people are in the queue. Contact a steward for controlled pagination; this is not a complete roster.</p>:null}
 {detail.members.map(m=><div key={m.id} className="section">
 <strong>{m.member.firstName} {m.member.lastName}</strong><p className="small">{m.status} · Requested {new Date(m.requestedAt).toLocaleDateString()}</p>
 {m.status==="requested"?<><div className="field"><label htmlFor={"circle-reason-"+m.id}>Reason for decision (required, at least 10 characters)</label>
 <textarea id={"circle-reason-"+m.id} value={reasons[m.id]||""} maxLength={280}
 onChange={e=>setReasons(old=>({...old,[m.id]:e.target.value}))}/></div>
 <div className="actions"><button className="primary" disabled={busy||(reasons[m.id]||"").trim().length<10}
 onClick={()=>void send({action:"decide",memberId:m.id,decision:"approved",reason:reasons[m.id]})}>Approve</button>
 <button className="secondary" disabled={busy||(reasons[m.id]||"").trim().length<10}
 onClick={()=>void send({action:"decide",memberId:m.id,decision:"declined",reason:reasons[m.id]})}>Decline</button></div></>:null}
 </div>)}
 {!detail.members.length?<p>No pending or approved member records.</p>:null}</section>
 <section className="panel"><h2>Publish a moderated update</h2>
 <p>Only approved members of this circle can read these messages. Never include private contact lists, case details or child records.</p>
 <div className="field"><label htmlFor="circle-update">Update (10 to 2,000 characters)</label>
 <textarea id="circle-update" maxLength={2000} value={body} onChange={e=>setBody(e.target.value)}/></div>
 <button className="primary" disabled={busy||body.trim().length<10} onClick={()=>void send({action:"publish-update",body})}>Publish to approved members</button>
 {detail.updates.map(u=><div key={u.id} className="section"><p>{u.body}</p><p className="small">Published {new Date(u.publishedAt).toLocaleString()} · revision {u.revision}</p></div>)}
 </section></>:null}</main></>;
}
