"use client";
import {useCallback,useEffect,useState} from "react";
type RequestItem={id:string;name:string;email:string;subject:string;message:string;status:string;createdAt:string};
type ProposalItem={id:string;title:string;description:string;status:string;submitter:{firstName:string;lastName:string}|null};
export default function Community(){
 const [requests,setRequests]=useState<RequestItem[]>([]),[proposals,setProposals]=useState<ProposalItem[]>([]),[canModerate,setCanModerate]=useState(false),[busy,setBusy]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const load=useCallback(async()=>{
  try{const [r1,r2]=await Promise.all([fetch("/api/v1/admin/contact"),fetch("/api/v1/admin/proposals")]);const [c,p]=await Promise.all([r1.json(),r2.json()]);
   if(!r1.ok||!r2.ok)throw new Error(c.error?.message||p.error?.message||"Access denied.");
   setRequests(c.data.requests);setProposals(p.data.items);setCanModerate(!!p.data.canModerate);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load records.");}
 },[]);
 useEffect(()=>{void load()},[load]);
 async function decide(path:string,id:string,value:string){
  setBusy(id);setNotice("");setError("");
  try{const r=await fetch("/api/v1/admin/"+path,{method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id,status:value})});const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Review unsuccessful.");
    setNotice("Record updated: "+value+".");await load();
  }catch(e){setError(e instanceof Error?e.message:"Unable to update.");}
  finally{setBusy("");}
 }
 return <><header className="masthead"><div className="brand"><span className="mark">✧</span>Community desk</div><a className="secondary" href="/admin">Control center</a></header>
 <main className="container"><div className="hero"><p className="eyebrow">COMMUNITY · REVIEW</p><h1>Every voice belongs.</h1><p>Review member ideas and contact inquiries, with clear visibility and state.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}{notice?<p className="notice" role="status">{notice}</p>:null}
 <div className="split section"><section className="panel"><h2>Member proposals</h2>{proposals.length?proposals.map(p=><article className="tile section" key={p.id}><h3>{p.title}</h3><p>{p.description}</p><p className="small">Submitted by {p.submitter?.firstName||"Staff"} · {p.status}</p>{p.status==="draft"&&canModerate?<div className="actions">
  <button className="primary" disabled={!!busy} onClick={()=>void decide("proposals",p.id,"published")}>Publish</button>
  <button className="secondary" disabled={!!busy} onClick={()=>void decide("proposals",p.id,"archived")}>Decline</button>
 </div>:null}</article>):<p className="small">No proposals have been submitted.</p>}</section>
 <section className="panel"><h2>Contact inquiries</h2>{requests.length?requests.map(r=><article key={r.id} className="section tile"><h3>{r.subject}</h3>
 <p>{r.message}</p><p className="small">From {r.name} · {r.email} · {new Date(r.createdAt).toLocaleString()} · {r.status}</p>{r.status!=="closed"?<div className="actions">
 <button className="secondary" disabled={!!busy} onClick={()=>void decide("contact",r.id,"in_review")}>Reviewing</button>
 <button className="primary" disabled={!!busy} onClick={()=>void decide("contact",r.id,"closed")}>Close request</button>
 </div>:null}</article>):<p className="small">No contact requests yet.</p>}</section></div>
 </main></>;
}
