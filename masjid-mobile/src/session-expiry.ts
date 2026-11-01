// Server-revoked native sessions immediately revoke in-memory authority.
// Never invalidate a newer account because an old request finished late.
export function createSessionExpiryGuard(authority:{
 version:()=>number;
 clear:()=>Promise<void>;
}){
 const subscribers=new Set<()=>void>();
 return {
  subscribe(listener:()=>void){
   subscribers.add(listener);
   return ()=>{subscribers.delete(listener);};
  },
  expire(input:{status:number;revision:number;authenticated:boolean;path:string}){
   const path=input.path.replace(/^\/+/, "");
   if(input.status!==401||!input.authenticated||
      input.revision!==authority.version()||
      /^(?:public\/|auth\/login(?:\?|$)|auth\/register(?:\?|$))/.test(path))
    return false;
   // clear() changes the credential generation synchronously. Do not
   // postpone private view invalidation while a keychain deletion is pending.
   const removal=authority.clear();
   for(const subscriber of subscribers){
    try{subscriber();}catch{/* Keep all other listeners and signed-out state. */}
   }
   // OS deletion is best effort; process-restart erasure requires device UAT.
   void removal.catch(()=>{});
   return true;
  }
 };
}
