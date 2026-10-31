"use client";
import {useCallback,useEffect,useRef,useState} from "react";
type Circle={id:string;title:string;cadence:string};
type Member={id:string;status:"requested"|"approved";requestedAt:string;member:{firstName:string;lastName:string}};
type Update={id:string;body:string;publishedAt:string;revision:number};
type PrivateDetail={circle:Circle;members:Member[];updates:Update[];
 rosterComplete:boolean;hasMore:boolean;nextCursor:string|null;pageSize:number};
export default function HostCircles(){
 const [circles,setCircles]=useState<Circle[]>([]),[circleId,setCircleId]=useState("");
 const [detail,setDetail]=useState<PrivateDetail|null>(null);
 const selectedCircleRef=useRef(""),generation=useRef(0),pageInFlight=useRef(false);
 const [loadingMore,setLoadingMore]=useState(false);
 const [reasons,setReasons]=useState<Record<string,string>>({}),[body,setBody]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const loadCircles=useCallback(async()=>{
  try{const r=await fetch("/api/v1/circles/host",{cache:"no-store"});const j=await r.json();
   if(!r.ok)throw new Error(j.error?.message||"Assigned circles unavailable.");
   setCircles(j.data.circles);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Cannot load circles.");}
 },[]);
 const loadDetail=useCallback(async()=>{
  const version=++generation.current;
  setDetail(null);setReasons({});
  if(!circleId||document.hidden)return;
  try{
   const r=await fetch("/api/v1/circles/host?circleId="+encodeURIComponent(circleId),
    {cache:"no-store"});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error?.message||"Private circle unavailable.");
   if(selectedCircleRef.current!==circleId||generation.current!==version)return;
   setDetail(j.data);setError("");
  }catch(e){
   if(selectedCircleRef.current!==circleId||generation.current!==version)return;
   setDetail(null);setError(e instanceof Error?e.message:"Unable to load circle roster.");
  }
 },[circleId]);
 const loadMore=useCallback(async()=>{
  if(!circleId||!detail?.nextCursor||pageInFlight.current)return;
  pageInFlight.current=true;setLoadingMore(true);setError("");
  const version=generation.current,requestedCircle=circleId;
  try{
   const r=await fetch("/api/v1/circles/host?circleId="+encodeURIComponent(circleId)+
    "&cursor="+encodeURIComponent(detail.nextCursor),{cache:"no-store"});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error?.message||"Circle member page unavailable.");
   if(selectedCircleRef.current!==requestedCircle||generation.current!==version)return;
   setDetail(old=>{
    if(!old||old.circle.id!==requestedCircle)return old;
    const known=new Set(old.members.map(m=>m.id));
    return {...old,members:[...old.members,
     ...(j.data.members as Member[]).filter(m=>!known.has(m.id))],
     hasMore:!!j.data.hasMore,rosterComplete:!j.data.hasMore,
     nextCursor:j.data.nextCursor||null};
   });
  }catch(e){
   if(selectedCircleRef.current!==requestedCircle||generation.current!==version)return;
   setError((e instanceof Error?e.message:"Member page unavailable.")+
    " Refresh this circle to restart the private roster.");
   setDetail(old=>old?{...old,nextCursor:null}:old);
  }finally{pageInFlight.current=false;setLoadingMore(false);}
 },[circleId,detail?.nextCursor]);
 const clearPrivateRoster=useCallback(()=>{
  generation.current++;
  setDetail(null);setReasons({});setNotice("");
 },[]);
 useEffect(()=>{
  if(!circleId)return;
  let cancelled=false;
  const validateAccess=async()=>{
   if(document.hidden)return;
   try{
    const r=await fetch("/api/v1/circles/host?circleId="+encodeURIComponent(circleId)+
     "&mode=access",{cache:"no-store"});
    if(cancelled||selectedCircleRef.current!==circleId)return;
    if(!r.ok){
     clearPrivateRoster();
     setError("Circle host permission was not confirmed. Refresh to request the roster again.");
    }
   }catch{
    if(cancelled||selectedCircleRef.current!==circleId)return;
    clearPrivateRoster();
    setError("Circle host permission is unavailable. Refresh when connected.");
   }
  };
  const onVisibility=()=>{
   if(document.hidden)clearPrivateRoster();
   else{void loadCircles();void loadDetail();}
  };
  document.addEventListener("visibilitychange",onVisibility);
  window.addEventListener("pagehide",clearPrivateRoster);
  const timer=window.setInterval(()=>{void validateAccess()},45_000);
  return ()=>{
   cancelled=true;window.clearInterval(timer);
   document.removeEventListener("visibilitychange",onVisibility);
   window.removeEventListener("pagehide",clearPrivateRoster);
  };
 },[circleId,clearPrivateRoster,loadCircles,loadDetail]);
 useEffect(()=>{void loadCircles();},[loadCircles]);
 useEffect(()=>{void loadDetail();},[loadDetail]);
 async function retractUpdate(updateId:string){
  if(busy||!circleId||!detail?.updates.some(u=>u.id===updateId))return;
  if(!window.confirm("Retract this update from future member views? Already delivered copies cannot be recalled."))return;
  const targetCircle=circleId,version=generation.current;
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/v1/circles/host",{
    method:"DELETE",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({circleId:targetCircle,updateId})
   });
   const j=await r.json();
   if(!r.ok)throw new Error(j.error?.message||"Could not retract this update.");
   if(selectedCircleRef.current!==targetCircle||
      generation.current!==version||document.hidden)return;
   setNotice("Update retracted from future private views. Previously delivered copies cannot be recalled.");
   await loadDetail();
  }catch(e){
   if(selectedCircleRef.current===targetCircle&&generation.current===version)
    setError(e instanceof Error?e.message:"Unable to retract update.");
  }finally{setBusy(false);}
 }
 async function send(input:Record<string,unknown>){
  if(busy||!circleId)return;
  setBusy(true);setError("");setNotice("");
  try{const r=await fetch("/api/v1/circles/host",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({circleId,...input})});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Request failed.");
   if(selectedCircleRef.current!==circleId||document.hidden)return;
   setNotice(input.action==="decide"?
    "Review recorded; a generic private notice was created. The roster restarts on refresh.":
    "Update published to approved circle members.");
   setBody("");setReasons({});await loadDetail();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save.");}finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand">Host a circle</span>
 <div className="actions"><a href="/staff" className="secondary">Staff home</a><a href="/admin/circles" className="secondary">Steward setup</a><button className="secondary" onClick={()=>{void loadCircles();void loadDetail();}}>Refresh</button></div></header>
 <main className="container"><div className="hero"><p className="eyebrow">GATHER · HOST-ONLY</p><h1>Welcome people with care.</h1>
 <p>This workspace is for the active host of an explicitly assigned circle. Never share or photograph the roster. Only verified adult members can be approved. Leave review reasons free of unnecessary sensitive details.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}
 {notice?<p className="notice" role="status">{notice}</p>:null}
 <section className="panel"><div className="field"><label htmlFor="host-circle">Your assigned circle</label><select id="host-circle" value={circleId} onChange={e=>{
   selectedCircleRef.current=e.target.value;generation.current++;
   setDetail(null);setReasons({});setError("");setNotice("");
   setCircleId(e.target.value);
  }}>
 <option value="">Choose an assigned circle</option>{circles.map(c=><option key={c.id} value={c.id}>{c.title} · {c.cadence}</option>)}
 </select></div>{!circles.length?<p>No active circles assigned to you.</p>:null}</section>
 {detail?<><section className="panel"><h2>Member requests</h2>
 {!detail.rosterComplete?<p className="notice">This is a partial member roster. Load additional verified pages before assuming review is complete.</p>:null}
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
 {detail.nextCursor?<button type="button" className="secondary"
   disabled={busy||loadingMore} onClick={()=>void loadMore()}>
   {loadingMore?"Loading private members…":"Load more circle members"}
  </button>:null}
 {!detail.members.length?<p>No pending or approved member records.</p>:null}</section>
 <section className="panel"><h2>Publish a moderated update</h2>
 <p>Only approved members of this circle can read these messages. Never include private contact lists, case details or child records.</p>
 <div className="field"><label htmlFor="circle-update">Update (10 to 2,000 characters)</label>
 <textarea id="circle-update" maxLength={2000} value={body} onChange={e=>setBody(e.target.value)}/></div>
 <button className="primary" disabled={busy||body.trim().length<10} onClick={()=>void send({action:"publish-update",body})}>Publish to approved members</button>
 {detail.updates.map(u=><div key={u.id} className="section"><p>{u.body}</p><p className="small">Published {new Date(u.publishedAt).toLocaleString()} · revision {u.revision}</p>
 <button type="button" className="secondary" disabled={busy}
  aria-label={"Retract published circle update from "+new Date(u.publishedAt).toLocaleString()}
  onClick={()=>void retractUpdate(u.id)}>Retract update</button></div>)}
 </section></>:null}</main></>;
}
