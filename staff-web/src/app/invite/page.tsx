"use client";
import {useCallback,useEffect,useState} from "react";
type Preview={organization:{name:string};capabilities:string[];role:"staff";expiresAt:string;
 verified:boolean;mfaEnabled:boolean;mfaVerified:boolean;policy:string};
type Result={organization:string;role:string;capabilities:string[];grantExpiresAt:string;sessionRevoked:boolean};
export default function StaffInvitationAcceptance(){
 const [token,setToken]=useState(""),[info,setInfo]=useState<Preview|null>(null);
 const [loginEmail,setLoginEmail]=useState(""),[password,setPassword]=useState("");
 const [register,setRegister]=useState(false),[firstName,setFirstName]=useState(""),[lastName,setLastName]=useState("");
 const [needsLogin,setNeedsLogin]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[accepted,setAccepted]=useState<Result|null>(null);
 const preview=useCallback(async(value:string)=>{
  setError("");setInfo(null);setAccepted(null);
  if(!/^[a-f0-9]{64}$/i.test(value)){setError("This private invitation link is missing or invalid.");return;}
  try{
   const response=await fetch("/api/v1/invitations",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"preview",token:value})});
   const result=await response.json();
   if(response.status===401){setNeedsLogin(true);return;}
   if(!response.ok)throw new Error(result.error?.message||"Invitation is unavailable.");
   setNeedsLogin(false);setInfo(result.data);
  }catch(e){setError(e instanceof Error?e.message:"Invitation unavailable.");}
 },[]);
 useEffect(()=>{
  const value=new URLSearchParams(window.location.hash.slice(1)).get("token")||"";
  setToken(value);void preview(value);
 },[preview]);
 async function signIn(){
  if(busy)return;setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/v1/auth/login",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({email:loginEmail,password})});
   const result=await r.json();if(!r.ok)throw new Error(result.error?.message||"Sign-in failed.");
   setPassword("");await preview(token);
  }catch(e){setError(e instanceof Error?e.message:"Could not sign in.");}
  finally{setBusy(false);}
 }
 async function createAccount(){
  if(busy)return;setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/v1/auth/register",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({email:loginEmail,password,firstName,lastName})});
   const result=await r.json();if(!r.ok)throw new Error(result.error?.message||"Registration failed.");
   setNotice(result.data.verificationSent?
    "Account created. Follow the separate email verification link before accepting, then return to this invitation.":
    "Account created, but verification email delivery is not configured. Contact the mosque; do not consider staff access active.");
   setPassword("");setRegister(false);
  }catch(e){setError(e instanceof Error?e.message:"Registration failed.");}
  finally{setBusy(false);}
 }
 async function signOut(){
  await fetch("/api/v1/auth/logout",{method:"POST"}).catch(()=>null);
  setNeedsLogin(true);setInfo(null);setError("");setNotice("Sign in using the exact address that received this invitation.");
 }
 async function accept(){
  if(!info?.verified||!info.mfaVerified||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/v1/invitations",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"accept",token})});
   const result=await r.json();if(!r.ok)throw new Error(result.error?.message||"Invitation could not be accepted.");
   setAccepted(result.data);setInfo(null);setToken("");
   window.history.replaceState(null,"","/invite");
  }catch(e){setError(e instanceof Error?e.message:"Invitation could not be accepted.");}
  finally{setBusy(false);}
 }
 return <main className="auth-shell"><section className="panel narrow">
 <div className="brand"><span className="mark">✧</span><span>SILA · Staff invitation</span></div>
 <h1>Join your community team.</h1>
 <p className="small">Only the verified person at the invited email address can accept this one-time, organization-bound invitation. No staff access is granted by viewing a link.</p>
 {error?<p className="error" role="alert">{error}</p>:null}
 {notice?<p className="notice" role="status">{notice}</p>:null}
 {accepted?<div className="notice" role="status"><h2>Invitation accepted</h2>
 <p>Your {accepted.organization} staff duties were recorded. The previous session has been revoked; sign in again and complete MFA to open your authorized workspace.</p>
 <a href="/">Sign in to SILA Steward</a></div>:null}
 {needsLogin?<div className="form">
  <p>Sign in with the exact email that was invited. New users must verify their email before accepting.</p>
  <div className="field"><label htmlFor="invite-login-email">Invited email</label>
  <input id="invite-login-email" type="email" value={loginEmail} maxLength={254} onChange={e=>setLoginEmail(e.target.value)}/></div>
  {register?<><div className="field"><label htmlFor="invite-first">First name</label>
  <input id="invite-first" value={firstName} onChange={e=>setFirstName(e.target.value)}/></div>
  <div className="field"><label htmlFor="invite-last">Last name</label>
  <input id="invite-last" value={lastName} onChange={e=>setLastName(e.target.value)}/></div></>:null}
  <div className="field"><label htmlFor="invite-password">Password {register?"(minimum 12 characters)":""}</label>
  <input id="invite-password" type="password" autoComplete={register?"new-password":"current-password"}
  value={password} onChange={e=>setPassword(e.target.value)}/></div>
  <button className="primary" disabled={busy||!loginEmail||!password||(register&&(!firstName.trim()||!lastName.trim()||password.length<12))}
  onClick={()=>void (register?createAccount():signIn())}>{register?"Create member account":"Sign in and review invitation"}</button>
  <button className="secondary" onClick={()=>setRegister(!register)}>{register?"Already have an account? Sign in":"New to SILA? Create an account first"}</button>
 </div>:null}
 {info?<div className="form"><h2>{info.organization.name}</h2>
  <p>Proposed staff responsibilities: {info.capabilities.join(", ")}</p>
  <p className="small">Offer expires {new Date(info.expiresAt).toLocaleString()}. New delegated grants expire after 14 days.</p>
  <p className="small">{info.policy}</p>
  {!info.verified?<p className="error">Verify the email address on your account before continuing.</p>:null}
  {!info.mfaVerified?<><p>An authenticator is mandatory for accepting new staff privileges. Use a secure personal device; the issuer cannot enroll one for you.</p>
   <a className="secondary" href={"/mfa?enroll=1#invite="+encodeURIComponent(token)}>
    {info.mfaEnabled?"Verify your existing authenticator":"Enroll your authenticator"}</a>
   <button className="secondary" onClick={()=>void preview(token)}>Refresh verification state</button>
  </>:null}
  <button className="primary" disabled={busy||!info.verified||!info.mfaVerified} onClick={()=>void accept()}>
    Accept these scoped responsibilities</button>
  <button className="secondary" onClick={()=>void signOut()}>Use a different signed-in account</button>
 </div>:null}
 {!info&&!needsLogin&&!accepted?<button className="secondary" onClick={()=>void preview(token)}>Retry secure invitation check</button>:null}
 <footer className="footer">If you did not expect an invitation, do not accept. Contact the mosque directly. This page never displays passwords or confidential member records.</footer>
 </section></main>;
}
