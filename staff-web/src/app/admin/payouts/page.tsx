"use client";
import {useCallback,useEffect,useState} from "react";
type Note={id:string;body:string;createdAt:string;author:{firstName:string;lastName:string}};
type Payout={id:string;providerPayoutId:string;amountMinor:number;currency:string;state:string;arrivalAt:string|null;failureCode:string|null;observedAt:string;updatedAt:string;notes:Note[]};
type Result={payouts:Payout[];organization:{name:string};complete:boolean;reconciliationReady:false;warning:string;policy:string};
export default function ProviderPayouts(){
 const [data,setData]=useState<Result|null>(null),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [drafts,setDrafts]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false);
 const reload=useCallback(async()=>{
  try{
   const r=await fetch("/api/v1/admin/payouts",{cache:"no-store"});
   const v=await r.json();if(!r.ok)throw new Error(v.error?.message||"Authorized finance access required.");
   setData(v.data);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Payout register unavailable.");}
 },[]);
 useEffect(()=>{void reload()},[reload]);
 async function note(payoutId:string){
  if(busy)return;const body=drafts[payoutId]||"";
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/v1/admin/payouts",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({payoutId,body})});
   const v=await r.json();if(!r.ok)throw new Error(v.error?.message||"Unable to record review note.");
   setDrafts(old=>({...old,[payoutId]:""}));
   setNotice("Review note recorded without changing reconciliation status.");
   await reload();
  }catch(e){setError(e instanceof Error?e.message:"Review note was not saved.");}
  finally{setBusy(false);}
 }
 const money=(v:number,currency:string)=>new Intl.NumberFormat("en-US",{
  style:"currency",currency:currency.toUpperCase()
 }).format(v/100);
 return <><header className="masthead"><span className="brand">Provider payout register</span>
 <div className="actions"><a href="/admin/finance" className="secondary">Verified contributions</a>
 <a href="/admin/refunds" className="secondary">Refund controls</a><a href="/admin/finance/manage" className="secondary">Budget & expenses</a></div></header>
 <main className="container"><div className="hero"><p className="eyebrow">TREASURY · PROVIDER EVIDENCE</p>
 <h1>Track what Stripe reports—not what we wish had settled.</h1>
 <p>Only signed Stripe payout notifications are recorded here. A report of `paid` is not a matched settlement or bank balance; provider fees, adjustments, disputes and bank statements still need independent reconciliation.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}
 {notice?<p className="notice" role="status">{notice}</p>:null}
 {data?<><section className="panel"><h2>Reconciliation remains outstanding</h2>
 <p>{data.warning}</p><p className="small">{data.policy}</p>
 {!data.complete?<p role="alert">More than 100 payout records may exist; this view is incomplete.</p>:null}</section>
 <section className="panel"><h2>Provider reports</h2>
 {data.payouts.map(p=><div key={p.id} className="section">
 <h3>{p.providerPayoutId}</h3>
 <p><strong>{money(p.amountMinor,p.currency)}</strong> · Provider state: <strong>{p.state}</strong> · Reconciliation: <strong>NOT MATCHED</strong></p>
 <p className="small">Received {new Date(p.observedAt).toLocaleString()} · Last observed {new Date(p.updatedAt).toLocaleString()}
 {p.arrivalAt?" · Provider estimated arrival "+new Date(p.arrivalAt).toLocaleDateString():""}</p>
 {p.failureCode?<p className="error" role="alert">Provider failure: {p.failureCode}. Investigate with your payment provider.</p>:null}
 <div className="field"><label htmlFor={"payout-"+p.id}>Investigation note (15–500 characters; no donor names or confidential data)</label>
 <textarea id={"payout-"+p.id} maxLength={500} value={drafts[p.id]||""}
 onChange={e=>setDrafts(old=>({...old,[p.id]:e.target.value}))}/></div>
 <button className="secondary" disabled={busy||(drafts[p.id]||"").trim().length<15}
 onClick={()=>void note(p.id)}>Add auditable note</button>
 {p.notes.map(n=><div key={n.id} className="tile">
 <p>{n.body}</p><p className="small">{n.author.firstName} {n.author.lastName} · {new Date(n.createdAt).toLocaleString()}</p>
 </div>)}
 </div>)}
 {!data.payouts.length?<p>No signed provider payout events have been received by this database.</p>:null}
 </section></>:<section className="panel"><p>Loading private payout reports…</p></section>}
 <footer className="footer">There is no automatic matching or clearing-account journal here. Reconciliation is a release gate for real-money operations.</footer>
 </main></>;
}
