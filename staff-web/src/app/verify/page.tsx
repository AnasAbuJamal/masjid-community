"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
function VerifyInner(){
 const params=useSearchParams();
 const [status,setStatus]=useState("Confirm ownership of your email address.");
 const [busy,setBusy]=useState(false);
 async function confirm(){
  setBusy(true);
  try{const response=await fetch("/api/v1/auth/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:params.get("token")})});const data=await response.json();setStatus(response.ok?"Email verified. You can sign in.":data.error?.message||"Link unavailable.");}
  catch{setStatus("Could not verify your email. Try again.");}
  finally{setBusy(false);}
 }
 return <main className="auth-shell"><section className="panel narrow"><p className="eyebrow">MASJID COMMUNITY</p><h1>Email verification</h1><p>{status}</p><button disabled={busy||!params.get("token")} onClick={confirm} className="primary">{busy?"Verifying…":"Confirm email"}</button><a href="/">Back to sign in</a></section></main>;
}

export default function VerifyPage(){return <Suspense fallback={<main className="auth-shell">Loading verification…</main>}><VerifyInner/></Suspense>;}
