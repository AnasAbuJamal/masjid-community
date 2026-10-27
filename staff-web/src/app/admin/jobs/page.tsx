"use client";
import {useCallback,useEffect,useState} from "react";
type Application={id:string;status:string;coverLetter:string;reviewedAt:string|null;user:{firstName:string;lastName:string;email:string}};
type Job={id:string;title:string;company:string;status:string;applications:Application[]};
export default function JobReview(){
 const [jobs,setJobs]=useState<Job[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const refresh=useCallback(async()=>{
  try{const r=await fetch("/api/v1/admin/jobs",{cache:"no-store"});const j=await r.json();
   if(!r.ok)throw new Error(j.error?.message||"Administrator access required.");setJobs(j.data.jobs);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load job applications.");}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 async function decide(applicationId:string,status:"approved"|"declined"){
  setBusy(true);setError("");setNotice("");
  try{const r=await fetch("/api/v1/admin/jobs",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationId,status})});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Decision unsuccessful.");
   setNotice("Decision saved and applicant notified.");await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to review application.");}finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand"><span className="mark">✧</span>Job applications</span><a href="/admin" className="secondary">Control center</a></header>
 <main className="container"><div className="hero"><p className="eyebrow">COMMUNITY · OPPORTUNITIES</p><h1>People and opportunity.</h1>
 <p>Review applications for published opportunities. Cover letters remain private to authorized administrators.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}{notice?<p className="notice" role="status">{notice}</p>:null}
 <div className="grid">{jobs.map(job=><section key={job.id} className="panel"><h2>{job.title}</h2><p className="small">{job.company} · {job.status} · {job.applications.length} applications</p>
 {job.applications.map(app=><article key={app.id} className="section tile"><strong style={{fontSize:18}}>{app.user.firstName} {app.user.lastName}</strong>
 <p className="small">{app.user.email} · {app.status}</p><p>{app.coverLetter}</p>{app.status==="submitted"?<div className="actions">
 <button className="primary" disabled={busy} onClick={()=>void decide(app.id,"approved")}>Move forward</button>
 <button className="secondary" disabled={busy} onClick={()=>void decide(app.id,"declined")}>Decline</button></div>:null}</article>)}
 {!job.applications.length?<p className="small">No applications yet.</p>:null}</section>)}</div>
 {!jobs.length?<div className="panel">No jobs have been posted yet. Use Create & Publish to add one.</div>:null}</main></>;
}
