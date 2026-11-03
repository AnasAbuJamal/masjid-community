import * as SecureStore from "expo-secure-store";
import {createCredentialAuthority} from "./credential-authority";
import {createSessionExpiryGuard} from "./session-expiry";
import {sessionHeaders} from "./session-headers";
const tokenKey="masjid.session";
const raw=(process.env.EXPO_PUBLIC_API_URL||"").replace(/\/+$/,"");
const authority=createCredentialAuthority(SecureStore,tokenKey);
const expiry=createSessionExpiryGuard({version:authority.version,clear:authority.clear});
export const onSessionExpired=expiry.subscribe;
export type ApiUser={id:string;email:string;firstName:string;lastName:string;role:string;isVerified:boolean;mfaRequired?:boolean;mfaSetupRequired?:boolean};

export const token=authority.token;
export const setToken=authority.set;
export const clearToken=authority.clear;
export const captureTokenForRevocation=authority.capture;
const changed=()=>new Error("Account or mosque session changed. Please retry.");
const check=(revision:number)=>{if(revision!==authority.version())throw changed();};

// All native requests (including calendar text) must discard a response
// belonging to a token generation that has since logged out or changed.
// A private response must never populate a newer account's screen.
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 if(!raw)throw new Error("The server address is not configured. Set EXPO_PUBLIC_API_URL.");
 const revision=authority.version();
 const saved=await token();
 check(revision);
 const headers=sessionHeaders(options.headers,saved,!!options.body);
 const response=await fetch(raw+"/api/v1/"+path.replace(/^\/+/, ""),{
  ...options,headers
 });
 check(revision);
 if(expiry.expire({status:response.status,revision,authenticated:!!saved,path}))
  throw new Error("Your session is no longer active. Please sign in again.");
 const value=await response.json().catch(()=>({}));
 check(revision);
 if(!response.ok)throw new Error(value.error?.message||"Request failed. Try again.");
 return value.data as T;
}
export function apiPost<T>(path:string,body:unknown){return api<T>(path,{method:"POST",body:JSON.stringify(body)});}

// Use only the exact captured bearer from BEFORE local logout. Never read
// current credentials here; otherwise a delayed logout could revoke a newer
// account. Network success is best-effort, not proven remotely on-device.
export async function revokeCapturedBearer(saved:string|null):Promise<boolean>{
 if(!saved||!raw)return false;
 try{
  const response=await fetch(raw+"/api/v1/auth/logout",{
   method:"POST",headers:{"Accept":"application/json",
    "Content-Type":"application/json","Authorization":"Bearer "+saved},
   body:"{}"
  });
  return response.ok;
 }catch{return false;}
}

// Download membership-scoped iCalendar text without a token in a URL.
// Refuse a response if the account/mosque changed during the request.
export async function apiCalendar(path:string):Promise<string>{
 if(!raw)throw new Error("The server address is not configured.");
 const revision=authority.version();
 const saved=await token();
 check(revision);
 if(!saved)throw new Error("Sign in and verify membership to export this gathering.");
 const response=await fetch(raw+"/api/v1/"+path.replace(/^\/+/, ""),{
  headers:{"Accept":"text/calendar","Authorization":"Bearer "+saved}
 });
 check(revision);
 if(expiry.expire({status:response.status,revision,authenticated:!!saved,path}))
  throw new Error("Your session is no longer active. Please sign in again.");
 if(!response.ok){
  const value=await response.json().catch(()=>({}));
  check(revision);
  throw new Error(value.error?.message||"Calendar export was unavailable.");
 }
 if(!response.headers.get("content-type")?.startsWith("text/calendar"))
  throw new Error("The server returned an unexpected calendar format.");
 const content=await response.text();
 check(revision);
 if(!content.startsWith("BEGIN:VCALENDAR")||content.length>65536)
  throw new Error("The calendar entry is malformed or too large.");
 return content;
}
