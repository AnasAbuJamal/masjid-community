export type CredentialStore={
 getItemAsync:(key:string)=>Promise<string|null>;
 setItemAsync:(key:string,value:string)=>Promise<void>;
 deleteItemAsync:(key:string)=>Promise<void>;
};
/** Single authority for in-memory and secure credential persistence.
 * Generation changes are synchronous; OS writes are strictly serialized.
 * A failing OS delete cannot guarantee secure erasure after process restart.
 */
export function createCredentialAuthority(store:CredentialStore,key:string){
 let active:string|null|undefined=undefined;
 let generation=0;
 let writes:Promise<void>=Promise.resolve();
 async function token(){
  if(active!==undefined)return active;
  const observed=generation;
  const saved=await store.getItemAsync(key);
  if(observed!==generation)return active??null;
  active=saved;
  return saved;
 }
 async function capture(){
  const observed=generation;
  const saved=active!==undefined?active:await store.getItemAsync(key);
  // A captured bearer belongs only to the generation that began logout;
  // never revoke a token from a newer login in the meantime.
  return observed===generation?saved:null;
 }
 function mutate(value:string|null):Promise<void>{
  const mine=++generation;
  active=value;
  const job=writes.catch(()=>{}).then(async()=>{
   if(mine!==generation)return;
   if(value===null)await store.deleteItemAsync(key);
   else await store.setItemAsync(key,value);
  });
  writes=job;
  return job.catch(error=>{
   if(mine===generation&&value!==null){
    active=null;
    generation++;
    // Best effort to erase a partially written login credential. The
    // caller still receives the original error and remains signed out.
    const cleanup=writes.catch(()=>{}).then(()=>store.deleteItemAsync(key));
    writes=cleanup;
    void cleanup.catch(()=>{});
   }
   throw error;
  });
 }
 return {token,capture,version:()=>generation,
  set:(value:string)=>mutate(value),clear:()=>mutate(null)};
}
