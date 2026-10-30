"use client";
import {useCallback,useEffect,useState} from "react";
type Entry={sequence:number;occurredAt:string;requestId:string;action:string;entity:string;outcome:string;actorHint:string;hashPrefix:string};
type Data={organization:{name:string};verification:{state:"verified"|"invalid"|"incomplete";checked:number;failureCode:string|null;lastHash:string|null;hasMore:boolean};records:Entry[];policy:string};
export default function IntegrityAuditDesk(){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const refresh=useCallback(async()=>{
  setLoading(true);setData(null);setError("");
  try{
   const res=await fetch("/api/v1/admin/integrity-audit",{cache:"no-store"});
   const answer=await res.json();
   if(!res.ok)throw new Error(answer.error?.message||"Unable to verify audit chain.");
   setData(answer.data);
  }catch(e){setError(e instanceof Error?e.message:"Sealed review unavailable.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 const state=data?.verification.state;
 return <><header className="masthead"><span className="brand">Protected change audit</span>
 <div className="actions"><a className="secondary" href="/staff">Staff workspace</a>
 <a className="secondary" href="/admin">Control center (administrators only)</a></div></header>
 <main className="container">
  <section className="hero"><p className="eyebrow">IDENTITY · INTEGRITY REVIEW</p>
  <h1>Review high-risk changes by evidence, not assumption.</h1>
  <p>This restricted viewer checks the per-mosque HMAC chain for newly sealed privilege and invitation changes. Existing audit history is not retrospectively cryptographically certified. Independent offsite anchors and approved reviewer governance remain release requirements.</p></section>
  {error?<p className="error" role="alert">{error}</p>:null}
  {loading?<section className="panel"><p>Verifying protected history…</p></section>:null}
  {data?<><section className="panel"><h2>{data.organization.name} · audit chain</h2>
   <p role="status"><strong>{state==="verified"?"Chain verified for checked records":state==="invalid"?"INTEGRITY FAILURE — investigate":"Incomplete verification window"}</strong></p>
   <p>Checked: {data.verification.checked.toLocaleString()} · {data.verification.failureCode||"No detected mismatch"} · Additional rows: {data.verification.hasMore?"Yes":"No"}</p>
   <p className="small">{data.policy}</p>
   <button className="secondary" onClick={()=>void refresh()} disabled={loading}>Verify again</button>
  </section>
  <section className="panel"><h2>Recent protected actions</h2>
   <p className="small">Only reference metadata is shown. Case narratives, invitee emails and full affected identity IDs are excluded.</p>
   <div style={{overflowX:"auto"}}><table><thead><tr><th>Sequence</th><th>Occurred</th><th>Action</th><th>Actor hint</th><th>Request</th><th>Record hash</th></tr></thead>
   <tbody>{data.records.map(x=><tr key={x.sequence}><td>{x.sequence}</td>
    <td>{new Date(x.occurredAt).toLocaleString()}</td><td>{x.action} · {x.outcome}</td>
    <td>…{x.actorHint}</td><td>{x.requestId}</td><td>{x.hashPrefix}…</td></tr>)}</tbody></table></div>
   {!data.records.length?<p>No protected audit changes have been recorded in this mosque yet.</p>:null}
  </section></>:null}
  <footer className="footer">Immutable under ordinary application database operations; an infrastructure administrator who controls the database or secret can still undermine this protection. Escalate any mismatch and preserve independent evidence.</footer>
 </main></>;
}
