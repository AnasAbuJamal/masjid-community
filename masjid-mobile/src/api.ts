import * as SecureStore from "expo-secure-store";
const tokenKey="masjid.session";
const raw=(process.env.EXPO_PUBLIC_API_URL||"").replace(/\/+$/,"");
export type ApiUser={id:string;email:string;firstName:string;lastName:string;role:string;isVerified:boolean;mfaRequired?:boolean;mfaSetupRequired?:boolean};
export async function token(){return SecureStore.getItemAsync(tokenKey);}
export async function setToken(value:string){return SecureStore.setItemAsync(tokenKey,value);}
export async function clearToken(){return SecureStore.deleteItemAsync(tokenKey);}
export async function api<T>(path:string, options:RequestInit={}):Promise<T>{
 if(!raw)throw new Error("The server address is not configured. Set EXPO_PUBLIC_API_URL.");
 const saved=await token();
 const response=await fetch(raw+"/api/v1/"+path.replace(/^\/+/,""),{
  ...options,headers:{"Accept":"application/json",...(options.body?{"Content-Type":"application/json"}:{}),...(saved?{"Authorization":"Bearer "+saved}:{}),...options.headers}
 });
 const value=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(value.error?.message||"Request failed. Try again.");
 return value.data as T;
}
export function apiPost<T>(path:string,body:unknown){return api<T>(path,{method:"POST",body:JSON.stringify(body)});}
