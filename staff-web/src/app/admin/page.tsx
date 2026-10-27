"use client";
import { useCallback, useEffect, useState } from "react";
type Data={organization:{name:string}|null;role:"admin"|"staff";counts:Record<string,number>;construction:{id:string;title:string;status:string}[];venues:{id:string;name:string}[];prayers:{id:string;localDate:string;fajr:string;dhuhr:string;asr:string;maghrib:string;isha:string;published:boolean}[];announcements:{id:string;title:string;status:string}[];events:{id:string;title:string;status:string;startAt:string}[];applications:{id:string;status:string;opportunity:{title:string};user:{firstName:string;lastName:string}}[]};
type Kind="prayer"|"announcement"|"event"|"program"|"campaign"|"volunteer"|"job"|"proposal"|"rental"|"article"|"construction"|"milestone";
const fields:Record<Kind,{key:string;label:string;type?:string}[]>={
 prayer:[{key:"localDate",label:"Schedule date",type:"date"},...["fajr","sunrise","dhuhr","asr","maghrib","isha","fajrIqamah","dhuhrIqamah","asrIqamah","maghribIqamah","ishaIqamah"].map(x=>({key:x,label:x.replace("Iqamah"," iqamah"),type:"time"}))],
 announcement:[{key:"title",label:"Headline"},{key:"body",label:"Announcement",type:"textarea"}],
 event:[{key:"title",label:"Event title"},{key:"description",label:"Details",type:"textarea"},{key:"location",label:"Location"},{key:"startAt",label:"Start",type:"datetime-local"},{key:"endAt",label:"End",type:"datetime-local"},{key:"capacity",label:"Capacity",type:"number"}],
 program:[{key:"title",label:"Program"},{key:"description",label:"Description",type:"textarea"}],
 campaign:[{key:"title",label:"Campaign title"},{key:"purpose",label:"Purpose",type:"textarea"},{key:"goalMinor",label:"Goal in cents",type:"number"}],
 volunteer:[{key:"title",label:"Opportunity"},{key:"description",label:"Description",type:"textarea"},{key:"startsAt",label:"Start",type:"datetime-local"},{key:"capacity",label:"Capacity",type:"number"}],
 job:[{key:"title",label:"Position"},{key:"company",label:"Organization"},{key:"description",label:"Details",type:"textarea"}],
 proposal:[{key:"title",label:"Proposal"},{key:"description",label:"Details",type:"textarea"}],
 rental:[{key:"title",label:"Resource"},{key:"description",label:"Description",type:"textarea"}],
 article:[{key:"title",label:"Article title"},{key:"body",label:"Article body",type:"textarea"}],
 construction:[{key:"title",label:"Project title"},{key:"description",label:"Project description",type:"textarea"},{key:"goalMinor",label:"Goal (minor units)",type:"number"}],
 milestone:[{key:"projectId",label:"Construction project"},{key:"title",label:"Milestone title"},{key:"description",label:"Milestone details",type:"textarea"},{key:"completedAt",label:"Completion time (optional)",type:"datetime-local"}],
};
const names:Record<Kind,string>={prayer:"Salah schedule",announcement:"Announcement",event:"Event",program:"School program",campaign:"Giving campaign",volunteer:"Volunteer opportunity",job:"Job",proposal:"Proposal",rental:"Rental resource",article:"Article",construction:"Construction project",milestone:"Construction milestone"};
export default function Admin(){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [kind,setKind]=useState<Kind>("prayer"),[form,setForm]=useState<Record<string,string>>({}),[published,setPublished]=useState(false),[busy,setBusy]=useState(false);
 const reload=useCallback(async()=>{
  try{const res=await fetch("/api/v1/admin",{cache:"no-store"});const json=await res.json();if(!res.ok)throw new Error(json.error?.message||"Admin access required.");setData(json.data);setError("");}
  catch(e){setError(e instanceof Error?e.message:"Unable to connect.");}
 },[]);
 useEffect(()=>{void reload()},[reload]);
 const set=(key:string,value:string)=>setForm(old=>({...old,[key]:value}));
 async function submit(){
  if(!data||busy||data.role!=="admin")return;
  setBusy(true);setError("");setNotice("");
  const raw:Record<string,unknown>={kind,published,...form};
  for(const key of ["capacity","goalMinor"])if(raw[key]!==undefined&&raw[key]!=="")raw[key]=Number(raw[key]);
  for(const key of ["startAt","endAt","startsAt","completedAt"])if(raw[key])raw[key]=new Date(String(raw[key])).toISOString();
  if(raw.capacity==="")delete raw.capacity;if(raw.goalMinor==="")delete raw.goalMinor;if(raw.completedAt==="")delete raw.completedAt;
  if(kind==="prayer"){raw.venueId=data.venues[0]?.id;}
  try{const res=await fetch("/api/v1/admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(raw)});const json=await res.json();if(!res.ok)throw new Error(json.error?.message||"Unable to save.");setNotice(names[kind]+" saved successfully.");setForm({});setPublished(false);await reload();}
  catch(e){setError(e instanceof Error?e.message:"Save failed.");}
  finally{setBusy(false);}
 }
 async function decide(applicationId:string,decision:"approved"|"declined"){
  setBusy(true);setError("");
  try{const res=await fetch("/api/v1/admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"volunteer-decision",applicationId,decision})});const json=await res.json();if(!res.ok)throw new Error(json.error?.message||"Decision failed.");setNotice("Application "+decision+".");await reload();}
  catch(e){setError(e instanceof Error?e.message:"Request failed.");}
  finally{setBusy(false);}
 }
 async function logout(){await fetch("/api/v1/auth/logout",{method:"POST"});window.location.assign("/");}
 return <><header className="masthead"><div className="brand"><span className="mark">✧</span><span>Masjid Community · Control center</span></div><div className="actions"><a className="secondary" href="/admin/school">School</a><a className="secondary" href="/admin/schoolwork">Teaching</a><a className="secondary" href="/admin/invoices">Tuition</a><a className="secondary" href="/admin/finance">Verified giving</a><a className="secondary" href="/admin/finance/manage">Finance controls</a><a className="secondary" href="/admin/refunds">Refund requests</a><a className="secondary" href="/admin/operations">Facility requests</a><a className="secondary" href="/admin/volunteers">Volunteer shifts</a><a className="secondary" href="/admin/community">Community desk</a><a className="secondary" href="/admin/privacy">Privacy requests</a><a className="secondary" href="/kiosk">Public kiosk</a><button onClick={()=>void reload()} className="secondary">Refresh</button><button onClick={()=>void logout()} className="secondary">Sign out</button></div></header>
 <main className="container">
  <div className="hero"><p className="eyebrow">AZURE SANCTUARY / OPERATIONS</p><h1>Carefully run. Beautifully connected.</h1><p>{data?.organization?.name||"Your mosque"} · Real data and published content only.</p></div>
  {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}
  {!data?<section className="panel">{error?"Check your account permissions and connection.":"Loading administrative data…"}</section>:<>
   <section className="grid" aria-label="Operating overview">{Object.entries(data.counts).map(([key,value])=><div className="tile" key={key}><p>{key.charAt(0).toUpperCase()+key.slice(1)}</p><strong>{value.toLocaleString()}</strong><p>Verified database records</p></div>)}</section>
   <section className="section split">
    <div className="panel"><h2>Create & publish</h2><p className="small">Items saved as drafts are not shown publicly.</p>
     <div className="tabs" role="group" aria-label="Content type">{(Object.keys(names) as Kind[]).map(k=><button key={k} type="button" className={kind===k?"primary":"secondary"} onClick={()=>{setKind(k);setForm({});setPublished(false)}}>{names[k]}</button>)}</div>
     {data.role!=="admin"?<p className="notice">Your staff role is read-only in this workspace.</p>:<div className="form">
      {fields[kind].map(f=><div className="field" key={f.key}><label htmlFor={f.key}>{f.label}</label>{f.key==="projectId"?<select id={f.key} value={form[f.key]||""} onChange={e=>set(f.key,e.target.value)}><option value="">Select project</option>{data.construction.map(p=><option key={p.id} value={p.id}>{p.title} · {p.status}</option>)}</select>:f.type==="textarea"?<textarea id={f.key} value={form[f.key]||""} onChange={e=>set(f.key,e.target.value)}/>:<input id={f.key} type={f.type||"text"} value={form[f.key]||""} onChange={e=>set(f.key,e.target.value)}/>}</div>)}
      <div className="field"><label><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/> Publish for community</label></div>
      <button className="primary" onClick={()=>void submit()} disabled={busy||(kind==="prayer"&&!data.venues.length)}>{busy?"Saving…":"Save "+names[kind]}</button>
     </div>}
    </div>
    <div className="panel"><h2>Current operations</h2><p className="small">Schedules and review queues are sourced from your database.</p>
     <h3>Salah schedules</h3>{data.prayers.length?data.prayers.slice(0,6).map(p=><p className="small" key={p.id}>{p.localDate} · Fajr {p.fajr} · {p.published?"Published":"Draft"}</p>):<p className="small">No prayer schedules entered yet.</p>}
     <h3>Announcements</h3>{data.announcements.length?data.announcements.slice(0,6).map(p=><p className="small" key={p.id}>{p.title} · {p.status}</p>):<p className="small">No announcements yet.</p>}
     <h3>Volunteer review</h3>{data.applications.length?data.applications.slice(0,8).map(a=><div key={a.id} className="section"><strong>{a.user.firstName} {a.user.lastName}</strong><p className="small">{a.opportunity.title} · {a.status}</p>{a.status==="submitted"&&data.role==="admin"&&<div className="actions"><button className="secondary" disabled={busy} onClick={()=>void decide(a.id,"approved")}>Approve</button><button className="secondary" disabled={busy} onClick={()=>void decide(a.id,"declined")}>Decline</button></div>}</div>):<p className="small">No applications to review.</p>}
    </div>
   </section>
  </>}
  <footer className="footer">Every publication and decision must match the mosque's policies. Payments, verification and migration gates must pass before production release.</footer>
 </main></>;
}
