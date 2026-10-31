import {useCallback,useEffect,useRef,useState} from "react";
import {api} from "./api";
import {mergeGatheringPages,gatheringNextPagePath} from "./gatheringPagination";

export type GatheringPage<T extends {id:string}>={
 items:T[];organization?:{id?:string};
 hasMore?:boolean;nextCursor?:string|null;pageSize?:number
};
type Extra<T>={key:string;items:T[];cursor:string|null;hasMore:boolean;
 loaded:boolean;busy:boolean;error:string};
export function useGatheringPages<T extends {id:string}>(
 path:string|null,contextVersion:number,first:GatheringPage<T>|null
){
 const key=(path||"")+"#"+contextVersion;
 const [state,setState]=useState<Extra<T>>({
  key:"",items:[],cursor:null,hasMore:false,loaded:false,busy:false,error:""
 });
 const generation=useRef(0),inFlightKey=useRef<string|null>(null);
 useEffect(()=>{
  generation.current++;
  setState({key,items:[],cursor:null,hasMore:false,loaded:false,busy:false,error:""});
  return ()=>{generation.current++;};
 },[key,first]);
 const extra=state.key===key&&first?state:null;
 const cursor=extra?.loaded?extra.cursor:first?.nextCursor||null;
 const hasMore=extra?.loaded?extra.hasMore:!!first?.hasMore;
 const loadMore=useCallback(async()=>{
  if(!path||!first||!cursor||!hasMore||inFlightKey.current===key)return;
  inFlightKey.current=key;
  const startingGeneration=generation.current;
  setState(old=>({
   ...(old.key===key?old:{
    key,items:[],cursor:null,hasMore:false,loaded:false,busy:false,error:""
   }),busy:true,error:""
  }));
  try{
   const page=await api<GatheringPage<T>>(gatheringNextPagePath(path,cursor));
   if(first.organization?.id!==page.organization?.id)
    throw new Error("The selected mosque changed. Refresh this gathering list.");
   if(generation.current!==startingGeneration)return;
   setState(old=>{
    if(old.key!==key)return old;
    const merged=mergeGatheringPages(first.items,old.loaded?old.items:[],page.items);
    return {key,items:merged,cursor:page.nextCursor||null,
     hasMore:!!page.hasMore,loaded:true,busy:false,error:""};
   });
  }catch(e){
   if(generation.current!==startingGeneration)return;
   setState(old=>old.key===key?{
    ...old,busy:false,error:e instanceof Error?e.message:"Unable to load more gatherings."
   }:old);
  }finally{
   if(inFlightKey.current===key)inFlightKey.current=null;
  }
 },[key,path,first,cursor,hasMore]);
 return {
  items:[...(first?.items||[]),...(extra?.items||[])],
  cursor,hasMore,busy:!!extra?.busy,error:extra?.error||"",loadMore,
  // A page may be invalidated when its anchor becomes unpublished.
  // The caller can refresh the first page to restart safely.
 };
}
