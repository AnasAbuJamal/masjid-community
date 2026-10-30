"use client";
import {useCallback,useEffect,useState} from "react";
type Capability="worship_publish"|"facilities_manage"|"volunteers_manage"|"community_moderate"|"care_manage";
const choices:{id:Capability;title:string}[]=[
 {id:"worship_publish",title:"Worship publishing"},
 {id:"facilities_manage",title:"Facilities and bookings"},
 {id:"volunteers_manage",title:"Volunteer coordination"},
 {id:"community_moderate",title:"Community moderation"},
 {id:"care_manage",title:"Confidential care case coordinator (MFA, max 30 days)"}];
type Member={id:string;status:string;user:{id:string;email:string;firstName:string;lastName:string;role:string;status:string;verifiedAt:string|null;mfaEnabledAt:string|null};
 grants:{id:string;capability:Capability;expiresAt:string|null;revokedAt:string|null}[]};
type Data={organization:{id:string;name:string};memberships:Member[];policy:string};
export default function Team(){
 const [data,setData]=useState<Data|null>(null),[current,setCurrent]=useState(""),[role,setRole]=useState("member"),[cap,setCap]=useState<Capability>("worship_publish"),[expiry,setExpiry]=useState("");
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[adminId,setAdminId]=useState("");
 const load=useCallback(async()=>{
  try{const [team,auth]=await Promise.all([fetch("/api/v1/admin/team",{cache:"no-store"}),fetch("/api/v1/auth/me",{cache:"no-store"})]);
   const [t,u]=await Promise.all([team.json(),auth.json()]);if(!team.ok)throw new Error(t.error?.message||"Organization administrator access required.");
   setData(t.data);setAdminId(u.data?.id||"");setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load team.");}
 },[]);
 useEffect(()=>{void load()},[load]);
 const member=data?.memberships.find(x=>x.user.id===current);
 async function send(value:Record<string,unknown>){
  setBusy(true);setError("");setNotice("");
  try{const response=await fetch("/api/v1/admin/team",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)});
   const j=await response.json();if(!response.ok)throw new Error(j.error?.message||"Permission change denied.");
   setNotice("Permissions updated and logged. Affected active sessions were revoked.");await load();
  }catch(e){setError(e instanceof Error?e.message:"Cannot update permissions.");}finally{setBusy(false);}
 }
 return <><header className="masthead"><div className="brand"><span className="mark">✧</span>Roles & access</div><div className="actions"><a className="secondary" href="/admin">Control center</a><a className="secondary" href="/admin/integrity-audit">Protected audit</a>
 <a className="secondary" href="/admin/invitations">Invite staff</a></div></header>
 <main className="container"><div className="hero"><p className="eyebrow">ORGANIZATION · ACCOUNTABILITY</p><h1>Give access intentionally.</h1>
 <p>Assign only the permissions each colleague needs. Every grant, revocation and role change is audited and invalidates active sessions.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}{notice?<p className="notice" role="status">{notice}</p>:null}
 {data?<p className="notice">{data.policy}</p>:null}
 <div className="split section"><section className="panel"><h2>Manage an organization member</h2>
 <div className="form"><div className="field"><label htmlFor="person">Verified member</label><select id="person" value={current} onChange={e=>{setCurrent(e.target.value);setExpiry("");setRole(data?.memberships.find(m=>m.user.id===e.target.value)?.user.role||"member")}}>
 <option value="">Choose member…</option>{data?.memberships.filter(x=>x.user.id!==adminId&&x.user.role!=="admin").map(x=><option value={x.user.id} key={x.id}>{x.user.firstName} {x.user.lastName} · {x.user.email} · {x.user.role}</option>)}</select></div>
 {member?<><p className="small">Email {member.user.verifiedAt?"verified":"not verified"} · Membership {member.status}</p>
 <div className="field"><label htmlFor="role">Primary account role</label><select id="role" value={role} onChange={e=>setRole(e.target.value)}>
 {["member","staff","teacher","finance"].map(r=><option key={r} value={r}>{r}</option>)}</select></div>
 <button className="primary" disabled={busy||!member.user.verifiedAt||role===member.user.role} onClick={()=>void send({kind:"role",userId:current,role})}>Save role & revoke old sessions</button>
 <div className="actions"><button className="secondary" disabled={busy||member.status==="suspended"} onClick={()=>void send({kind:"membership",userId:current,status:"suspended"})}>Suspend membership</button>
 <button className="secondary" disabled={busy||member.status==="active"} onClick={()=>void send({kind:"membership",userId:current,status:"active"})}>Restore membership</button></div>
 {member.user.role==="staff"&&member.status==="active"?<>
 <h3>Delegated staff capabilities</h3><div className="field"><label htmlFor="capability">Capability</label>
 <select id="capability" value={cap} onChange={e=>setCap(e.target.value as Capability)}>{choices.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></div>
 <div className="field"><label htmlFor="expiry">Expiry (optional)</label><input id="expiry" type="datetime-local" value={expiry} onChange={e=>setExpiry(e.target.value)}/></div>
 {cap==="care_manage"?<p className="small">Care case duties require staff MFA setup, a dated grant (maximum 30 days), and separate two-person approval for every case. No administrator receives automatic access to case narratives.</p>:null}
 <button className="primary" disabled={busy||(cap==="care_manage"&&(!member.user.mfaEnabledAt||!expiry))}
 onClick={()=>void send({kind:"grant",userId:current,capability:cap,...(expiry?{expiresAt:new Date(expiry).toISOString()}:{})})}>Grant scoped capability</button>
 {member.grants.filter(g=>!g.revokedAt).map(g=><div className="tile section" key={g.id}><strong style={{fontSize:17}}>{choices.find(x=>x.id===g.capability)?.title||g.capability}</strong>
 <p className="small">{g.expiresAt?"Expires "+new Date(g.expiresAt).toLocaleString():"Organization scope"}</p>
 <button className="secondary" disabled={busy} onClick={()=>void send({kind:"revoke",userId:current,capability:g.capability})}>Revoke</button></div>)}</>:null}</>:null}
 </div></section><section className="panel"><h2>Organization directory</h2>
 {data?.memberships.map(m=><div className="section" key={m.id}><strong>{m.user.firstName} {m.user.lastName}</strong><p className="small">{m.user.email} · {m.user.role} · {m.status}
 {m.user.role==="finance"?(m.user.mfaEnabledAt?" · MFA enabled":" · MFA setup required"):""}</p></div>)}
 {!data?.memberships.length?<p className="small">No organization memberships yet.</p>:null}</section></div></main></>;
}
