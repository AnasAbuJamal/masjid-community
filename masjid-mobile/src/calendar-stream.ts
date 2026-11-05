// Bound calendar downloads *while streaming*, before an untrusted server
// can buffer an arbitrarily large private export in native memory.
// UTF-8 is decoded strictly and the limit is measured in bytes, not UTF-16.
export async function readBoundedCalendar(response:Response,maxBytes:number):Promise<string>{
 if(!response.body)throw new Error("Calendar export has no response body.");
 const reader=response.body.getReader();
 const decoder=new TextDecoder("utf-8",{fatal:true});
 let bytes=0,content="";
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   bytes+=value.byteLength;
   if(bytes>maxBytes)throw new Error("The calendar entry is malformed or too large.");
   content+=decoder.decode(value,{stream:true});
  }
  content+=decoder.decode();
  return content;
 }catch(error){
  if(error instanceof TypeError)throw new Error("The calendar entry is not valid UTF-8.");
  throw error;
 }finally{
  if(bytes>maxBytes)await reader.cancel().catch(()=>{});
  reader.releaseLock();
 }
}
