"use client";
import {useCallback,useEffect,useState} from "react";
type Circle={id:string;title:string;status:string;cadence:string;hostId:string;host:{firstName:string;lastName:string};_count:{members:number}};
type Host={id:string;firstName:string;lastName:string};
export default function CircleSteward(){
 const [circles,setCircles]=useState<Circle[]>([]),[hosts,setHosts]=useState<Host[]>([]);
 const [title,setTitle]=useState(""),[summary,setSummary]=useState(""),[cadence,setCadence]=useState(""),[guidelines,setGuidelines]=useState("");
 const [hostId,setHostId]=useState(""),[published,setPublished]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const refresh=useCallback(async()=>{
  try{const r=await fetch("/api/v1/admin/circles",{cache:"no-store"});const j=await r.json();
   if(!r.ok)throw new Error(j.error?.message||"Cannot load circles.");
   setCircles(j.data.circles);setHosts(j.data.hosts);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load circles.");}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 async function send(body:Record<string,unknown>,method:"POST"|"PATCH"){
  if(busy)return;
  setBusy(true);setNotice("");setError("");
  try{const r=await fetch("/api/v1/admin/circles",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Circle action failed.");
   setNotice(method==="POST"?"Circle created with the chosen publication state.":"Circle status updated.");
   if(method==="POST"){setTitle("");setSummary("");setCadence("");setGuidelines("");setHostId("");setPublished(false);}
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save circle.");}finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand">Circle stewardship</span>
  <div className="actions"><a href="/admin" className="secondary">Control center</a><a href="/host/circles" className="secondary">Host view</a></div></header>
 <main className="container"><div className="hero"><p className="eyebrow">GATHER · TRUSTED CIRCLES</p><h1>Build smaller communities safely.</h1>
 <p>Every circle has a named, verified adult host and a published code of conduct. The public never sees its membership roster or internal updates. Archiving closes member and host views.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}
 {notice?<p className="notice" role="status">{notice}</p>:null}
 <section className="panel"><h2>Create a moderated circle</h2><div className="form">
 <div className="field"><label htmlFor="circle-title">Circle name</label><input id="circle-title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={120}/></div>
 <div className="field"><label htmlFor="circle-summary">Public purpose</label><textarea id="circle-summary" value={summary} onChange={e=>setSummary(e.target.value)} maxLength={1500}/></div>
 <div className="field"><label htmlFor="circle-cadence">Meeting rhythm (no private location)</label><input id="circle-cadence" value={cadence} onChange={e=>setCadence(e.target.value)} maxLength={140}/></div>
 <div className="field"><label htmlFor="circle-guidelines">Public moderation and behavior guidelines</label><textarea id="circle-guidelines" value={guidelines} onChange={e=>setGuidelines(e.target.value)} maxLength={1600}/></div>
 <div className="field"><label htmlFor="circle-host">Verified adult host</label><select id="circle-host" value={hostId} onChange={e=>setHostId(e.target.value)}>
 <option value="">Select host</option>{hosts.map(h=><option key={h.id} value={h.id}>{h.firstName} {h.lastName}</option>)}
 </select></div>
 <label><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/> Publish public outline now</label>
 <button className="primary" disabled={busy||title.trim().length<5||summary.trim().length<20||cadence.trim().length<4||guidelines.trim().length<20||!hostId}
 onClick={()=>void send({action:"create",title,summary,cadence,guidelines,hostId,published},"POST")}>{busy?"Saving…":"Create circle"}</button></div></section>
 <section className="panel"><h2>Circle status</h2>
 {circles.map(c=><div className="section" key={c.id}><h3>{c.title}</h3>
 <p>Host: {c.host.firstName} {c.host.lastName} · {c.cadence}</p>
 <p className="small">Status: {c.status} · {c._count.members} requests or members (not an attendance measure)</p>
 {c.status==="draft"?<button className="primary" disabled={busy}
 onClick={()=>void send({action:"change-status",circleId:c.id,status:"published"},"PATCH")}>Publish outline</button>:null}
 {c.status==="published"?<button className="secondary" disabled={busy}
 onClick={()=>void send({action:"change-status",circleId:c.id,status:"archived"},"PATCH")}>Archive and close access</button>:null}
 </div>)}
 {!circles.length?<p>No circles configured for this mosque yet.</p>:null}</section></main></>;
}
