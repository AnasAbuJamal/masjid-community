import React,{createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import * as SecureStore from "expo-secure-store";
import {useResource} from "./useResource";
import {useSession} from "./session";

export type PublicVenue={id:string;name:string;address:string|null;timeZone:string};
type VenueList={organization:{id:string;name:string}|null;venues:PublicVenue[]};
type VenueContextValue={
 venue:PublicVenue|null;
 venues:PublicVenue[];
 ready:boolean;
 error:string;
 refresh:()=>Promise<void>;
 selectVenue:(id:string)=>Promise<void>;
};
const Context=createContext<VenueContextValue|null>(null);
const storageKey="masjid.community.publicVenue";

export function VenueProvider({children}:{children:React.ReactNode}){
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [hydrated,setHydrated]=useState(false);
 const {user}=useSession();
 // Validated selected-mosque venues for signed-in members; anonymous guests
 // continue using the original public venue catalog.
 const list=useResource<VenueList>(user?.isVerified
  ?"organizations/view?resource=venues":"public/venues");
 useEffect(()=>{
  let active=true;
  void SecureStore.getItemAsync(storageKey).then(id=>{
   if(active)setSelectedId(id);
  }).catch(()=>{}).finally(()=>{if(active)setHydrated(true)});
  return ()=>{active=false};
 },[]);
 const venues=useMemo(()=>list.data?.venues||[],[list.data]);
 // Never use a persisted ID as authority; validate it against this mosque's
 // current published list before selecting or fetching any scoped data.
 const venue=useMemo(()=>venues.find(v=>v.id===selectedId)??venues[0]??null,[venues,selectedId]);
 const selectVenue=useCallback(async(id:string)=>{
  if(!venues.some(v=>v.id===id))return;
  setSelectedId(id);
  try{await SecureStore.setItemAsync(storageKey,id)}catch{/* In-session selection remains valid. */}
 },[venues]);
 const value=useMemo(()=>({
  venue,venues,ready:hydrated&&!list.loading,error:list.error,refresh:list.refresh,selectVenue,
 }),[venue,venues,hydrated,list.loading,list.error,list.refresh,selectVenue]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useVenue(){
 const context=useContext(Context);
 if(!context)throw new Error("VenueProvider is missing.");
 return context;
}
