"use client";
import {useCallback,useEffect,useRef,useState,type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {matchesKioskSnapshot,venueCivilDay,
 type KioskSnapshot,type PublishedHome} from "./kiosk-freshness";

// A kiosk is a public screen, not a member session. Its safety checks use only
// published data returned by the same venue-scoped guest API as ordinary visitors.
// An RSC refresh alone cannot prove that a network request succeeded. A fresh
// no-store guest response is required before potentially old content is shown.
export function KioskRefresh({snapshot,children}:{
 snapshot:KioskSnapshot;children:ReactNode
}){
 const router=useRouter();
 const [issue,setIssue]=useState<string|null>("Verifying current published venue information.");
 const [blanked,setBlanked]=useState(false);
 const generation=useRef(0),controller=useRef<AbortController|null>(null);
 const activeSnapshot=JSON.stringify(snapshot);
 const check=useCallback(async()=>{
  const version=++generation.current;
  controller.current?.abort();
  const abort=new AbortController();
  controller.current=abort;
  const timeout=window.setTimeout(()=>abort.abort(),12_000);
  try{
   if(snapshot.localDay&&venueCivilDay(new Date(),snapshot.timeZone)!==snapshot.localDay){
    setIssue("The venue's calendar day changed. The displayed schedule must be reverified.");
    router.refresh();
    return;
   }
   const query=snapshot.venueId?"?venueId="+encodeURIComponent(snapshot.venueId):"";
   const response=await fetch("/api/v1/public/home"+query,{
    cache:"no-store",signal:abort.signal
   });
   if(!response.ok)throw new Error("The published venue status could not be verified.");
   const payload=await response.json();
   if(!payload?.data||typeof payload.data!=="object")
    throw new Error("No verified published venue response was received.");
   if(version!==generation.current||abort.signal.aborted)return;
   if(!matchesKioskSnapshot(payload.data as PublishedHome,snapshot)){
    setIssue("Published prayer or venue safety information has changed. Refreshing the display.");
    router.refresh();
    return;
   }
   setIssue(null);
   router.refresh();
  }catch{
   if(version!==generation.current)return;
   setIssue("The display cannot verify current published information. Old prayer times and notices are hidden.");
  }finally{
   window.clearTimeout(timeout);
   if(controller.current===abort)controller.current=null;
  }
 },[snapshot.venueId,snapshot.localDay,snapshot.timeZone,snapshot.prayerRevision,
   snapshot.prayerUpdatedAt,snapshot.emergencyId,snapshot.emergencyRevision,router]);
 useEffect(()=>{
  // A newly refreshed server snapshot is not trusted until its guest API
  // agrees. Never display a stale version while waiting for a replacement.
  setIssue("Verifying current published venue information.");
  void check();
  const timer=window.setInterval(()=>void check(),45_000);
  return ()=>{
   window.clearInterval(timer);
   generation.current++;
   controller.current?.abort();
  };
 // activeSnapshot changes when RSC actually delivers new published data.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[activeSnapshot,check]);
 const obscured=blanked||issue!==null;
 return <>
  {!obscured?<div className="kiosk-local-control">
   <button type="button" className="secondary" onClick={()=>setBlanked(true)}>
    Blank this display locally
   </button>
  </div>:null}
  <div className="kiosk-verified-content" aria-hidden={obscured} inert={obscured}>
   {children}
  </div>
  {obscured?<section className="kiosk-safety-cover" role="alert" aria-live="assertive"
   aria-label={blanked?"Display manually blanked":"Published display temporarily unavailable"}>
    <div className="kiosk-safety-message">
     <h1>{blanked?"Display intentionally blanked":"Current information not verified"}</h1>
     <p>{blanked
      ?"This screen was blanked locally. No publication or venue schedule has been changed."
      :issue}</p>
     <p>For authoritative prayer times and safety instructions, contact the mosque office.</p>
     <div className="actions">
      {blanked?<button type="button" className="primary" onClick={()=>{
       setIssue("Rechecking published venue information before resuming.");
       setBlanked(false);
       void check();
      }}>Verify and resume display</button>:
      <button type="button" className="primary" onClick={()=>void check()}>
       Retry verification
      </button>}
     </div>
    </div>
   </section>:null}
 </>;
}
