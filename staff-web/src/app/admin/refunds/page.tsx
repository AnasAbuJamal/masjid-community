"use client";
import {useCallback,useEffect,useState} from "react";
type Eligible={id:string;sourceKind:"donation"|"tuition";title:string;amountMinor:number;currency:string};
type Request={id:string;sourceKind:string;sourceId:string;reason:string;amountMinor:number;currency:string;status:string;
 requestedById:string;createdAt:string;requester:{firstName:string;lastName:string}};
type Data={requests:Request[];eligible:Eligible[];policy:string};
export default function Refunds(){
 const [data,setData]=useState<Data|null>(null),[source,setSource]=useState(""),[reason,setReason]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const [actorId,setActorId]=useState("");
 const reload=useCallback(async()=>{
  try{const [res,session]=await Promise.all([fetch("/api/v1/admin/refunds",{cache:"no-store"}),fetch("/api/v1/auth/me",{cache:"no-store"})]);
   const [result,user]=await Promise.all([res.json(),session.json()]);
   if(!res.ok)throw new Error(result.error?.message||"Finance access required.");
   setData(result.data);setActorId(user.data?.id||"");setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load refunds.");}
 },[]);
 useEffect(()=>{void reload()},[reload]);
 const current=data?.eligible.find(x=>x.sourceKind+":"+x.id===source);
 const money=(minor:number,currency:string)=>(minor/100).toLocaleString("en-US",{style:"currency",currency:currency.toUpperCase()});
 async function submit(payload:Record<string,unknown>){
  setBusy(true);setError("");setNotice("");
  try{const response=await fetch("/api/v1/admin/refunds",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await response.json();if(!response.ok)throw new Error(data.error?.message||"Refund request failed.");
   setNotice(data.data.message||"Refund request updated. The payment status is not final until confirmed by the provider.");
   setSource("");setReason("");await reload();
  }catch(e){setError(e instanceof Error?e.message:"Unable to process refund.");}
  finally{setBusy(false);}
 }
 return <><header className="masthead"><div className="brand"><span className="mark">✧</span>Refund control center</div><a href="/admin/finance" className="secondary">Verified payments</a></header>
 <main className="container"><div className="hero"><p className="eyebrow">FINANCE · DUAL APPROVAL</p><h1>Money handled with care.</h1>
 <p>Every refund is reviewed by someone other than the requester. Completion is reported only after a verified provider callback.</p></div>
 {error?<p role="alert" className="error">{error}</p>:null}{notice?<p role="status" className="notice">{notice}</p>:null}
 {data?<p className="notice">{data.policy}</p>:null}
 <div className="split section"><section className="panel"><h2>Request a full refund</h2>
 <div className="form"><div className="field"><label htmlFor="payment">Verified charge</label><select id="payment" value={source} onChange={e=>setSource(e.target.value)}>
 <option value="">Choose a payment</option>{data?.eligible.map(x=><option key={x.sourceKind+":"+x.id} value={x.sourceKind+":"+x.id}>{x.sourceKind} · {x.title} · {money(x.amountMinor,x.currency)} · {x.id}</option>)}</select></div>
 {current?<p className="notice">Full refund amount: {money(current.amountMinor,current.currency)}</p>:null}
 <div className="field"><label htmlFor="reason">Refund justification (required)</label><textarea id="reason" value={reason} onChange={e=>setReason(e.target.value)}/></div>
 <button className="primary" disabled={busy||!current||reason.trim().length<10} onClick={()=>current&&void submit({kind:"request",sourceKind:current.sourceKind,sourceId:current.id,reason})}>Submit for independent approval</button></div></section>
 <section className="panel"><h2>Refund requests</h2>{data?.requests.length?data.requests.map(r=><article className="tile section" key={r.id}><strong style={{fontSize:18}}>{r.sourceKind} · {money(r.amountMinor,r.currency)}</strong>
 <p className="small">{r.sourceId}</p><p>{r.reason}</p>
 <p className="small">Submitted by {r.requester.firstName} {r.requester.lastName} · {new Date(r.createdAt).toLocaleString()}</p>
 <span className="pill">{r.status}</span>
 {["requested","failed"].includes(r.status)&&r.requestedById!==actorId?<div className="actions section">
 <button className="primary" disabled={busy} onClick={()=>void submit({kind:"review",requestId:r.id,decision:"approve"})}>Authorize provider refund</button>
 {r.status==="requested"?<button className="secondary" disabled={busy} onClick={()=>void submit({kind:"review",requestId:r.id,decision:"reject"})}>Reject request</button>:null}</div>:null}
 </article>):<p className="small">No refund requests have been submitted.</p>}</section></div></main></>;
}
