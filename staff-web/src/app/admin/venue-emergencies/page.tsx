"use client";
import {useCallback,useEffect,useState} from "react";

type Alert={id:string;kind:string;title:string;body:string;instructions:string;
 status:string;revision:number;expiresAt:string;publishedAt:string|null;updatedAt:string};
type Venue={id:string;name:string;timeZone:string;emergencyNotice:Alert|null};
type Data={venues:Venue[];policy:string};
type AlertKind="closure"|"access_change"|"safety"|"other";
const kinds:[AlertKind,string][]=[
 ["closure","Venue closure"],["access_change","Entrance or access change"],
 ["safety","Immediate safety information"],["other","Other venue emergency"]
];
function localDatetime(iso:string){
 const date=new Date(iso);
 if(!Number.isFinite(date.getTime()))return "";
 return new Date(date.getTime()-date.getTimezoneOffset()*60_000)
  .toISOString().slice(0,16);
}
export default function VenueEmergencies(){
 const [data,setData]=useState<Data|null>(null),[venueId,setVenueId]=useState("");
 const [kind,setKind]=useState<AlertKind>("closure"),[title,setTitle]=useState("");
 const [body,setBody]=useState(""),[instructions,setInstructions]=useState("");
 const [expiry,setExpiry]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const refresh=useCallback(async()=>{
  try{
   const response=await fetch("/api/v1/admin/venue-emergencies",{cache:"no-store"});
   const payload=await response.json();
   if(!response.ok)throw new Error(payload.error?.message||"Worship permission required.");
   setData(payload.data);setVenueId(old=>old||payload.data.venues[0]?.id||"");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load venue notices.");}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 const selected=data?.venues.find(v=>v.id===venueId);
 const current=selected?.emergencyNotice;
 function selectVenue(id:string){
  setVenueId(id);setError("");setNotice("");
  const alert=data?.venues.find(v=>v.id===id)?.emergencyNotice;
  setKind((alert?.kind as AlertKind)||"closure");
  setTitle(alert?.title||"");setBody(alert?.body||"");
  setInstructions(alert?.instructions||"");
  setExpiry(alert?localDatetime(alert.expiresAt):"");
 }
 async function send(action:"publish"|"clear"){
  if(!venueId)return;
  if(action==="publish"&&!window.confirm(
   "Publish this emergency notice immediately for the selected venue? Verify all instructions with the mosque first."))return;
  if(action==="clear"&&!window.confirm(
   "Clear this emergency notice immediately from public venue views?"))return;
  setBusy(true);setError("");setNotice("");
  try{
   const value=action==="clear"
    ?{action,venueId,expectedRevision:current?.revision||0}
    :{action,venueId,expectedRevision:current?.revision||0,kind,title,body,instructions,
      expiresAt:expiry?new Date(expiry).toISOString():""};
   const response=await fetch("/api/v1/admin/venue-emergencies",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)
   });
   const payload=await response.json();
   if(!response.ok)throw new Error(payload.error?.message||"Unable to save.");
   setNotice(action==="clear"?"Notice cleared and audited.":"Notice published and audited.");
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save.");}
  finally{setBusy(false);}
 }
 return <>
  <header className="masthead"><div className="brand">SILA · Venue emergencies</div>
   <a href="/admin/worship" className="secondary">Worship publishing</a></header>
  <main className="container">
   <div className="hero"><p className="eyebrow">F-006 · SCOPED PUBLIC SAFETY</p>
    <h1>Publish verified venue instructions.</h1>
    <p>Visible on the venue's public visit page, prayer display, and member worship views.
     Changes are audited. Notices expire automatically; this is not a push alert service
     and does not replace emergency response procedures.</p></div>
   {error?<p role="alert" className="error">{error}</p>:null}
   {notice?<p role="status" className="notice">{notice}</p>:null}
   <section className="panel">
    <div className="field"><label htmlFor="emergency-venue">Affected mosque venue</label>
     <select id="emergency-venue" value={venueId} onChange={e=>selectVenue(e.target.value)}>
      {data?.venues.map(v=><option value={v.id} key={v.id}>{v.name} · {v.timeZone}</option>)}
     </select></div>
    {!data?.venues.length?<p>No venue is available to publish against.</p>:null}
    {selected?<div className="form">
     <p className="small">Current state: {current?.status||"no notice"} · Revision {current?.revision||0}.
      A concurrent change requires reloading before another update.</p>
     {current?<button className="secondary" type="button" disabled={busy}
       onClick={()=>selectVenue(venueId)}>Load latest notice into editor</button>:null}
     <div className="field"><label htmlFor="alert-kind">Verified incident type</label>
      <select id="alert-kind" value={kind}
       onChange={e=>setKind(e.target.value as AlertKind)}>
       {kinds.map(([value,label])=><option value={value} key={value}>{label}</option>)}
      </select></div>
     <div className="field"><label htmlFor="alert-title">Visible headline</label>
      <input id="alert-title" value={title} maxLength={150}
       onChange={e=>setTitle(e.target.value)}/></div>
     <div className="field"><label htmlFor="alert-body">Confirmed situation</label>
      <textarea id="alert-body" value={body} maxLength={1500}
       onChange={e=>setBody(e.target.value)}/></div>
     <div className="field"><label htmlFor="alert-action">What visitors should do</label>
      <textarea id="alert-action" value={instructions} maxLength={500}
       onChange={e=>setInstructions(e.target.value)}/></div>
     <div className="field"><label htmlFor="alert-expires">Notice expires (device local time, mandatory)</label>
      <input id="alert-expires" type="datetime-local" value={expiry}
       onChange={e=>setExpiry(e.target.value)}/></div>
     <p className="small">Expiry must be 15 minutes to seven days away. Confirm venue,
      incident and instructions independently before publication.</p>
     <button className="primary" type="button" disabled={busy||!expiry||
      title.trim().length<8||body.trim().length<15||instructions.trim().length<10}
      onClick={()=>void send("publish")}>{busy?"Saving…":"Publish verified emergency revision"}</button>
     {current?.status==="published"?<button className="secondary" type="button"
       disabled={busy} onClick={()=>void send("clear")}>Clear published notice (audited)</button>:null}
    </div>:null}
   </section>
  </main>
 </>;
}
