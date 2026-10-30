import {useCallback,useEffect,useRef,useState} from "react";
import {api} from "./api";
import {useSession} from "./session";

type ResourceState<T>={key:string;data:T|null;loading:boolean;error:string};

// An organization or venue change must never leave the previous response
// visible, including when an earlier network response arrives late.
export function useResource<T>(path:string|null){
 const {contextVersion}=useSession();
 const key=(path||"")+"#"+contextVersion;
 const [state,setState]=useState<ResourceState<T>>({key,data:null,loading:!!path,error:""});
 const requestId=useRef(0);
 const refresh=useCallback(async()=>{
  const id=++requestId.current;
  setState({key,data:null,loading:!!path,error:""});
  if(!path)return;
  try{
   const data=await api<T>(path);
   if(id===requestId.current)setState({key,data,loading:false,error:""});
  }catch(e){
   if(id===requestId.current)setState({key,data:null,loading:false,error:e instanceof Error?e.message:"Unable to load data."});
  }
 },[path,key]);
 useEffect(()=>{
  void refresh();
  return ()=>{requestId.current++};
 },[refresh]);
 const current=state.key===key;
 return {
  data:current?state.data:null,
  loading:current?state.loading:!!path,
  error:current?state.error:"",
  refresh,
 };
}
