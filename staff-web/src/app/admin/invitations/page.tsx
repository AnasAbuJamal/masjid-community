"use client";
import {useCallback,useEffect,useState} from "react";
type Capability="worship_publish"|"facilities_manage"|"volunteers_manage"|"community_moderate";
const choices:{id:Capability;label:string}[]=[
 {id:"worship_publish",label:"Publish verified worship updates"},
 {id:"facilities_manage",label:"Manage facilities"},
 {id:"volunteers_manage",label:"Coordinate service shifts"},
 {id:"community_moderate",label:"Moderate community requests"}
];
type Invitation={id:string;invitedEmail:string;capabilities:Capability[];createdAt:string;expiresAt:string;acceptedAt:string|null;revokedAt:string|null};
type Listing={organization:{name:string};items:Invitation[];deliveryConfigured:boolean;policy:string};
export default function InvitationsPage(){
 const [data,setData]=useState<Listing|null>(null),[email,setEmail]=useState("");
 const [capabilities,setCapabilities]=useState<Capability[]>([]),[expiresHours,setExpiresHours]=useState(24);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const reload=useCallback(async()=>{
  try{
   const res=await fetch("/api/v1/admin/invitations",{cache:"no-store"});
   const body=await res.json();
   if(!res.ok)throw new Error(body.error?.message||"Invitation workspace unavailable.");
   setData(body.data);setError("");
  }catch(e){setData(null);setError(e instanceof Error?e.message:"Invitation workspace unavailable.");}
 },[]);
 useEffect(()=>{void reload();},[reload]);
 async function submit(input:Record<string,unknown>){
  if(busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/v1/admin/invitations",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error?.message||"Invitation was not saved.");
   setNotice(input.action==="issue"?
    "Invitation issued for private email delivery. This alone grants no staff authority. The recipient must verify their address, enroll MFA, and accept explicitly.":
    "Pending invitation revoked. Its earlier link can no longer be accepted.");
   if(input.action==="issue"){setEmail("");setCapabilities([]);}
   await reload();
  }catch(e){setError(e instanceof Error?e.message:"Invitation operation failed.");}
  finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand">Staff invitations</span>
 <div className="actions"><a href="/admin/team" className="secondary">Roles & access</a>
 <a href="/admin" className="secondary">Control center</a></div></header>
 <main className="container">
 <section className="hero"><p className="eyebrow">IDENTITY · EXPIRING INVITATIONS</p><h1>Invite a colleague deliberately.</h1>
 <p>Invitations do not create staff access. They are restricted to one mosque, delivered to the invited email, expire within 72 hours and require verified identity, current-session MFA and explicit acceptance. New access lasts 14 days, then needs renewal.</p></section>
 {error?<p className="error" role="alert">{error}</p>:null}
 {notice?<p className="notice" role="status">{notice}</p>:null}
 <section className="panel"><h2>Create staff invitation</h2>
 {data?<p className="small">{data.organization.name} · {data.policy}</p>:null}
 {data&&!data.deliveryConfigured?<p className="error" role="alert">Email delivery is not configured. Sending invitations is disabled outside synthetic CI tests. Configure a verified sender first.</p>:null}
 <div className="form">
 <div className="field"><label htmlFor="invite-email">Exact verified email address of invitee</label>
 <input id="invite-email" type="email" autoComplete="off" maxLength={254} value={email}
 onChange={e=>setEmail(e.target.value)}/></div>
 <fieldset><legend>Proposed tasks (choose the minimum necessary)</legend>
 {choices.map(choice=><label key={choice.id} style={{display:"block",margin:"10px 0"}}>
 <input type="checkbox" checked={capabilities.includes(choice.id)}
 onChange={e=>setCapabilities(prev=>e.target.checked?[...prev,choice.id]:prev.filter(c=>c!==choice.id))}/>
 {" "+choice.label}</label>)}
 </fieldset>
 <p className="small">Confidential-care capability cannot be invited; it requires separate case-specific safeguards and access reviews.</p>
 <div className="field"><label htmlFor="invite-expire">Link expiry (hours, 1–72)</label>
 <input id="invite-expire" type="number" min={1} max={72} value={expiresHours}
 onChange={e=>setExpiresHours(Number(e.target.value))}/></div>
 <button className="primary" disabled={busy||!data?.deliveryConfigured||!email.includes("@")||!capabilities.length||expiresHours<1||expiresHours>72}
 onClick={()=>void submit({action:"issue",email,capabilities,expiresHours})}>Send a one-time invitation</button></div>
 </section>
 <section className="panel"><h2>Invitation ledger</h2>
 <button className="secondary" onClick={()=>void reload()}>Refresh status</button>
 {data?.items.map(i=>{
  const state=i.acceptedAt?"Accepted":i.revokedAt?"Revoked":new Date(i.expiresAt)<=new Date()?"Expired":"Pending";
  return <div key={i.id} className="section"><strong>{i.invitedEmail}</strong>
  <p className="small">{state} · {i.capabilities.join(", ")} · Expires {new Date(i.expiresAt).toLocaleString()}</p>
  {state==="Pending"?<button className="secondary" disabled={busy}
  onClick={()=>void submit({action:"revoke",id:i.id})}>Revoke unused invitation</button>:null}
  </div>;
 })}
 {!data?.items.length?<p className="small">No staff invitations recorded for this mosque.</p>:null}
 </section>
 <footer className="footer">Never forward an invitation to anyone but its intended recipient. Staff authority is also checked against current membership and revocation on every request.</footer>
 </main></>;
}
