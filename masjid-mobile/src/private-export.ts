import {createScopedActionGate} from "./scoped-action-gate.ts";

export type ExportOwner={organizationId:string;email:string};
export type PrivateExport=Record<string,unknown>&{
 organization:{id:string;name:string};account:{email:string};scope:string;
 complete:false;truncatedCategories:string[];categoryWindowComplete:boolean;exclusions:string[];
};
const record=(value:unknown):value is Record<string,unknown>=>
 typeof value==="object"&&value!==null&&!Array.isArray(value);
const strings=(value:unknown):value is string[]=>
 Array.isArray(value)&&value.every(item=>typeof item==="string"&&item.length>0);
function verifiedReceipt(value:unknown,expected:ExportOwner):value is PrivateExport{
 return record(value)&&record(value.organization)&&record(value.account)&&
  value.organization.id===expected.organizationId&&
  typeof value.organization.name==="string"&&value.organization.name.trim().length>0&&
  value.account.email===expected.email&&typeof value.scope==="string"&&value.scope.trim().length>0&&
  value.complete===false&&strings(value.truncatedCategories)&&strings(value.exclusions)&&
  value.categoryWindowComplete===(value.truncatedCategories.length===0);
}

/** Gate both confirmation and response, before handing private data to the OS.
 * Invalidation cannot recall a request or share sheet already dispatched.
 * No passwords or export payloads are retained by the controller.
 */
export function createPrivateExportAction(){
 const gate=createScopedActionGate();
 let scope:string|null=null,generation=0;
 const current=(intent:number|null)=>scope!==null&&intent!==null&&intent===generation;
 return {
  bind(next:string|null){
   if(next===scope)return;
   scope=next;generation++;
   if(next===null)gate.invalidate();else gate.bind(next);
  },
  invalidate(){scope=null;generation++;gate.invalidate();},
  capture():number|null{return scope===null?null:generation;},
  isCurrent:current,
  async run(intent:number|null,expected:ExportOwner,request:()=>Promise<unknown>,
   share:(value:PrivateExport)=>Promise<unknown>):Promise<"shared"|"discarded"|"busy">{
   if(!current(intent))return "discarded";
   const ticket=gate.begin();
   if(ticket===null)return "busy";
   try{
    if(!expected.organizationId||!expected.email)throw new Error("Unverified private export");
    const value=await request();
    if(!gate.isCurrent(ticket)||!current(intent))return "discarded";
    if(!verifiedReceipt(value,expected))throw new Error("Unverified private export");
    // No await between the final scope check and opening the native sheet.
    await share(value);
    return gate.isCurrent(ticket)&&current(intent)?"shared":"discarded";
   }catch(error){
    if(!gate.isCurrent(ticket)||!current(intent))return "discarded";
    throw error;
   }finally{gate.finish(ticket);}
  }
 };
}
