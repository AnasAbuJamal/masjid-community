import React,{useState} from "react";
import {Linking,Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../../src/ui";
import {useResource} from "../../src/useResource";
import {apiPost} from "../../src/api";
import {S,T} from "../../src/theme";
type Invoice={id:string;description:string;amountMinor:number;currency:string;status:string;dueAt:string;student:{firstName:string;lastName:string}};
export default function FamilyInvoices(){
 const data=useResource<{invoices:Invoice[]}>("invoices");
 const [busy,setBusy]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function pay(invoiceId:string){
  setBusy(invoiceId);setError("");setNotice("");
  try{
   const result=await apiPost<{checkoutUrl:string|null;status:string}>("invoices/checkout",{invoiceId});
   if(!result.checkoutUrl||!result.checkoutUrl.startsWith("https://checkout.stripe.com/"))throw new Error("Secure checkout is unavailable.");
   setNotice("Checkout opened. An invoice is paid only after the processor verifies it.");
   await Linking.openURL(result.checkoutUrl);
  }catch(e){setError(e instanceof Error?e.message:"Checkout could not be started.");}
  finally{setBusy("");}
 }
 return <Shell><Action label="Back to school" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="SCHOOL · FAMILY BILLING" title="Your family's invoices." subtitle="Only invoices assigned to your approved guardian account appear here."/>
 <Feedback loading={data.loading} error={data.error} empty={!data.data?.invoices.length} refresh={data.refresh}/>
 {data.data?.invoices.map(row=><Card key={row.id} style={{gap:10}}>
  <Text style={S.headline}>{row.description}</Text><Text style={S.muted}>{row.student.firstName} {row.student.lastName} · Due {new Date(row.dueAt).toLocaleDateString()}</Text>
  <Text style={S.value}>{(row.amountMinor/100).toLocaleString("en-US",{style:"currency",currency:row.currency.toUpperCase()})}</Text>
  <Text style={{color:row.status==="paid"?T.success:T.muted,fontWeight:"800"}}>{row.status.toUpperCase()}</Text>
  {row.status==="pending"?<Action label="Secure tuition checkout" loading={busy===row.id} onPress={()=>void pay(row.id)}/>:null}
 </Card>)}
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 </Shell>;
}
