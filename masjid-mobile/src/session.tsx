import React,{createContext,useCallback,useContext,useEffect,useState} from "react";
import { api,apiPost,ApiUser,clearToken,setToken } from "./api";
type Session={user:ApiUser|null;loading:boolean;login:(email:string,password:string)=>Promise<ApiUser>;register:(value:{firstName:string;lastName:string;email:string;password:string})=>Promise<string>;logout:()=>Promise<void>;refresh:()=>Promise<void>};
const Context=createContext<Session|null>(null);
export function SessionProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<ApiUser|null>(null),[loading,setLoading]=useState(true);
 const refresh=useCallback(async()=>{
  try{const result=await api<ApiUser|null>("auth/me");setUser(result);}catch{setUser(null);}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 const login=async(email:string,password:string)=>{
  const value=await apiPost<{token:string;user:ApiUser}>("auth/login",{email,password});
  await setToken(value.token);setUser(value.user);return value.user;
 };
 const register=async(input:{firstName:string;lastName:string;email:string;password:string})=>{
  const result=await apiPost<{message:string}>("auth/register",input);return result.message;
 };
 const logout=async()=>{try{await apiPost("auth/logout",{});}catch{}finally{await clearToken();setUser(null);}};
 return <Context.Provider value={{user,loading,login,register,logout,refresh}}>{children}</Context.Provider>;
}
export function useSession(){const state=useContext(Context);if(!state)throw new Error("Missing SessionProvider");return state;}
