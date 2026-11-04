import React,{useLayoutEffect,useRef,useState} from "react";
import {Alert,Text} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useResource} from "../../src/useResource";
import {apiPost} from "../../src/api";
import {useSession} from "../../src/session";
import {usePilotSurface} from "../../src/usePilotSurface";
import {MemberScopeNotice} from "../../src/MemberScopeNotice";
import {useLanguage} from "../../src/i18n";
import {cancellationOutcome,giftStatusKey,hasFinalGivingReceipt,recurringPath,givingMoney,type GiftsResponse,type GiftHistory,type Gift} from "../../src/giving-contract";
import {gatheringLocalTime} from "../../src/gathering-local-time";
import {createScopedActionGate} from "../../src/scoped-action-gate";
export default function Subscriptions(){
 const {t,isRTL,language}=useLanguage();
 const {user,contextVersion,contextChanging,loading:sessionLoading}=useSession();
 const surface=usePilotSurface();
 const allowed=surface.allowed&&!!user?.isVerified&&!contextChanging;
 const baseScope=[user?.id,contextVersion,allowed,contextChanging].join("|");
 const [selection,setSelection]=useState<{scope:string;id:string|null;cursor:string}>({scope:baseScope,id:null,cursor:""});
 const selected=selection.scope===baseScope?selection:{scope:baseScope,id:null,cursor:""};
 const path=allowed?recurringPath(selected.id,selected.cursor):null;
 const resource=useResource<GiftsResponse|GiftHistory>(path);
 const data=resource.data;
 const list=data&&"items" in data?data:null;
 const detail=data&&"gift" in data?data:null;
 const scope=[baseScope,selected.id,selected.cursor,data?.organization.id].join("|");
 const scopeRef=useRef(scope);scopeRef.current=scope;
 const gate=useRef(createScopedActionGate());
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 useLayoutEffect(()=>{gate.current.bind(scope);setBusy(false);setNotice("");setError("");return()=>gate.current.invalidate();},[scope]);
 const align=isRTL?"right":"left";
 const textStyle={textAlign:align} as const;
 const canAct=allowed&&!sessionLoading&&!resource.loading&&!!data&&!resource.error;
 function timestamp(value:string){const date=gatheringLocalTime(value,null,data?.organization.timeZone,language);return date?date.text+" · "+t("giving.zone")+": "+date.timeZone:t("giving.timeUnavailable");}
 async function cancel(gift:Gift,expectedScope:string){
  if(scopeRef.current!==expectedScope||!canAct||detail?.gift.id!==gift.id||gift.status==="cancelled")return;
  const ticket=gate.current.begin();if(ticket===null)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await apiPost<{giftId:string;status:string;cancelled:boolean;pending:boolean}>("donations/recurring/"+encodeURIComponent(gift.id)+"/cancel",{confirm:true});
   if(!gate.current.isCurrent(ticket)||scopeRef.current!==expectedScope)return;
   const outcome=cancellationOutcome(gift.id,response);
   if(outcome===null)throw new Error(t("giving.error"));
   setNotice(t(outcome==="cancelled"?"giving.cancelledNotice":"giving.cancelPending"));
   // Retain the confirmed action receipt. Refresh is explicit so it cannot erase it.
  }catch(e){if(gate.current.isCurrent(ticket))setError(e instanceof Error?e.message:t("giving.error"));}
  finally{if(gate.current.finish(ticket))setBusy(false);}
 }
 function confirmCancel(gift:Gift){const expectedScope=scope;Alert.alert(t("giving.cancelTitle"),t("giving.cancelTerms"),[{text:t("giving.dismiss"),style:"cancel"},{text:t("giving.cancel"),style:"destructive",onPress:()=>void cancel(gift,expectedScope)}]);}
 function giftSummary(gift:Gift){return <><Text style={[S.headline,textStyle]}>{gift.campaign.title}</Text><Text style={[S.label,textStyle]}>{givingMoney(gift.amountMinor,gift.currency,language)} · {t("giving.monthly")}</Text><Text style={[S.bodyText,textStyle]}>{t(giftStatusKey(gift.status))}</Text><Text style={[S.muted,textStyle]}>{timestamp(gift.createdAt)}</Text>{gift.cancelRequestedAt&&gift.status!=="cancelled"?<Text style={[S.muted,textStyle]}>{t("giving.cancelPending")}</Text>:null}</>;}
 function restart(){setSelection({scope:baseScope,id:selected.id,cursor:""});void resource.refresh();}
 return <Shell>
 <Action secondary icon="arrow-left" label={t(selected.id?"giving.backList":"giving.back")} onPress={()=>selected.id?setSelection({scope:baseScope,id:null,cursor:""}):router.back()}/>
 <Head eyebrow={t("giving.eyebrow")} title={t("giving.manageTitle")} subtitle={data?.organization.name||t("giving.subtitle")}/>
 {!surface.allowed?<MemberScopeNotice {...surface}/>:null}
 {!sessionLoading&&!user?.isVerified?<Card><Text style={[S.bodyText,textStyle]}>{t("giving.verify")}</Text><Action label={t("giving.signIn")} onPress={()=>router.push("/auth")}/></Card>:null}
 <Feedback loading={sessionLoading||resource.loading} error={resource.error} empty={!!list&&!list.items.length} refresh={restart}/>
 {list?.items.map(gift=><Card key={gift.id} style={{gap:12}}>{giftSummary(gift)}<Action secondary label={t("giving.history")} onPress={()=>setSelection({scope:baseScope,id:gift.id,cursor:""})}/></Card>)}
 {detail?<><Card style={{gap:12}}>{giftSummary(detail.gift)}<Text style={[S.muted,textStyle]}>{t("giving.cancelTerms")}</Text>{detail.gift.status!=="cancelled"?<Action secondary disabled={!canAct||busy} loading={busy} label={t("giving.cancel")} onPress={()=>confirmCancel(detail.gift)}/>:null}</Card>
 {!detail.installments.length?<Text style={[S.muted,textStyle]}>{t("giving.noInstallments")}</Text>:null}
 {detail.installments.map(invoice=><Card key={invoice.invoiceId} style={{gap:8}}><Text style={[S.label,textStyle]}>{givingMoney(invoice.amountMinor,invoice.currency,language)}</Text><Text style={[S.bodyText,textStyle]}>{t(invoice.status==="refunded"?"giving.invoiceRefunded":invoice.status==="paid"?"giving.invoicePaid":invoice.status==="failed"||invoice.status==="uncollectible"?"giving.invoiceFailed":"giving.invoicePending")}</Text><Text style={[S.muted,textStyle]}>{timestamp(invoice.createdAt)}</Text>{hasFinalGivingReceipt(invoice)?<Action secondary disabled={!canAct} label={t("giving.receipt")} onPress={()=>{if(scopeRef.current===scope)router.push({pathname:"/receipt/[id]",params:{id:invoice.receiptId!}});}}/>:<Text style={[S.muted,textStyle]}>{t("giving.noReceipt")}</Text>}</Card>)}</>:null}
 {notice?<Text accessibilityLiveRegion="polite" style={[S.bodyText,textStyle]}>{notice}</Text>:null}
 {error?<Text accessibilityRole="alert" style={{color:T.danger,...textStyle}}>{error}</Text>:null}
 {data?.nextCursor?<Action secondary disabled={!canAct||busy} label={t("giving.more")} onPress={()=>setSelection({scope:baseScope,id:selected.id,cursor:data.nextCursor!})}/>:null}
 {data?<Action secondary disabled={busy} label={t("giving.restart")} onPress={restart}/>:null}
 </Shell>;
}
