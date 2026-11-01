/**
 * A server-authenticated mosque selection is a write to shared session
 * context. A newer request must run AFTER an already-dispatched older one,
 * never concurrently; queued superseded selections may be safely skipped.
 */
export function createLatestContextSwitchQueue(){
 let latest=0;
 let tail:Promise<void>=Promise.resolve();
 const replaced=()=>new Error("Mosque switch superseded by a newer session intent.");
 function run<T>(operation:()=>Promise<T>):Promise<T>{
  const mine=++latest;
  const job=tail.then(async()=>{
   if(mine!==latest)throw replaced();
   const result=await operation();
   if(mine!==latest)throw replaced();
   return result;
  });
  // Network failure or a stale request cannot block the next valid selection.
  tail=job.then(()=>undefined,()=>undefined);
  return job;
 }
 function invalidate(){latest++;}
 return {run,invalidate};
}
