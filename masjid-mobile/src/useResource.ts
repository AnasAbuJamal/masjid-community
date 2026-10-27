import {useCallback,useEffect,useState} from "react";
import {api} from "./api";
export function useResource<T>(path:string){
 const [data,setData]=useState<T|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const refresh=useCallback(async()=>{
  setLoading(true);setError("");
  try{setData(await api<T>(path));}catch(e){setError(e instanceof Error?e.message:"Unable to load data.");setData(null);}
  finally{setLoading(false);}
 },[path]);
 useEffect(()=>{void refresh()},[refresh]);
 return {data,loading,error,refresh};
}
