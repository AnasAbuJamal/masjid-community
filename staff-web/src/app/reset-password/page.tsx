"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
function ResetContent(){
 const params=useSearchParams();
 const token=params.get("token");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState(""),[error,setError]=useState("");
 async function submit(event:React.FormEvent){
  event.preventDefault();setBusy(true);setError("");setNotice("");
  try{
   const endpoint=token?"reset-password":"request-password-reset";
   const response=await fetch("/api/v1/auth/"+endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(token?{token,password}:{email})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error?.message||"Unable to complete request.");
   setNotice(data.data.message||"Request received.");setPassword("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to connect.");}
  finally{setBusy(false);}
 }
 return <main className="auth-shell"><section className="panel narrow"><div className="brand"><span className="mark">✧</span> Masjid Community</div>
 <div className="section"><p className="eyebrow">SECURE ACCOUNT RECOVERY</p><h1>{token?"Choose a new password.":"Forgot your password?"}</h1>
 <p className="small">{token?"This link can be used only once and expires after 30 minutes.":"If your email has an account, we will send a secure reset link when email delivery is configured."}</p></div>
 <form onSubmit={submit} className="form">
 <div className="field"><label htmlFor="credential">{token?"New password (12+ characters)":"Account email"}</label>
 <input id="credential" type={token?"password":"email"} autoComplete={token?"new-password":"email"} required minLength={token?12:undefined}
 value={token?password:email} onChange={e=>token?setPassword(e.target.value):setEmail(e.target.value)}/></div>
 {notice?<p role="status" className="notice">{notice}</p>:null}{error?<p role="alert" className="error">{error}</p>:null}
 <button className="primary" disabled={busy}>{busy?"Processing…":token?"Reset password":"Send reset link"}</button></form><a href="/">Back to sign in</a>
 </section></main>;
}
export default function ResetPassword(){return <Suspense fallback={<main className="auth-shell">Loading…</main>}><ResetContent/></Suspense>;}
