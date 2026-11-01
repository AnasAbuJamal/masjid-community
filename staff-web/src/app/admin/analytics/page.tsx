"use client";
import {useCallback,useEffect,useState} from "react";
type Activity={eventId:string;title:string;endAt:string;confirmedBand:string;arrivedBand:string|null};
type Data={organization:{name:string};minimumGroup:number;events:Activity[];policy:string};
export default function PrivateAnalytics(){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 const refresh=useCallback(async()=>{
  setData(null);setLoading(true);setError("");
  try{
   const response=await fetch("/api/v1/admin/analytics",{cache:"no-store"});
   const body=await response.json();
   if(!response.ok)throw new Error(body.error?.message||"Analytics access denied.");
   setData(body.data);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load privacy-preserving analytics.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 return <><header className="masthead"><span className="brand">Mosque · private event analytics</span>
  <a className="secondary" href="/admin">Control center</a></header>
  <main className="container">
   <section className="hero"><p className="eyebrow">F-049 · CONSENT-ONLY PILOT</p>
    <h1>Gathering trends without individual tracking.</h1>
    <p>These broad participation ranges count only people who actively opted into this mosque's analytics. They are not attendance evidence, financial reporting or individual engagement scores.</p>
   </section>
   {error?<p className="error" role="alert">{error}</p>:null}
   {loading?<section className="panel"><p>Loading privacy-protected figures…</p></section>:null}
   {data?<><section className="panel"><h2>{data.organization.name}</h2>
    <p>{data.policy}</p>
    <p className="small">Suppression threshold: {data.minimumGroup} consenting members. A blank arrival band means the group is too small to display, not zero arrivals.</p>
    <button className="secondary" onClick={()=>void refresh()} disabled={loading}>Refresh</button>
   </section>
   <section className="panel"><h2>Completed published gatherings</h2>
    {data.events.length?<div style={{overflowX:"auto"}}><table><thead><tr>
     <th>Published gathering</th><th>Completed</th><th>Confirmed opt-in group</th><th>Recorded arrivals</th>
    </tr></thead><tbody>
     {data.events.map(e=><tr key={e.eventId}><td>{e.title}</td>
      <td>{new Date(e.endAt).toLocaleDateString()}</td><td>{e.confirmedBand}</td>
      <td>{e.arrivedBand||"Suppressed (<10)"}</td></tr>)}
    </tbody></table></div>:
    <p>No gathering has met the minimum consenting-group threshold. This does not mean no one attended.</p>}
   </section></>:null}
  </main></>;
}
