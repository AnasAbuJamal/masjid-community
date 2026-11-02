import React,{useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,PressRow,Shell} from "../../src/ui";
import {useSession} from "../../src/session";
import {useResource} from "../../src/useResource";
import {S,T} from "../../src/theme";
import {useLanguage} from "../../src/i18n";
import {api} from "../../src/api";
import {usePilotSurface} from "../../src/usePilotSurface";
import {gatheringLocalTime} from "../../src/gathering-local-time";
import {createScopedActionGate} from "../../src/scoped-action-gate";
import {profileReservationLabelKey,canOfferProfileCancellation} from "../../src/profile-reservation";
type Commitment={id:string;kind:"gathering"|"service_shift";title:string;status:string;startAt:string;eventId?:string};
type Me={organization?:{id:string;name:string;timeZone?:string};upcoming?:Commitment[];bookings:{id:string;status:string;startAt:string;resource:{title:string}}[];volunteerApplications:{id:string;status:string;opportunity:{title:string}}[];jobApplications:{id:string;status:string;job:{title:string}}[];donations:{id:string;amountMinor:number;status:string;currency:string;campaign:{title:string};receipt:{id:string;receiptNumber:string}|null}[];rsvps:{id:string;status:string;checkedInAt:string|null;event:{id:string;title:string;startAt:string;cancellationDeadlineAt:string|null}}[];notifications:{id:string;title:string;body:string;readAt:string|null}[]};
export default function Profile(){
 const {t,language,isRTL}=useLanguage();
 const {user,logout,sessionExpired,refresh:refreshUser,contextVersion,contextChanging}=useSession();
 const surface=usePilotSurface();
 const pilotAllowed=surface.allowed;
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState("");
 const [nowMs,setNowMs]=useState(()=>Date.now());
 React.useEffect(()=>{
  const timer=setInterval(()=>setNowMs(Date.now()),60_000);
  return ()=>clearInterval(timer);
 },[]);
 // Only read an authenticated, verified member's own mosque records.
 const result=useResource<Me>(user?.isVerified?"me":null);
 const actionGate=React.useRef(createScopedActionGate());
 const actionScope=[contextVersion,user?.id||"guest",contextChanging?"switching":"stable",
  surface.scope].join("|");
 React.useLayoutEffect(()=>{
  actionGate.current.bind(actionScope);
  setBusy("");setError("");setNotice("");
  return ()=>{actionGate.current.invalidate();};
 },[actionScope]);
 const canChange=!!user?.isVerified&&!contextChanging&&!result.loading&&
  !!result.data?.organization?.id&&!result.error&&
  (surface.scope==="pilot"||surface.scope==="limited");
 async function cancel(eventId:string){
  if(!canChange)return;
  const registration=result.data?.rsvps.find(r=>r.event.id===eventId);
  if(!registration||!canOfferProfileCancellation(
   registration.status,registration.checkedInAt,registration.event.startAt,
   registration.event.cancellationDeadlineAt))return;
  const ticket=actionGate.current.begin();
  if(ticket===null)return; // Prevent rapid repeated cancellation commands.
  setBusy(eventId);setError("");setNotice("");
  try{
   const response=await api<{cancelled:boolean;alreadyCancelled:boolean}>(
    "events/rsvp",{method:"DELETE",body:JSON.stringify({eventId})});
   if(!actionGate.current.isCurrent(ticket))return;
   if(response.cancelled!==true)throw new Error(t("profile.cancelUnverified"));
   await result.refresh();
   if(actionGate.current.isCurrent(ticket))setNotice(t("profile.cancelled"));
  }catch(e){
   if(actionGate.current.isCurrent(ticket)){
    setError(t("profile.cancelFailed"));
    await result.refresh();
   }
  }finally{
   if(actionGate.current.finish(ticket))setBusy("");
  }
 }
 function upcomingWhen(iso:string){
  const display=gatheringLocalTime(iso,null,result.data?.organization?.timeZone,language);
  return display?display.text+" ("+t("profile.organizationTime")+", "+display.timeZone+")":
   t("profile.timeUnavailable");
 }
 function commitmentStatus(c:Commitment){
  if(c.kind==="service_shift")return t("profile.shiftScheduled");
  return t(profileReservationLabelKey(c.status,null));
 }
 return <Shell>
 <Head eyebrow={t("profile.eyebrow")} title={user?(language==="ar"?"مرحبًا، "+user.firstName:"Welcome, "+user.firstName+"."):t("profile.guest")} subtitle={user?t("profile.member"):t("profile.subtitle")}/>
 {!user?<Card style={{gap:15}}>
 {sessionExpired?<Text accessibilityRole="alert" style={{color:T.danger}}>
  {t("profile.sessionExpired")}
 </Text>:null}
 <Text style={[S.headline,{textAlign:isRTL?"right":"left"}]}>{t("profile.connect")}</Text><Text style={[S.bodyText,{textAlign:isRTL?"right":"left"}]}>{t("profile.guestHelp")}</Text><Action label={t("profile.login")} icon="account-circle-outline" onPress={()=>router.push("/auth")}/></Card>:
 <><Card style={{gap:9}}><View style={S.row}><Text style={S.label}>{user.firstName} {user.lastName}</Text><Text style={S.muted}>{user.role}</Text></View><Text style={S.muted}>{user.email}</Text><Text style={{fontWeight:"800",color:user.isVerified?T.success:T.danger}}>{user.isVerified?t("common.verified"):t("common.unverified")}</Text>
 {!user.isVerified?<Action secondary label={t("profile.refreshVerification")} onPress={()=>void refreshUser()}/>:null}</Card>
 {result.data?.organization?.name?<Text style={S.muted}>{result.data.organization.name}</Text>:null}
 <Feedback loading={result.loading} error={result.error} empty={false} refresh={result.refresh}/>
 {result.data?.upcoming?.length?<View style={S.section}>
  <Text style={[S.headline,{textAlign:isRTL?"right":"left"}]}>{t("profile.upcoming")}</Text>
  {result.data.upcoming.map(c=>c.kind==="service_shift"&&!pilotAllowed?
   <Card key={c.kind+":"+c.id} style={{gap:6}}>
    <Text style={S.label}>{c.title}</Text>
    <Text style={S.muted}>{upcomingWhen(c.startAt)+" · "+commitmentStatus(c)}</Text>
    <Text style={[S.muted,{textAlign:isRTL?"right":"left"}]}>{t("profile.shiftUnavailable")}</Text>
   </Card>:
   <PressRow key={c.kind+":"+c.id}
    icon={c.kind==="gathering"?"calendar-check-outline":"hand-heart-outline"}
    title={c.title}
    subtitle={upcomingWhen(c.startAt)+" · "+commitmentStatus(c)}
    onPress={()=>c.kind==="gathering"&&c.eventId
     ?router.push({pathname:"/details/[kind]/[id]",params:{kind:"events",id:c.eventId}})
     :router.push("/volunteer/shifts")}/>)}
 </View>:null}
 {result.data?.donations?.length?<View style={S.section}><Text style={S.headline}>{t("profile.giving")}</Text>{result.data.donations.map(d=><Card key={d.id}><Text style={S.label}>{d.campaign.title}</Text><Text style={S.bodyText}>{(d.amountMinor/100).toLocaleString("en-US",{style:"currency",currency:d.currency.toUpperCase()})} · {d.status}</Text>
 {d.receipt&&pilotAllowed?<Action label={t("profile.receipt")+" "+d.receipt.receiptNumber} secondary onPress={()=>router.push({pathname:"/receipt/[id]",params:{id:d.receipt!.id}})}/>:null}</Card>)}</View>:null}
 {result.data?.rsvps?.length?<View style={S.section}><Text style={S.headline}>{t("profile.events")}</Text>{result.data.rsvps.map(r=><Card key={r.id} style={{gap:10}}>
  <Text style={[S.label,{textAlign:isRTL?"right":"left"}]}>{r.event.title}</Text>
  <Text style={[S.muted,{textAlign:isRTL?"right":"left"}]}>
   {upcomingWhen(r.event.startAt)} · {t(profileReservationLabelKey(r.status,r.checkedInAt))}
  </Text>
  {canChange&&canOfferProfileCancellation(r.status,r.checkedInAt,r.event.startAt,
   r.event.cancellationDeadlineAt,nowMs)?<Action
   label={t(r.status==="waitlisted"?"profile.leaveWaitlist":"profile.cancelRsvp")}
   secondary disabled={!!busy||contextChanging} loading={busy===r.event.id}
   onPress={()=>void cancel(r.event.id)}/>:null}
 </Card>)}</View>:null}
 {result.data?.bookings?.length?<View style={S.section}><Text style={S.headline}>{t("profile.bookings")}</Text>{result.data.bookings.map(b=><Card key={b.id}><Text style={S.label}>{b.resource.title}</Text><Text style={S.muted}>{upcomingWhen(b.startAt)} · {b.status}</Text></Card>)}</View>:null}
 {result.data?.volunteerApplications?.length?<View style={S.section}><Text style={S.headline}>{t("profile.volunteer")}</Text>{result.data.volunteerApplications.map(v=><Card key={v.id}><Text style={S.label}>{v.opportunity.title}</Text><Text style={S.muted}>{v.status}</Text></Card>)}</View>:null}
 {result.data?.jobApplications?.length?<View style={S.section}><Text style={S.headline}>{t("profile.jobs")}</Text>{result.data.jobApplications.map(j=><Card key={j.id}><Text style={S.label}>{j.job.title}</Text><Text style={S.muted}>{j.status}</Text></Card>)}</View>:null}
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text accessibilityRole="status" style={{color:T.success}}>{notice}</Text>:null}
 <View style={S.section}><Text style={S.headline}>{t("profile.account")}</Text>
 {!pilotAllowed&&user?.isVerified?<Text style={[S.muted,{textAlign:isRTL?"right":"left"}]}>{t("profile.pilotLimit")}</Text>:null}
 {user.mfaRequired?<PressRow icon="shield-key-outline" title={t("profile.mfaTitle")} subtitle={t("profile.mfaSubtitle")} onPress={()=>router.push("/mfa")}/>:null}
 <PressRow icon="account-cog-outline" title={t("profile.settingsTitle")} subtitle={t("profile.settingsSubtitle")} onPress={()=>router.push("/settings")}/>
 <PressRow icon="lock-reset" title={t("profile.securityTitle")} subtitle={t("profile.securitySubtitle")} onPress={()=>router.push("/recover")}/>
 {pilotAllowed?<PressRow icon="account-group-outline" title={t("profile.circlesTitle")} subtitle={t("profile.circlesSubtitle")} onPress={()=>router.push("/circles")}/>:null}
 {pilotAllowed?<PressRow icon="lightbulb-outline" title={t("profile.proposalsTitle")} subtitle={t("profile.proposalsSubtitle")} onPress={()=>router.push("/community/proposal")}/>:null}
 <PressRow icon="bell-outline" title={t("profile.notificationsTitle")} subtitle={t("profile.notificationsSubtitle")} onPress={()=>router.push("/notifications")}/>
 {pilotAllowed?<PressRow icon="hand-heart-outline" title={t("profile.shiftsTitle")} subtitle={t("profile.shiftsSubtitle")} onPress={()=>router.push("/volunteer/shifts")}/>:null}
 {pilotAllowed?<PressRow icon="school-outline" title={t("profile.schoolTitle")} subtitle={t("profile.schoolSubtitle")} onPress={()=>router.push("/school")}/>:null}
 {pilotAllowed?<PressRow icon="heart-outline" title={t("profile.givingTitle")} subtitle={t("profile.givingSubtitle")} onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind:"campaigns",id:"all"}})}/>:null}
 <Action label={t("profile.signout")} secondary icon="logout" onPress={()=>void logout()}/></View>
 </>}
 </Shell>;
}
