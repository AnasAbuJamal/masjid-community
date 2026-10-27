"use client";
import {useCallback,useEffect,useState} from "react";
type Budget={id:string;category:string;periodMonth:string;amountMinor:number;currency:string;published:boolean};
type Expense={id:string;category:string;description:string;amountMinor:number;currency:string;status:string;submittedById:string;submitter:{firstName:string;lastName:string}};
type Data={budgets:Budget[];expenses:Expense[];actorId:string;role:string;caution:string};
export default function FinanceManage(){
 const [data,setData]=useState<Data|null>(null),[kind,setKind]=useState<"budget"|"expense">("budget"),[fields,setFields]=useState<Record<string,string>>({}),[published,setPublished]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{try{const r=await fetch("/api/v1/admin/finance/manage");const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Access denied.");setData(j.data);setError("");}catch(e){setError(e instanceof Error?e.message:"Unable to load finance data.");}},[]);
 useEffect(()=>{void load()},[load]);
 const set=(key:string,value:string)=>setFields(f=>({...f,[key]:value}));
 async function send(payload:Record<string,unknown>){
  setBusy(true);setError("");setNotice("");
  try{const r=await fetch("/api/v1/admin/finance/manage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Operation rejected.");
   setNotice("Finance record saved.");setFields({});setPublished(false);await load();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save.");}finally{setBusy(false);}
 }
 async function save(){
  const value=Math.round(Number(fields.amount)*100);
  if(!Number.isFinite(value)||value<1){setError("Enter a valid positive amount.");return;}
  try{
   const payload=kind==="budget"?{kind,category:fields.category,periodMonth:fields.periodMonth,amountMinor:value,published}
    :{kind,category:fields.category,description:fields.description,amountMinor:value,incurredOn:new Date(fields.incurredOn).toISOString()};
   await send(payload);
  }catch{setError("Please enter valid dates and amounts.");}
 }
 const money=(v:number,currency:string)=> (v/100).toLocaleString("en-US",{style:"currency",currency:currency.toUpperCase()});
 return <><header className="masthead"><span className="brand"><span className="mark">✧</span>Finance operations</span><a className="secondary" href="/admin/finance">Verified donations</a></header>
 <main className="container"><div className="hero"><p className="eyebrow">FINANCE · MAKER/CHECKER</p><h1>Accountability at every step.</h1><p>One person submits an expense; another authorized person approves or rejects it.</p></div>
 {error?<p role="alert" className="error">{error}</p>:null}{notice?<p role="status" className="notice">{notice}</p>:null}
 {data?<p className="notice">{data.caution}</p>:null}
 <div className="split section"><section className="panel"><div className="tabs"><button className={kind==="budget"?"primary":"secondary"} onClick={()=>{setKind("budget");setFields({})}}>New budget</button><button className={kind==="expense"?"primary":"secondary"} onClick={()=>{setKind("expense");setFields({})}}>New expense</button></div>
 <div className="form"><div className="field"><label htmlFor="category">Category</label><input id="category" value={fields.category||""} onChange={e=>set("category",e.target.value)}/></div>
 {kind==="budget"?<><div className="field"><label htmlFor="periodMonth">Budget month (YYYY-MM)</label><input id="periodMonth" type="month" value={fields.periodMonth||""} onChange={e=>set("periodMonth",e.target.value)}/></div>
 {data?.role==="admin"?<label><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/> Publish this allocation publicly</label>:null}</>:
 <><div className="field"><label htmlFor="description">Description</label><textarea id="description" value={fields.description||""} onChange={e=>set("description",e.target.value)}/></div>
 <div className="field"><label htmlFor="incurredOn">Date incurred</label><input id="incurredOn" type="datetime-local" value={fields.incurredOn||""} onChange={e=>set("incurredOn",e.target.value)}/></div></>}
 <div className="field"><label htmlFor="amount">Amount (USD)</label><input id="amount" type="number" step=".01" min=".01" value={fields.amount||""} onChange={e=>set("amount",e.target.value)}/></div>
 <button className="primary" disabled={busy||!data||!fields.category||!fields.amount||(kind==="budget"?!fields.periodMonth:!fields.description||!fields.incurredOn)} onClick={()=>void save()}>{busy?"Saving…":"Save "+kind}</button></div></section>
 <section className="panel"><h2>Budget allocations</h2>{data?.budgets.map(x=><p key={x.id} className="small">{x.category} · {x.periodMonth} · {money(x.amountMinor,x.currency)} · {x.published?"Published":"Internal"}</p>)}
 {!data?.budgets.length?<p className="small">No budget allocations recorded.</p>:null}
 <h2 className="section">Expense requests</h2>{data?.expenses.map(x=><div key={x.id} className="tile section"><strong style={{fontSize:18}}>{x.description}</strong><p className="small">{x.category} · {money(x.amountMinor,x.currency)} · {x.status} · By {x.submitter.firstName} {x.submitter.lastName}</p>
 {x.status==="pending"&&data.actorId!==x.submittedById?<div className="actions"><button className="primary" disabled={busy} onClick={()=>void send({kind:"expense-decision",expenseId:x.id,decision:"approved"})}>Approve</button>
 <button className="secondary" disabled={busy} onClick={()=>void send({kind:"expense-decision",expenseId:x.id,decision:"rejected"})}>Reject</button></div>:null}</div>)}
 {!data?.expenses.length?<p className="small">No expense requests.</p>:null}</section></div></main></>;
}
