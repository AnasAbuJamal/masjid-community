"use client";
import {useCallback,useEffect,useState} from "react";
type Application={id:string;studentFirstName:string;studentLastName:string;notes:string|null;status:string;
 program:{title:string};applicant:{firstName:string;lastName:string;email:string;verifiedAt:string|null};
 reviewAcknowledgedAt:string|null;reviewAcknowledgementVersion:string|null;createdAt:string;decisionReason:string|null};
export default function EnrollmentReview(){
 const [items,setItems]=useState<Application[]>([]),[reason,setReason]=useState<Record<string,string>>({}),[verified,setVerified]=useState<Record<string,boolean>>({}),[busy,setBusy]=useState("");
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const refresh=useCallback(async()=>{try{const r=await fetch("/api/v1/admin/enrollment",{cache:"no-store"});const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Access denied.");setItems(j.data.applications);setError("");}
 catch(e){setError(e instanceof Error?e.message:"Unable to load enrollment applications.");}},[]);
 useEffect(()=>{void refresh()},[refresh]);
 async function decide(id:string,decision:"approved"|"declined"){
  if(busy)return;setBusy(id);setError("");setNotice("");
  try{const res=await fetch("/api/v1/admin/enrollment",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,decision,reason:reason[id]||"",relationshipVerified:!!verified[id]})});
   const j=await res.json();if(!res.ok)throw new Error(j.error?.message||"Unable to review.");
   setNotice("Application "+decision+". "+(decision==="approved"?"Student profile and verified guardian link created.":"No student record created."));await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to review.");}finally{setBusy("");}
 }
 return <><header className="masthead"><span className="brand"><span className="mark">✧</span>Enrollment review</span><a className="secondary" href="/admin/school">School operations</a></header>
 <main className="container"><div className="hero"><p className="eyebrow">SCHOOL · SAFEGUARDING</p><h1>A careful beginning.</h1><p>Review new program applications. Confirm evidence of a legal guardian relationship before approval.</p></div>
 {error?<p role="alert" className="error">{error}</p>:null}{notice?<p role="status" className="notice">{notice}</p>:null}
 <div className="grid">{items.map(a=><article className="panel" key={a.id}>
 <p className="eyebrow">{a.program.title}</p><h2>{a.studentFirstName} {a.studentLastName}</h2>
 <p className="small">Applicant: {a.applicant.firstName} {a.applicant.lastName} · {a.applicant.email}</p>
 <p className="small">Email {a.applicant.verifiedAt?"verified":"NOT verified"} · {new Date(a.createdAt).toLocaleDateString()} · {a.status}</p>
 <p className="small">{a.reviewAcknowledgedAt
  ?"Applicant confirmed review conditions on "+new Date(a.reviewAcknowledgedAt).toLocaleDateString()+" (self-attestation only; not legal-guardian proof)."
  :"Applicant acknowledgement is missing. Approval must remain blocked until the applicant resubmits."}</p>
 {a.notes?<p>{a.notes}</p>:null}
 {a.status==="submitted"?<div className="form">
 <div className="field"><label htmlFor={"reason-"+a.id}>Decision reason or review note (required)</label><textarea id={"reason-"+a.id} value={reason[a.id]||""} onChange={e=>setReason(old=>({...old,[a.id]:e.target.value}))}/></div>
 <label><input type="checkbox" checked={!!verified[a.id]} onChange={e=>setVerified(old=>({...old,[a.id]:e.target.checked}))}/> I have personally checked the legal guardian relationship against school-approved evidence</label>
 <div className="actions"><button className="primary" disabled={!!busy||!a.reviewAcknowledgedAt||!verified[a.id]||!a.applicant.verifiedAt||(reason[a.id]||"").trim().length<5} onClick={()=>void decide(a.id,"approved")}>Approve & link student</button>
 <button className="secondary" disabled={!!busy||(reason[a.id]||"").trim().length<5} onClick={()=>void decide(a.id,"declined")}>Decline</button></div></div>:<p className="small">Decision: {a.decisionReason||"Reviewed"}</p>}</article>)}</div>
 {!items.length&&<div className="panel">No applications have been submitted yet.</div>}</main></>;
}
