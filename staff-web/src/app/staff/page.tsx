"use client";
import {useCallback,useEffect,useState} from "react";
type Capability="worship_publish"|"facilities_manage"|"volunteers_manage"|"community_moderate";
type Data={name:string;organization:string;capabilities:{capability:Capability;expiresAt:string|null}[]};
const workspaces:Record<Capability,{title:string;description:string;href:string}>={
 worship_publish:{title:"Worship calendar",description:"Confirm mosque-approved Jummah, Ramadan and Eid information",href:"/admin/worship"},
 facilities_manage:{title:"Facilities",description:"Review and approve non-conflicting community bookings",href:"/admin/operations"},
 volunteers_manage:{title:"Volunteer coordination",description:"Schedule approved shifts and record check-in",href:"/admin/volunteers"},
 community_moderate:{title:"Community desk",description:"Review proposals and contact requests",href:"/admin/community"},
};
export default function StaffHome(){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState("");
 const reload=useCallback(async()=>{try{const r=await fetch("/api/v1/staff/capabilities",{cache:"no-store"});const j=await r.json();
  if(!r.ok)throw new Error(j.error?.message||"Staff membership required.");setData(j.data);setError("");
 }catch(e){setError(e instanceof Error?e.message:"Unable to load delegated staff access.");}},[]);
 useEffect(()=>{void reload()},[reload]);
 async function logout(){await fetch("/api/v1/auth/logout",{method:"POST"});window.location.assign("/");}
 return <><header className="masthead"><div className="brand"><span className="mark">✧</span>Masjid Community · Staff</div>
 <div className="actions"><button className="secondary" onClick={()=>void reload()}>Refresh</button><button className="secondary" onClick={()=>void logout()}>Sign out</button></div></header>
 <main className="container"><div className="hero"><p className="eyebrow">STAFF · DELEGATED ACCESS</p><h1>Welcome to your workspace.</h1>
 <p>{data?.name||"Authorized staff member"} · {data?.organization||"Community"}</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}
 {!data?<section className="panel">Checking your current permissions…</section>:<div className="grid">
 {data.capabilities.map(({capability,expiresAt})=><a href={workspaces[capability].href} key={capability} className="tile" style={{display:"block"}}>
 <p className="eyebrow">AUTHORIZED WORKSPACE</p><strong style={{fontSize:22}}>{workspaces[capability].title}</strong>
 <p>{workspaces[capability].description}</p>{expiresAt?<p className="small">Grant expires {new Date(expiresAt).toLocaleString()}</p>:null}</a>)}
 <a href="/host/circles" className="tile" style={{display:"block"}}><p className="eyebrow">ASSIGNED GROUPS ONLY</p><strong>Host your circles</strong><p>Review membership requests and publish updates only to approved members.</p></a>
 <a href="/host/check-in" className="tile" style={{display:"block"}}><p className="eyebrow">EVENT-SCOPED ACCESS</p><strong>Gathering check-in</strong><p>Only individually assigned hosts can see confirmed attendees and record arrival. Your permissions are checked again on every request.</p></a>
 {!data.capabilities.length?<div className="panel"><h2>No delegated workspaces yet</h2><p>Ask the organization administrator to assign the minimum permission needed for your duties.</p></div>:null}
 </div>}
 <p className="footer">This list is a convenience; every destination independently checks your current server-side permissions and membership.</p></main></>;
}
