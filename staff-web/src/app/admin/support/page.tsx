"use client";
import {useCallback,useEffect,useState} from "react";
type Ticket={id:string;traceId:string;category:string;status:string;createdAt:string};
type Note={id:string;code:string;createdAt:string};
type Page={mode:string;items?:Ticket[];item?:Ticket;notes?:Note[];complete:boolean;nextCursor:string|null;grantExpiresAt:string;policy:string};
const categories=["login_access","public_content","event_registration","school_access","payments_metadata","technical_fault"];
const notes=["investigation_started","reproduced","unable_to_reproduce","escalated_to_owner","fix_in_progress","resolution_verified"];
const label=(s:string)=>s.replaceAll("_"," ");
const request=async(params:URLSearchParams):Promise<Page>=>{
 const r=await fetch("/api/v1/admin/support?"+params.toString(),{cache:"no-store"});
 const j=await r.json();
 if(!r.ok)throw Error(j.error?.message||"Private support access unavailable.");
 return j.data as Page;
};
export default function SupportDesk(){
 const [cases,setCases]=useState<Ticket[]>([]),[cursor,setCursor]=useState<string|null>(null);
 const [complete,setComplete]=useState(true),[selected,setSelected]=useState<Page|null>(null);
 const [expiry,setExpiry]=useState(""),[trace,setTrace]=useState("");
 const [category,setCategory]=useState(categories[0]),[note,setNote]=useState(notes[0]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const refresh=useCallback(async()=>{
  try{
   const p=await request(new URLSearchParams());
   if(p.mode!=="list"||!p.items)throw Error("Invalid private support response.");
   setCases(p.items);setCursor(p.nextCursor);setComplete(p.complete);
   setExpiry(p.grantExpiresAt);setError("");
  }catch(e){
   setCases([]);setSelected(null);setCursor(null);setComplete(true);
   setError(e instanceof Error?e.message:"Access unavailable.");
  }
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 async function loadMore(){
  if(!cursor||busy)return;
  setBusy(true);setError("");
  try{
   const p=await request(new URLSearchParams({cursor}));
   if(p.mode!=="list"||!p.items)throw Error("Invalid support list.");
   setCases(old=>[...old,...p.items!.filter(x=>!old.some(y=>y.id===x.id))]);
   setCursor(p.nextCursor);setComplete(p.complete);
  }catch(e){setError(e instanceof Error?e.message:"Could not load older cases.");}
  finally{setBusy(false);}
 }
 async function openCase(id:string,noteCursor?:string){
  setBusy(true);setError("");
  try{
   const p=await request(new URLSearchParams({caseId:id,...(noteCursor?{noteCursor}:{})}));
   if(p.mode!=="case"||!p.item||!p.notes)throw Error("Invalid support case.");
   setSelected(old=>noteCursor&&old&&old.item?.id===id?{
    ...p,notes:[...(old.notes||[]),...p.notes!.filter(x=>!old.notes?.some(y=>x.id===y.id))]
   }:p);
  }catch(e){setSelected(null);setError(e instanceof Error?e.message:"Case unavailable.");}
  finally{setBusy(false);}
 }
 async function save(value:Record<string,unknown>){
  if(busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/v1/admin/support",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)
   });
   const j=await r.json();
   if(!r.ok)throw Error(j.error?.message||"Support operation denied.");
   setNotice("Saved with sealed audit evidence.");
   if(value.kind==="create")setTrace("");
   await refresh();
   const id=j.data?.caseId;
   if(typeof id==="string"){
    const p=await request(new URLSearchParams({caseId:id}));
    setSelected(p);
   }
  }catch(e){setError(e instanceof Error?e.message:"Support operation unavailable.");}
  finally{setBusy(false);}
 }
 return <><header className="masthead"><div className="brand"><span className="mark">✧</span>Operational support</div>
 <a className="secondary" href="/admin">Control center</a></header>
 <main className="container">
  <div className="hero"><p className="eyebrow">TRUST · STAFF SUPPORT</p>
   <h1>Investigate without accessing private accounts.</h1>
   <p>This metadata-only workspace requires a time-limited mosque support grant and MFA. Every read and write is sealed-audited. Do not enter names, contact information, child records, financial data, passwords or confidential case details.</p>
   {expiry?<p className="small">Grant expires <time dateTime={expiry}>{new Date(expiry).toLocaleString()}</time></p>:null}
  </div>
  {error?<p role="alert" className="error">{error}</p>:null}
  {notice?<p role="status" className="notice">{notice}</p>:null}
  <div className="split section">
   <section className="panel"><h2>Create a support case</h2>
    <div className="form">
     <div className="field"><label htmlFor="trace">Opaque trace ID</label>
      <input id="trace" value={trace} onChange={e=>setTrace(e.target.value)}
       maxLength={64} pattern="[A-Za-z0-9_-]{8,64}" autoComplete="off" placeholder="trace_12345678"/></div>
     <div className="field"><label htmlFor="support-category">Category</label>
      <select id="support-category" value={category} onChange={e=>setCategory(e.target.value)}>
       {categories.map(x=><option key={x} value={x}>{label(x)}</option>)}
      </select></div>
     <button className="primary" disabled={busy||!/^[A-Za-z0-9_-]{8,64}$/.test(trace)}
      onClick={()=>void save({kind:"create",traceId:trace,category})}>Open case</button>
    </div></section>
   <section className="panel"><h2>Support case history</h2>
    {cases.map(x=><div className="tile section" key={x.id}>
     <strong style={{fontSize:17}}>{label(x.category)}</strong>
     <p className="small">Trace <code>{x.traceId}</code> · {x.status}</p>
     <p className="small"><time dateTime={x.createdAt}>{new Date(x.createdAt).toLocaleString()}</time></p>
     <button className="secondary" disabled={busy} onClick={()=>void openCase(x.id)}>Review</button></div>)}
    {!cases.length&&!error?<p className="small">No support cases recorded.</p>:null}
    {!complete?<button className="secondary" disabled={busy||!cursor} onClick={()=>void loadMore()}>
     Load 50 older cases</button>:<p role="status" className="small">Complete case register.</p>}
   </section></div>
   {selected?.item?<section className="panel section">
    <h2>Case <code>{selected.item.traceId}</code></h2>
    <p>Status: <strong>{selected.item.status}</strong>. Investigation history contains only approved structured codes.</p>
    {selected.item.status==="open"?<button className="secondary" disabled={busy}
     onClick={()=>void save({kind:"status",caseId:selected.item!.id,status:"investigating"})}>Start investigation</button>:null}
    {selected.item.status==="investigating"?<button className="secondary" disabled={busy||
      !selected.notes?.some(x=>x.code==="resolution_verified")}
     onClick={()=>void save({kind:"status",caseId:selected.item!.id,status:"resolved"})}>Close after verified resolution</button>:null}
    {selected.item.status!=="resolved"?<div className="form section">
     <div className="field"><label htmlFor="support-note">Investigation update</label>
      <select id="support-note" value={note} onChange={e=>setNote(e.target.value)}>
       {notes.map(x=><option key={x} value={x}>{label(x)}</option>)}
      </select></div>
     <button className="primary" disabled={busy}
      onClick={()=>void save({kind:"note",caseId:selected.item!.id,code:note})}>Record structured note</button>
    </div>:null}
    <h3>Audit history</h3>
    {selected.notes?.map(x=><p key={x.id} className="small">
     <time dateTime={x.createdAt}>{new Date(x.createdAt).toLocaleString()}</time> · {label(x.code)}
    </p>)}
    {!selected.complete?<button className="secondary" disabled={busy||!selected.nextCursor}
     onClick={()=>void openCase(selected.item!.id,selected.nextCursor||undefined)}>
     Load 50 older investigation notes</button>:<p role="status" className="small">Complete note history.</p>}
   </section>:null}
 </main></>;
}
