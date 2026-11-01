import React,{createContext,useCallback,useContext,useEffect,useRef,useState} from "react";
import {api,apiPost,ApiUser,captureTokenForRevocation,clearToken,revokeCapturedBearer,setToken} from "./api";
import {createLatestContextSwitchQueue} from "./context-switch-queue";
type Session={user:ApiUser|null;loading:boolean;contextVersion:number;contextChanging:boolean;selectOrganization:(organizationId:string)=>Promise<void>;login:(email:string,password:string)=>Promise<ApiUser>;register:(value:{firstName:string;lastName:string;email:string;password:string})=>Promise<string>;logout:()=>Promise<void>;refresh:()=>Promise<void>};
const Context=createContext<Session|null>(null);
const sessionChanged=()=>new Error("The session changed during this action. Please retry.");
export function SessionProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<ApiUser|null>(null),[loading,setLoading]=useState(true);
 const [contextVersion,setContextVersion]=useState(0);
 const [contextChanging,setContextChanging]=useState(false);
 const switchQueue=useRef(createLatestContextSwitchQueue());
 // Each login, logout and mosque switch invalidates in-flight auth/me work.
 // This is independent from the credential generation enforced by api.ts.
 const operation=useRef(0);
 const refresh=useCallback(async()=>{
  const generation=operation.current;
  try{
   const result=await api<ApiUser|null>("auth/me");
   if(generation===operation.current){
    setUser(result);setContextVersion(v=>v+1);
   }
  }catch{
   if(generation===operation.current){
    setUser(null);setContextVersion(v=>v+1);
   }
  }finally{
   if(generation===operation.current)setLoading(false);
  }
 },[]);
 useEffect(()=>{
  void refresh();
  return ()=>{operation.current++;switchQueue.current.invalidate()};
 },[refresh]);
 const login=async(email:string,password:string)=>{
  const generation=++operation.current;
  switchQueue.current.invalidate();
  setContextChanging(false);
  // Clear previous private views before waiting on network or SecureStore.
  setUser(null);setLoading(true);setContextVersion(v=>v+1);
  try{
   await clearToken();
   if(generation!==operation.current)throw sessionChanged();
   const value=await apiPost<{token:string;user:ApiUser}>("auth/login",{email,password});
   if(generation!==operation.current)throw sessionChanged();
   await setToken(value.token);
   if(generation!==operation.current)throw sessionChanged();
   // Finalizing a login invalidates any refresh begun during authentication.
   operation.current++;
   setUser(value.user);setLoading(false);setContextVersion(v=>v+1);
   return value.user;
  }catch(error){
   if(generation===operation.current){setUser(null);setLoading(false);}
   throw error;
  }
 };
 const register=async(input:{firstName:string;lastName:string;email:string;password:string})=>{
  const result=await apiPost<{message:string}>("auth/register",input);
  return result.message;
 };
 const logout=async()=>{
  const previous=captureTokenForRevocation();
  ++operation.current;
  switchQueue.current.invalidate();
  setContextChanging(false);
  // Local authority and private screens are invalidated synchronously.
  // Never wait for a stalled or failed remote revocation before sign-out.
  setUser(null);setLoading(false);setContextVersion(v=>v+1);
  const persistedRemoval=clearToken();
  // Best-effort remote revocation must use only the captured old bearer.
  // A late request must never revoke the newer user's session.
  void previous.then(saved=>revokeCapturedBearer(saved)).catch(()=>false);
  await persistedRemoval;
 };
 const selectOrganization=async(organizationId:string)=>{
  const generation=++operation.current;
  // A selected mosque is server-session state. Concurrent POSTs must NEVER
  // arrive out of order and leave an older mosque authoritative.
  setContextChanging(true);
  setContextVersion(v=>v+1);
  try{
   await switchQueue.current.run(async()=>{
    if(generation!==operation.current)throw sessionChanged();
    await apiPost("organizations/context",{organizationId});
    if(generation!==operation.current)throw sessionChanged();
   });
  }finally{
   if(generation===operation.current){
    // Even on failure, reload private resources using actual server context.
    setContextChanging(false);
    setContextVersion(v=>v+1);
   }
  }
 };
 return <Context.Provider value={{user,loading,contextVersion,contextChanging,selectOrganization,login,register,logout,refresh}}>{children}</Context.Provider>;
}
export function useSession(){const state=useContext(Context);if(!state)throw new Error("Missing SessionProvider");return state;}
