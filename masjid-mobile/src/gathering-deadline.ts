/**
 * A published gathering's RSVP/cancellation cutoff is an absolute instant.
 * It is unrelated to the phone's timezone or displayed wall-clock time.
 * Fail closed when the cutoff is missing or malformed; the server remains the
 * final authority on capacity, revocation, and valid RSVP transitions.
 */
export function isGatheringDeadlineClosed(
  cutoff:string|null|undefined,
  nowMs:number=Date.now(),
):boolean{
  if(typeof cutoff!=="string"||
     !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(cutoff)||
     !Number.isFinite(nowMs))return true;
  const instant=Date.parse(cutoff);
  if(!Number.isFinite(instant))return true;
  try{
    if(new Date(instant).toISOString()!==cutoff)return true;
  }catch{return true;}
  return nowMs>=instant;
}
