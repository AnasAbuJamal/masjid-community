import React,{useLayoutEffect,useRef,useState} from "react";
import {Alert,Linking,Text} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Action,Card,Feedback,Field,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useResource} from "../../src/useResource";
import {apiPost} from "../../src/api";
import {useSession} from "../../src/session";
import {usePilotSurface} from "../../src/usePilotSurface";
import {MemberScopeNotice} from "../../src/MemberScopeNotice";
import {useLanguage} from "../../src/i18n";
import {monthlyAmount,type GiftsResponse} from "../../src/giving-contract";
import {createScopedActionGate} from "../../src/scoped-action-gate";
type Campaign={id:string;title:string;purpose:string;currency:string;goalMinor?:number};
export default function Giving(){
 const {id}=useLocalSearchParams<{id:string}>();
 const {t,isRTL}=useLanguage();
 const {user,contextVersion,contextChanging}=useSession();
 const surface=usePilotSurface();
 const allowed=surface.allowed&&!contextChanging;
 const result=useResource<{items:Campaign[]}>(allowed?"public/campaigns":null);
 const recurring=useResource<GiftsResponse>(allowed&&user?.isVerified?"donations/recurring":null);
 const campaign=result.data?.items.find(x=>x.id===id);
 const [amount,setAmount]=useState("25"),[anonymous,setAnonymous]=useState(false),[monthly,setMonthly]=useState(false),[error,setError]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const gate=useRef(createScopedActionGate());
 const scope=[user?.id,contextVersion,contextChanging,allowed,id,recurring.data?.organization.id].join("|");
 const currentScope=useRef(scope);currentScope.current=scope;
 const intent=useRef<{key:string;requestKey:string}|null>(null);
 useLayoutEffect(()=>{gate.current.bind(scope);intent.current=null;setMonthly(false);setBusy(false);setError("");setNotice("");return()=>gate.current.invalidate();},[scope]);
 const canMonthly=recurring.data?.enabled===true;
 const intentContext=[scope,amount,anonymous,monthly].join("|");
 const currentIntent=useRef(intentContext);currentIntent.current=intentContext;
 const terms=t("giving.terms").replace("{amount}",monthlyAmount(amount)!==null?(monthlyAmount(amount)!/100).toFixed(2):amount);
 async function donate(expectedScope:string,expectedIntent:string){
  if(currentScope.current!==expectedScope||currentIntent.current!==expectedIntent)return;
  if(!allowed||!campaign){setError(t("giving.unavailable"));return;}
  if(!user){router.push("/auth");return;}
  if(!user.isVerified){setError(t("giving.verify"));return;}
  if(monthly&&!canMonthly){setError(t("giving.unavailable"));return;}
  // Preserve the established one-time amount behavior; monthly uses exact USD decimals.
  const cents=monthly?monthlyAmount(amount):Math.round(Number(amount)*100);
  if(cents===null||!Number.isFinite(cents)||cents<100||cents>10000000){setError(t("giving.invalid"));return;}
  const ticket=gate.current.begin();if(ticket===null)return;
  setBusy(true);setError("");setNotice("");
  if(monthly&&intent.current?.key!==expectedIntent)intent.current={key:expectedIntent,requestKey:"monthly-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2)+"-"+Math.random().toString(36).slice(2)};
  try{
   const response=await apiPost<{checkoutUrl:string|null;status:string}>(monthly?"donations/recurring":"donations/checkout",{campaignId:id,amountMinor:cents,anonymous,...(monthly?{termsVersion:"monthly-usd-v1",confirm:true,requestKey:intent.current!.requestKey}:{})});
   if(!gate.current.isCurrent(ticket)||currentScope.current!==expectedScope)return;
   if(!response.checkoutUrl||!response.checkoutUrl.startsWith("https://checkout.stripe.com/"))throw new Error(t("giving.linkError"));
   setNotice(t(monthly?"giving.pending":"giving.oncePending"));
   // Check immediately before opening an external URL: old account receipts are inert.
   if(gate.current.isCurrent(ticket)&&currentScope.current===expectedScope)await Linking.openURL(response.checkoutUrl);
  }catch(e){if(gate.current.isCurrent(ticket))setError(e instanceof Error?e.message:t("giving.error"));}
  finally{if(gate.current.finish(ticket))setBusy(false);}
 }
 function continueGiving(){
  if(!monthly){void donate(scope,intentContext);return;}
  if(monthlyAmount(amount)===null){setError(t("giving.invalid"));return;}
  const expectedScope=scope,expectedIntent=intentContext;
  Alert.alert(t("giving.confirmTitle"),terms,[{text:t("giving.dismiss"),style:"cancel"},{text:t("giving.confirmMonthly"),onPress:()=>void donate(expectedScope,expectedIntent)}]);
 }
 const align=isRTL?"right":"left";
 return <Shell><Action secondary icon="arrow-left" label={t("giving.back")} onPress={()=>router.back()}/>
 <Head eyebrow={t("giving.eyebrow")} title={t("giving.title")} subtitle={t("giving.subtitle")}/>
 {!allowed?<MemberScopeNotice {...surface}/>:null}
 {allowed?<Action secondary label={t("giving.manage")} onPress={()=>router.push("/giving/subscriptions")}/>:null}
 {allowed?<Feedback loading={result.loading} error={result.error} empty={!campaign} refresh={result.refresh}/>:null}
 {allowed&&campaign?<Card style={{gap:18}}><Text style={[S.headline,{textAlign:align}]}>{campaign.title}</Text><Text style={[S.bodyText,{textAlign:align}]}>{campaign.purpose}</Text>
 <Field label={t("giving.amount")} value={amount} onChange={setAmount} disabled={busy} keyboardType="numeric"/>
 <Action label={t(anonymous?"giving.private":"giving.anonymous")} disabled={busy} secondary icon="incognito" onPress={()=>setAnonymous(!anonymous)}/>
 {canMonthly?<><Action secondary disabled={busy} label={t(monthly?"giving.once":"giving.monthly")} onPress={()=>setMonthly(!monthly)}/><Text style={[S.label,{textAlign:align}]}>{t(monthly?"giving.monthly":"giving.once")}</Text></>:null}
 {monthly&&canMonthly?<Text style={[S.bodyText,{textAlign:align}]}>{terms}</Text>:null}
 <Text style={[S.muted,{textAlign:align}]}>{t("giving.receipts")}</Text>
 {error?<Text accessibilityRole="alert" style={{color:T.danger,textAlign:align}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success,textAlign:align}}>{notice}</Text>:null}
 <Action label={t(user?"giving.continue":"giving.signIn")} icon="heart" loading={busy} onPress={continueGiving}/>
 </Card>:null}</Shell>;
}
