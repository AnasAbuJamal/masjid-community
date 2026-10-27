"use client";
import { FormEvent, useState } from "react";
export default function LoginPage(){
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function submit(event:FormEvent){
  event.preventDefault();setBusy(true);setError("");
  try{
   const res=await fetch("/api/v1/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
   const value=await res.json();
   if(!res.ok)throw new Error(value.error?.message||"Could not sign in.");
   if(!["admin","staff","finance"].includes(value.data.user.role)){setError("This portal is reserved for authorized mosque staff.");return;}
   window.location.assign(value.data.user.role==="finance"?"/admin/finance":"/admin");
  }catch(e){setError(e instanceof Error?e.message:"Network unavailable.");}
  finally{setBusy(false);}
 }
 return <main className="auth-shell"><section className="panel narrow">
  <div className="brand"><span className="mark">✧</span><span>Masjid Community</span></div>
  <div className="section"><p className="eyebrow">AZURE SANCTUARY · STAFF</p><h1>Welcome back.</h1><p className="small">Your community, thoughtfully connected. Sign in with your authorized staff account.</p></div>
  <form className="form" onSubmit={submit}>
   <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></div>
   <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></div>
   {error&&<p role="alert" className="error">{error}</p>}
   <button className="primary" type="submit" disabled={busy}>{busy?"Signing in…":"Sign in to portal"}</button>
  </form>
  <p className="small section">Guest worship information is available in the community mobile app. No sample schedule or payment data is presented as real.</p>
 </section></main>;
}
