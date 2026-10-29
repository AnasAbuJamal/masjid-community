"use client";
import {useCallback,useEffect,useState} from "react";
type Req={id:string;status:string;reason:string|null;createdAt:string;user:{firstName:string;lastName:string;email:string}};
export default function PrivacyDesk(){
 const [requests,setRequests]=useState<Req[]>([]),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{
  try{const r=await fetch("/api/v1/admin/privacy",{cache:"no-store"});const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Access denied.");setRequests(j.data.requests);setError("");}
  catch(e){setError(e instanceof Error?e.message:"Could not load privacy requests.");}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 async function decide(id:string,status:"in_review"|"rejected"){
  setBusy(true);setError("");setNotice("");
  try{const r=await fetch("/api/v1/admin/privacy",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Unable to update.");setNotice("Request marked "+status+". No records were deleted.");await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to review.");}finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand"><span className="mark">✧</span>Privacy review</span><a href="/admin" className="secondary">Control center</a></header>
 <main className="container"><div className="hero"><p className="eyebrow">TRUST · DATA GOVERNANCE</p><h1>Respect every record.</h1>
 <p>This queue includes only data review requests submitted for the current mosque. Requests for another organization and older unassigned requests are excluded; older requests require separate privacy-officer reconciliation. Marking “in review” does not delete any account or data. Follow retention, safeguarding and financial policies.</p></div>
 {error?<p role="alert" className="error">{error}</p>:null}{notice?<p role="status" className="notice">{notice}</p>:null}
 <div className="grid">{requests.map(r=><article className="panel" key={r.id}><h2>{r.user.firstName} {r.user.lastName}</h2><p className="small">{r.user.email} · {new Date(r.createdAt).toLocaleString()}</p>
 <p>Status: <strong>{r.status}</strong></p>{r.reason?<p>{r.reason}</p>:null}
 {r.status==="pending"?<div className="actions"><button className="primary" disabled={busy} onClick={()=>void decide(r.id,"in_review")}>Begin review</button>
 <button className="secondary" disabled={busy} onClick={()=>void decide(r.id,"rejected")}>Reject request</button></div>:null}</article>)}</div>
 {!requests.length&&<div className="panel">No deletion requests have been submitted.</div>}</main></>;
}
