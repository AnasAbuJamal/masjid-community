"use client";
import {useCallback,useEffect,useState} from "react";
type Info={role:string;email:string;mfaRequired:boolean;mfaSetupRequired:boolean;isVerified:boolean};
export default function MfaGate(){
 const [user,setUser]=useState<Info|null>(null);
 const [password,setPassword]=useState(""),[secret,setSecret]=useState(""),[code,setCode]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const read=useCallback(async()=>{try{
  const r=await fetch("/api/v1/auth/me",{cache:"no-store"});const v=await r.json();
  if(!v.data){window.location.replace("/");return;}
  setUser(v.data);
  if(!v.data.mfaRequired&&(v.data.role!=="staff"||!v.data.mfaSetupRequired)){window.location.replace(v.data.role==="finance"?"/admin/finance":v.data.role==="staff"?"/staff":"/admin");}
 }catch{setError("Could not check your current sign-in status.");}},[]);
 useEffect(()=>{void read()},[read]);
 async function action(endpoint:string,body:unknown){
  setBusy(true);setError("");setNotice("");
  try{const r=await fetch("/api/v1/auth/"+endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const result=await r.json();if(!r.ok)throw new Error(result.error?.message||"Authenticator request failed.");
   if(endpoint==="mfa-setup"){setSecret(result.data.secret);setNotice("Add the key to your authenticator app. Then enter its current six-digit code.");}
   else{setNotice("MFA verified. Opening your authorized workspace.");await read();}
  }catch(e){setError(e instanceof Error?e.message:"Authenticator request failed.");}
  finally{setBusy(false);}
 }
 return <main className="auth-shell"><section className="panel narrow">
 <div className="brand"><span className="mark">✧</span><span>Masjid Community · Security</span></div>
 <div className="section"><p className="eyebrow">PRIVILEGED ACCESS</p><h1>Protect your community.</h1>
 <p className="small">Administrators and finance officers must use an authenticator. Confidential-care staff must enroll and verify their authenticator too. Codes cannot be reused.</p></div>
 {user?.isVerified===false?<p className="notice">Verify your email address before enrolling in MFA.</p>:null}
 {user?.mfaSetupRequired?<div className="form">
 <div className="field"><label htmlFor="password">Confirm your account password</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></div>
 <button className="secondary" disabled={busy||!password||!user.isVerified} onClick={()=>void action("mfa-setup",{password})}>Generate authenticator key</button>
 {secret?<div className="notice" style={{overflowWrap:"anywhere"}}><p className="small">Keep this private and store it in your authenticator:</p><code>{secret}</code></div>:null}</div>:null}
 <div className="form section"><div className="field"><label htmlFor="otp">Authenticator code (6 digits)</label>
 <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))}/></div>
 <button className="primary" disabled={busy||!user||code.length!==6||!!user.mfaSetupRequired&&!secret} onClick={()=>void action(user?.mfaSetupRequired?"mfa-enable":"mfa-verify",{code})}>{busy?"Checking…":"Continue securely"}</button></div>
 {error?<p className="error" role="alert">{error}</p>:null}{notice?<p className="notice" role="status">{notice}</p>:null}
 <a href="/">Back to sign in</a>
 </section></main>;
}
