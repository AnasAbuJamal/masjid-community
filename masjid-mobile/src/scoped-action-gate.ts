/**
 * Presentation-side single-flight gate for member actions.
 *
 * An action is owned by one rendered account, mosque, resource, and access
 * context. A change invalidates the old receipt even if the network later
 * resolves. This does not cancel remote work or replace server authorization
 * and idempotency; the API is always the final source of truth.
 */
export function createScopedActionGate(){
 let scope:string|null=null;
 let generation=0;
 let inFlight=false;
 return {
  bind(next:string){
   if(scope!==next){
    scope=next;
    generation++;
    inFlight=false;
   }
  },
  begin():number|null{
   if(scope===null||inFlight)return null;
   // Each new request needs a unique receipt ticket, even in the same
   // account/mosque scope. An older finally block must never unlock it.
   generation++;
   inFlight=true;
   return generation;
  },
  isCurrent(ticket:number):boolean{
   return inFlight&&ticket===generation;
  },
  finish(ticket:number):boolean{
   if(!inFlight||ticket!==generation)return false;
   inFlight=false;
   return true;
  },
  invalidate(){
   generation++;
   inFlight=false;
   scope=null;
  }
 };
}
