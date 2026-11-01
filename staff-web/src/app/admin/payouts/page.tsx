"use client";
import {useCallback,useEffect,useState} from "react";
import {PAYOUT_EXCEPTION_REASONS,type PayoutExceptionCode} from "@/lib/payout-exceptions";
type Note={id:string;body:string;createdAt:string;author:{firstName:string;lastName:string}};
type Payout={id:string;providerPayoutId:string;amountMinor:number;currency:string;state:string;arrivalAt:string|null;failureCode:string|null;observedAt:string;updatedAt:string;notes:Note[];notesComplete:boolean};
type Result={payouts:Payout[];organization:{name:string};complete:boolean;nextRegisterCursor:string|null;notesPageSize:number;reconciliationReady:false;warning:string;policy:string};
type HistoryPage={payoutId:string;notes:Note[];complete:boolean;nextCursor:string|null;reconciliationReady:false};
type LoadedHistory={notes:Note[];complete:boolean;nextCursor:string|null};
export default function ProviderPayouts(){
 const [data,setData]=useState<Result|null>(null),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [drafts,setDrafts]=useState<Record<string,PayoutExceptionCode|"" >>({}),[busy,setBusy]=useState(false);
 const [older,setOlder]=useState<Record<string,LoadedHistory>>({});
 const [historyLoading,setHistoryLoading]=useState<string|null>(null);
 const [registerLoading,setRegisterLoading]=useState(false);
 const reload=useCallback(async()=>{
  // Never retain a previous finance register while revalidating access.
  setData(null);setOlder({});setHistoryLoading(null);setError("");
  try{
   const r=await fetch("/api/v1/admin/payouts",{cache:"no-store"});
   const v=await r.json();if(!r.ok)throw new Error(v.error?.message||"Authorized finance access required.");
   setData(v.data);setError("");
  }catch(e){setData(null);setError(e instanceof Error?e.message:"Payout register unavailable.");}
 },[]);
 useEffect(()=>{void reload()},[reload]);
 async function note(payoutId:string){
  if(busy)return;const reasonCode=drafts[payoutId];
  if(!reasonCode)return;
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/v1/admin/payouts",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({payoutId,reasonCode})});
   const v=await r.json();if(!r.ok)throw new Error(v.error?.message||"Unable to record review note.");
   setDrafts(old=>({...old,[payoutId]:""}));
   setNotice("Review note recorded without changing reconciliation status.");
   await reload();
  }catch(e){setError(e instanceof Error?e.message:"Review note was not saved.");}
  finally{setBusy(false);}
 }
 async function loadOlder(p:Payout){
  if(historyLoading||busy)return;
  const previous=older[p.id];
  if(previous?.complete||(!previous&&p.notesComplete))return;
  const cursor=previous?previous.nextCursor:p.notes[p.notes.length-1]?.id;
  if(!cursor)return;
  setHistoryLoading(p.id);setError("");
  try{
   const r=await fetch("/api/v1/admin/payouts?payoutId="+encodeURIComponent(p.id)+
    "&cursor="+encodeURIComponent(cursor),{cache:"no-store"});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error?.message||"Unable to retrieve historical notes.");
   const page=j.data as HistoryPage;
   if(page.payoutId!==p.id||page.reconciliationReady!==false)
    throw new Error("Unexpected finance history response.");
   setOlder(old=>({
    ...old,[p.id]:{notes:[...(old[p.id]?.notes||[]),...page.notes],
     complete:page.complete,nextCursor:page.nextCursor}
   }));
  }catch(e){setError(e instanceof Error?e.message:"Unable to load older notes.");}
  finally{setHistoryLoading(null);}
 }
 async function loadMorePayouts(){
  if(registerLoading||busy||historyLoading||!data||data.complete||!data.nextRegisterCursor)return;
  setRegisterLoading(true);setError("");
  try{
   const r=await fetch("/api/v1/admin/payouts?registerCursor="+
    encodeURIComponent(data.nextRegisterCursor),{cache:"no-store"});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error?.message||"Unable to load older payout records.");
   const page=j.data as Result;
   if(page.reconciliationReady!==false||page.organization.name!==data.organization.name)
    throw new Error("Unexpected payout register response.");
   setData(old=>old?{...old,payouts:[...old.payouts,...page.payouts.filter(p=>
    !old.payouts.some(existing=>existing.id===p.id))],
    complete:page.complete,nextRegisterCursor:page.nextRegisterCursor}:old);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load older payouts.");}
  finally{setRegisterLoading(false);}
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
 {!data.complete?<p role="alert">Older payout records are not yet loaded. This register view is incomplete.</p>:null}</section>
 <section className="panel"><h2>Provider reports</h2>
 {data.payouts.map(p=><div key={p.id} className="section">
 <h3>{p.providerPayoutId}</h3>
 <p><strong>{money(p.amountMinor,p.currency)}</strong> · Provider state: <strong>{p.state}</strong> · Reconciliation: <strong>NOT MATCHED</strong></p>
 <p className="small">Received {new Date(p.observedAt).toLocaleString()} · Last observed {new Date(p.updatedAt).toLocaleString()}
 {p.arrivalAt?" · Provider estimated arrival "+new Date(p.arrivalAt).toLocaleDateString():""}</p>
 {p.failureCode?<p className="error" role="alert">Provider failure: {p.failureCode}. Investigate with your payment provider.</p>:null}
 <div className="field">
 <label htmlFor={"payout-"+p.id}>Unresolved exception category (no free text, personal or bank details)</label>
 <select id={"payout-"+p.id} value={drafts[p.id]||""}
  onChange={e=>setDrafts(old=>({...old,[p.id]:e.target.value as PayoutExceptionCode}))}>
  <option value="">Select an unresolved evidence gap</option>
  {PAYOUT_EXCEPTION_REASONS.map(item=><option key={item.code} value={item.code}>{item.label}</option>)}
 </select>
 <p className="small">Classification is not reconciliation, confirmation of a bank deposit or permission to record confidential information.</p>
 </div>
 <button className="secondary" disabled={busy||!drafts[p.id]}
 onClick={()=>void note(p.id)}>Record unresolved exception</button>
 {[...p.notes,...(older[p.id]?.notes||[])].map(n=><div key={n.id} className="tile">
 <p>{n.body}</p><p className="small">{n.author.firstName} {n.author.lastName} · {new Date(n.createdAt).toLocaleString()}</p>
 </div>)}
 {(older[p.id]?!older[p.id].complete:!p.notesComplete)?<div>
  <p className="error" role="alert">This review history is incomplete. Older private
  investigation notes exist; this is not a complete settlement evidence archive.</p>
  <button className="secondary" disabled={busy||historyLoading!==null}
   onClick={()=>void loadOlder(p)}>
   {historyLoading===p.id?"Loading older notes…":"Load next "+data.notesPageSize+" older investigation notes"}
  </button>
 </div>:null}
 {older[p.id]?.complete?<p className="small" role="status">
 All stored investigation notes for this payout have been loaded.
 This history does not certify a bank deposit or reconciliation.
 </p>:null}
 </div>)}
 {!data.complete?<button className="secondary" disabled={registerLoading||busy||historyLoading!==null}
  onClick={()=>void loadMorePayouts()}>{registerLoading?"Loading older payouts…":"Load next 100 older payouts"}</button>:null}
 {!data.payouts.length?<p>No signed provider payout events have been received by this database.</p>:null}
 </section></>:<section className="panel"><p>Loading private payout reports…</p></section>}
 <footer className="footer">There is no automatic matching or clearing-account journal here. Reconciliation is a release gate for real-money operations.</footer>
 </main></>;
}
