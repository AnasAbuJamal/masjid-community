"use client";
import {useCallback,useEffect,useState} from "react";
type Booking={id:string;startAt:string;endAt:string;status:string;resource:{title:string};user:{firstName:string;lastName:string;email:string}};
export default function Operations(){
 const [rows,setRows]=useState<Booking[]>([]),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState("");
 const reload=useCallback(async()=>{
  try{const r=await fetch("/api/v1/admin/operations",{cache:"no-store"});const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Access denied.");setRows(j.data.bookings);setError("");}
  catch(e){setError(e instanceof Error?e.message:"Unable to load booking requests.");}
 },[]);
 useEffect(()=>{void reload()},[reload]);
 async function decide(id:string,decision:"approved"|"rejected"){
  setBusy(id);setError("");setNotice("");
  try{const r=await fetch("/api/v1/admin/operations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"rental-decision",bookingId:id,decision})});const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Decision failed.");setNotice("Booking "+decision+". Member notified.");await reload();}
  catch(e){setError(e instanceof Error?e.message:"Decision failed.");}finally{setBusy("");}
 }
 return <><header className="masthead"><span className="brand"><span className="mark">✧</span>Facility requests</span><a className="secondary" href="/admin">Control center</a></header>
 <main className="container"><div className="hero"><p className="eyebrow">OPERATIONS · FACILITIES</p><h1>Space for community.</h1><p>Review requests carefully. Overlapping confirmed bookings cannot be approved together.</p></div>
 {error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status" className="notice">{notice}</p>}
 <section className="panel"><h2>Awaiting review ({rows.length})</h2><div style={{overflowX:"auto"}}><table className="records"><thead><tr><th>Resource</th><th>Member</th><th>Time</th><th>Decision</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.resource.title}</td><td>{x.user.firstName} {x.user.lastName}<p className="small">{x.user.email}</p></td><td>{new Date(x.startAt).toLocaleString()} – {new Date(x.endAt).toLocaleString()}</td><td><div className="actions"><button className="primary" disabled={!!busy} onClick={()=>void decide(x.id,"approved")}>Approve</button><button className="secondary" disabled={!!busy} onClick={()=>void decide(x.id,"rejected")}>Reject</button></div></td></tr>)}</tbody></table></div>
 {!rows.length&&<p className="small">No facility requests currently need a decision.</p>}</section></main></>;
}
