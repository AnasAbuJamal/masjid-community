// Pure page composition. The server is the only authority for tenant,
// publication and cursor validity; IDs are deduplicated defensively client-side.
export function mergeGatheringPages<T extends {id:string}>(
 first:T[],prior:T[],next:T[]
):T[]{
 const seen=new Set(first.map(x=>x.id));
 const out:T[]=[];
 for(const item of [...prior,...next]){
  if(!seen.has(item.id)){seen.add(item.id);out.push(item);}
 }
 return out;
}
export function gatheringNextPagePath(base:string,cursor:string){
 return base+(base.includes("?")?"&":"?")+"cursor="+encodeURIComponent(cursor);
}
