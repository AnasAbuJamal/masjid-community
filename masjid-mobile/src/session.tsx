import React,{createContext,useCallback,useContext,useEffect,useState} from "react";
import { api,apiPost,ApiUser,clearToken,setToken } from "./api";
type Session={user:ApiUser|null;loading:boolean;contextVersion:number;selectOrganization:(organizationId:string)=>Promise<void>;login:(email:string,password:string)=>Promise<ApiUser>;register:(value:{firstName:string;lastName:string;email:string;password:string})=>Promise<string>;logout:()=>Promise<void>;refresh:()=>Promise<void>};
const Context=createContext<Session|null>(null);
export function SessionProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<ApiUser|null>(null),[loading,setLoading]=useState(true);
 // Bump on account/mosque changes to purge every useResource response,
 // even when screens retain their original route/path while still mounted.
 const [contextVersion,setContextVersion]=useState(0);
 const refresh=useCallback(async()=>{
  try{const result=await api<ApiUser|null>("auth/me");setUser(result);}catch{setUser(null);}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 const login=async(email:string,password:string)=>{
  const value=await apiPost<{token:string;user:ApiUser}>("auth/login",{email,password});
  await setToken(value.token);setUser(value.user);
  setContextVersion(v=>v+1);return value.user;
 };
 const register=async(input:{firstName:string;lastName:string;email:string;password:string})=>{
  const result=await apiPost<{message:string}>("auth/register",input);return result.message;
 };
 const logout=async()=>{try{await apiPost("auth/logout",{});}catch{}finally{
  await clearToken();setUser(null);setContextVersion(v=>v+1);
 }};
 const selectOrganization=async(organizationId:string)=>{
  await apiPost("organizations/context",{organizationId});
  // No client-supplied tenant header or persisted mosque ID. The server-side
  // authenticated session is authoritative; clear cached private screens.
  setContextVersion(v=>v+1);
 };
 return <Context.Provider value={{user,loading,contextVersion,selectOrganization,login,register,logout,refresh}}>{children}</Context.Provider>;
}
export function useSession(){const state=useContext(Context);if(!state)throw new Error("Missing SessionProvider");return state;}
