import React,{useState} from "react";
import {Linking,Text,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Action,Card,Feedback,Field,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useResource} from "../../src/useResource";
import {apiPost} from "../../src/api";
import {useSession} from "../../src/session";
type Campaign={id:string;title:string;purpose:string;currency:string;goalMinor?:number};
export default function Giving(){
 const {id}=useLocalSearchParams<{id:string}>();
 const {user}=useSession();
 const result=useResource<{items:Campaign[]}>("public/campaigns");
 const campaign=result.data?.items.find(x=>x.id===id);
 const [amount,setAmount]=useState("25"),[anonymous,setAnonymous]=useState(false),[error,setError]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 async function donate(){
  if(!user){router.push("/auth");return;}
  if(!user.isVerified){setError("Verify your email before donating.");return;}
  const cents=Math.round(Number(amount)*100);
  if(!Number.isFinite(cents)||cents<100||cents>10000000){setError("Enter a valid amount between $1 and $100,000.");return;}
  setBusy(true);setError("");setNotice("");
  try{const result=await apiPost<{checkoutUrl:string|null;status:string}>("donations/checkout",{campaignId:id,amountMinor:cents,anonymous});
   if(!result.checkoutUrl||!result.checkoutUrl.startsWith("https://checkout.stripe.com/"))throw new Error("The secure checkout link is unavailable.");
   setNotice("Payment is pending until verified by the provider.");
   await Linking.openURL(result.checkoutUrl);
  }catch(e){setError(e instanceof Error?e.message:"Unable to initialize checkout.");}
  finally{setBusy(false);}
 }
 return <Shell><Action secondary icon="arrow-left" label="Back to campaigns" onPress={()=>router.back()}/>
 <Head eyebrow="GIVING · TRUSTED CHECKOUT" title="Every gift matters." subtitle="Secure checkout, verified payment status, and private records."/>
 <Feedback loading={result.loading} error={result.error} empty={!campaign} refresh={result.refresh}/>
 {campaign?<Card style={{gap:18}}><Text style={S.headline}>{campaign.title}</Text><Text style={S.bodyText}>{campaign.purpose}</Text>
 <Field label="Amount (USD)" value={amount} onChange={setAmount} keyboardType="numeric"/>
 <Action label={anonymous?"Giving privately":"Give anonymously to the public"} secondary icon="incognito" onPress={()=>setAnonymous(!anonymous)}/>
 <Text style={S.muted}>Donation receipts become final only after a verified payment webhook. Your donation history is private.</Text>
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 <Action label={user?"Continue securely":"Sign in to give"} icon="heart" loading={busy} onPress={()=>void donate()}/>
 </Card>:null}</Shell>;
}
