"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

// Revalidate a long-running read-only display at a bounded interval. The
// server still determines current published and expired notices; this does
// not send push notifications or turn stale content into authoritative data.
export function KioskRefresh(){
 const router=useRouter();
 useEffect(()=>{
  const timer=setInterval(()=>router.refresh(),45_000);
  return ()=>clearInterval(timer);
 },[router]);
 return null;
}
