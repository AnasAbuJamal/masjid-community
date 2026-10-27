"use client";
import {useEffect,useState} from "react";
type Payment={id:string;amountMinor:number;currency:string;createdAt:string;anonymous:boolean;campaign:{title:string}};
type Finance={payments:Payment[];totalsMinor:Record<string,number>;caution:string;loaded:number};
export default function FinancePage(){
 const [data,setData]=useState<Finance|null>(null),[error,setError]=useState("");
 useEffect(()=>{let active=true;void fetch("/api/v1/admin/finance",{cache:"no-store"}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Access denied.");if(active)setData(j.data)}).catch(e=>{if(active)setError(String(e.message||e))});return()=>{active=false}},[]);
 return <><header className="masthead"><span className="brand"><span className="mark">✧</span>Verified giving</span><div className="actions"><a href="/admin/finance/manage" className="secondary">Manage budgets & expenses</a><a href="/admin/refunds" className="secondary">Refund controls</a><a href="/admin" className="secondary">Control center</a></div></header>
 <main className="container"><div className="hero"><p className="eyebrow">FINANCE · PROVIDER-VERIFIED</p><h1>Giving with clarity.</h1><p>Completed donation records only; not an accounting ledger.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}
 {!data?<div className="panel">Loading protected donation information…</div>:<>
 <div className="grid">{Object.entries(data.totalsMinor).map(([currency,minor])=><div className="tile" key={currency}><p>Loaded paid donations ({currency.toUpperCase()})</p><strong>{(minor/100).toLocaleString("en-US",{style:"currency",currency:currency.toUpperCase()})}</strong><p>Up to the latest 500 paid records</p></div>)}</div>
 <p className="notice">{data.caution}</p>
 <div className="panel section"><h2>Verified payments</h2><div style={{overflowX:"auto"}}><table className="records"><thead><tr><th>Date</th><th>Campaign</th><th>Amount</th><th>Privacy</th></tr></thead>
 <tbody>{data.payments.map(x=><tr key={x.id}><td>{new Date(x.createdAt).toLocaleDateString()}</td><td>{x.campaign.title}</td><td>{(x.amountMinor/100).toLocaleString("en-US",{style:"currency",currency:x.currency.toUpperCase()})}</td><td>{x.anonymous?"Anonymous publicly":"Private account"}</td></tr>)}</tbody></table></div>
 {!data.payments.length?<p className="small">No verified payments yet.</p>:null}</div>
 </>}</main></>;
}
