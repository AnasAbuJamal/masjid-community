"use client";
import {useCallback,useEffect,useState} from "react";
type CaseMeta={id:string;reference:string;status:"submitted"|"in_review"|"closed";createdAt:string};
type Access={id:string;caseId:string;assigneeId:string;proposedById:string;approvedById:string|null;status:string;expiresAt:string;assignee:{firstName:string;lastName:string}};
type Coordinator={id:string;firstName:string;lastName:string};
type Desk={requests:CaseMeta[];access:Access[];coordinators:Coordinator[];viewerId:string;policy:string};
type PrivateCase={reference:string;status:string;createdAt:string;message:string;policy:string};

export default function ConfidentialCareDesk(){
 const [data,setData]=useState<Desk|null>(null),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [selected,setSelected]=useState(""),[assignee,setAssignee]=useState(""),[purpose,setPurpose]=useState("");
 const [reason,setReason]=useState(""),[privateCase,setPrivateCase]=useState<PrivateCase|null>(null);
 const [busy,setBusy]=useState(false);
 const reload=useCallback(async()=>{
  setPrivateCase(null);
  try{
   const r=await fetch("/api/v1/care/desk",{cache:"no-store"});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Restricted desk unavailable.");
   setData(j.data);setError("");
  }catch(e){setData(null);setError(e instanceof Error?e.message:"You may not access confidential cases.");}
 },[]);
 useEffect(()=>{void reload()},[reload]);
 const current=data?.requests.find(c=>c.id===selected);
 const access=data?.access.filter(a=>a.caseId===selected)||[];
 const ownAccess=access.some(a=>a.assigneeId===data?.viewerId&&a.status==="approved"&&new Date(a.expiresAt)>new Date());
 async function action(endpoint:"desk"|"case",body:Record<string,unknown>){
  if(busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/v1/care/"+endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Confidential case operation failed.");
   setNotice(endpoint==="desk"?"Permission proposal/decision was securely recorded.":"Case status updated. Any closed-case access has been revoked.");
   setReason("");setPurpose("");await reload();
  }catch(e){setPrivateCase(null);setError(e instanceof Error?e.message:"Operation denied.");}
  finally{setBusy(false);}
 }
 async function reveal(){
  if(!selected||busy)return;
  setBusy(true);setPrivateCase(null);setError("");
  try{
   const r=await fetch("/api/v1/care/case?caseId="+encodeURIComponent(selected),{cache:"no-store"});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Case text unavailable.");
   setPrivateCase(j.data);
  }catch(e){setError(e instanceof Error?e.message:"You are not authorized to view this case.");}
  finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand">Confidential care desk</span>
 <div className="actions"><a href="/staff" className="secondary">Staff home</a>
 <a href="/mfa" className="secondary">Verify authenticator</a>
 <button className="secondary" disabled={busy} onClick={()=>void reload()}>Refresh & clear private text</button></div></header>
 <main className="container"><div className="hero">
 <p className="eyebrow">CARE · RESTRICTED CASE MANAGEMENT</p>
 <h1>Human support, protected by design.</h1>
 <p>Requires a current delegated care capability and verified session MFA. This queue contains references and statuses only. Each case's confidential narrative requires a separate proposal and approval by distinct coordinators. An administrator has no implicit access.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}
 {notice?<p className="notice" role="status">{notice}</p>:null}
 {!data?<section className="panel"><p>Restricted case access not available. Verify your authenticator or contact the organization access steward.</p></section>:
 <><section className="panel"><h2>Restricted case references</h2>
 <p className="small">{data.policy} The full message is never shown in the queue, email, or account timeline.</p>
 <div className="field"><label htmlFor="care-case-id">Case reference</label>
 <select id="care-case-id" value={selected} onChange={e=>{setSelected(e.target.value);setPrivateCase(null);setError("");}}>
 <option value="">Choose a case reference</option>{data.requests.map(c=><option key={c.id} value={c.id}>{c.reference} — {c.status} · {new Date(c.createdAt).toLocaleString()}</option>)}
 </select></div>
 {!data.requests.length?<p>No cases in the current organization's restricted desk.</p>:null}</section>
 {current?<><section className="panel"><h2>Request scoped access</h2>
 <p>Case: <strong>{current.reference}</strong>. Only another MFA-enabled, active care coordinator may be assigned. The proposal expires in 24 hours; approved access expires in seven days.</p>
 <div className="field"><label htmlFor="care-assignee">Proposed assignee</label><select id="care-assignee" value={assignee} onChange={e=>setAssignee(e.target.value)}>
 <option value="">Choose another coordinator</option>
 {data.coordinators.filter(c=>c.id!==data.viewerId).map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</select></div>
 <div className="field"><label htmlFor="care-purpose">Assignment purpose (no confidential narrative)</label>
 <textarea id="care-purpose" maxLength={280} value={purpose} onChange={e=>setPurpose(e.target.value)}/></div>
 <button className="primary" disabled={busy||!assignee||purpose.trim().length<15||current.status==="closed"}
 onClick={()=>void action("desk",{action:"propose-access",caseId:selected,assigneeId:assignee,purpose})}>Request assignment review</button>
 </section>
 <section className="panel"><h2>Two-person approval log</h2>
 {access.map(a=><div className="section" key={a.id}>
 <strong>{a.assignee.firstName} {a.assignee.lastName}</strong>
 <p className="small">{a.status} · Expires {new Date(a.expiresAt).toLocaleString()}</p>
 {a.status==="proposed"&&a.proposedById!==data.viewerId&&a.assigneeId!==data.viewerId?
 <button className="primary" disabled={busy||current.status==="closed"||new Date(a.expiresAt)<=new Date()}
 onClick={()=>void action("desk",{action:"approve-access",accessId:a.id})}>Approve a different coordinator's assignment</button>:null}
 {a.status==="approved"?
 <button className="secondary" disabled={busy||reason.trim().length<10}
 onClick={()=>void action("desk",{action:"revoke-access",accessId:a.id,reason})}>Revoke active case access</button>:null}
 </div>)}
 <div className="field"><label htmlFor="care-revoke-reason">Reason for revocation or case outcome (minimum 10 characters, no sensitive detail)</label>
 <textarea id="care-revoke-reason" maxLength={240} value={reason} onChange={e=>setReason(e.target.value)}/></div>
 </section>
 <section className="panel"><h2>Assigned case workspace</h2>
 <p>Only the named, approved and currently authorized assignee can reveal this narrative. Reading is audited. Clear the page after use; do not copy private details into routine email or push notifications.</p>
 <button className="primary" disabled={busy||!ownAccess||current.status==="closed"} onClick={()=>void reveal()}>Open authorized case</button>
 {privateCase?<div className="section"><p className="eyebrow">CONFIDENTIAL — DO NOT SHARE</p>
 <p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{privateCase.message}</p>
 <p className="small">{privateCase.policy}</p>
 <button className="secondary" onClick={()=>setPrivateCase(null)}>Close private view</button></div>:null}
 {ownAccess&&current.status!=="closed"?<div className="section"><h3>Record next step</h3>
 <p>Changing the case state never sends its message through the ordinary notification system.</p>
 <div className="actions">
 <button className="secondary" disabled={busy||reason.trim().length<10||current.status==="in_review"}
 onClick={()=>void action("case",{caseId:selected,status:"in_review",reason})}>Human review started</button>
 <button className="secondary" disabled={busy||reason.trim().length<10}
 onClick={()=>void action("case",{caseId:selected,status:"closed",reason})}>Close case and revoke case access</button>
 </div></div>:null}
 </section></>:null}</>}
 <footer className="footer">Human safety: this is not an emergency response service. Staff must follow the organization's approved care and escalation protocol. Case content is not included in public/leader dashboards.</footer></main></>;
}
