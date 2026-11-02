import React,{useRef,useState} from "react";
import {Share,Text,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Action,Card,Feedback,Field,Head,PressRow,Shell} from "../../../src/ui";
import {S,T} from "../../../src/theme";
import {useResource} from "../../../src/useResource";
import {api,apiPost,apiCalendar} from "../../../src/api";
import {useSession} from "../../../src/session";
import {memberSurfaceScope,allowPilotContent,type MembershipSearchContext} from "../../../src/searchScope";
import {MemberScopeNotice} from "../../../src/MemberScopeNotice";
import {useVenue} from "../../../src/venue";
import {CATEGORIES,AUDIENCES,ACCESSIBILITY,gatheringCatalogPath,gatheringFilterError,gatheringFilterProblem} from "../../../src/gatheringFilters";
import {gatheringFilterLabelKey,gatheringContentLabelKey,gatheringContentSubtitleKey} from "../../../src/gathering-presentation";
import {useGatheringPages} from "../../../src/useGatheringPages";
import {useLanguage} from "../../../src/i18n";
import {gatheringLocalTime} from "../../../src/gathering-local-time";
import {isGatheringDeadlineClosed} from "../../../src/gathering-deadline";
import {createScopedActionGate} from "../../../src/scoped-action-gate";
import {useVenueSafetyRefresh} from "../../../src/useVenueSafetyRefresh";
type RecordItem={milestones?:{id:string;title:string;description:string;completedAt:string|null}[];id:string;title:string;description?:string;body?:string;purpose?:string;company?:string;location?:string;startAt?:string;endAt?:string|null;startsAt?:string;capacity?:number|null;rsvpCount?:number;waitlistEnabled?:boolean;rsvpDeadlineAt?:string|null;
 cancellationDeadlineAt?:string|null;cancellationTerms?:string|null;filled?:number;publishedAt?:string;currency?:string;
 category?:string|null;audience?:string|null;accessibilityFeatures?:string[];
 accessibilityNotes?:string|null;venue?:{id:string;name:string;timeZone:string}|null};
type Result={items:RecordItem[];organization?:{id?:string;name:string;timeZone?:string};
 hasMore?:boolean;nextCursor?:string|null;pageSize?:number};
type OwnRegistration={eventId:string;registration:{status:string;createdAt:string;checkedInAt:string|null}|null};
const categories:{[key:string]:{label:string;subtitle:string}}={
 events:{label:"Events",subtitle:"Discover upcoming gatherings."},
 announcements:{label:"Announcements",subtitle:"Published news from the mosque."},
 campaigns:{label:"Giving campaigns",subtitle:"Support the mosque's published initiatives."},
 volunteers:{label:"Volunteer",subtitle:"Give your time to meaningful work."},
 programs:{label:"School programs",subtitle:"Learn with the community."},
 jobs:{label:"Jobs",subtitle:"Published opportunities."},
 proposals:{label:"Proposals",subtitle:"Share your voice in community projects."},
 rentals:{label:"Facilities",subtitle:"Resources available to request."},
 articles:{label:"Articles",subtitle:"Published stories from the community."},
 construction:{label:"Construction",subtitle:"Verified building-project updates."},
};
export default function Details(){
 const params=useLocalSearchParams<{kind:string;id:string}>();
 const kind=String(params.kind||""),id=String(params.id||"all");
 const config=categories[kind];
 const {t,language,isRTL}=useLanguage();
 const {user,contextVersion,contextChanging}=useSession();
 const {venues}=useVenue();
 const [category,setCategory]=useState("");
 const [audience,setAudience]=useState("");
 const [accessibility,setAccessibility]=useState("");
 const [filterVenue,setFilterVenue]=useState("");
 const [fromDay,setFromDay]=useState("");
 const [toDay,setToDay]=useState("");
 const context=useResource<MembershipSearchContext>(user?.isVerified?"organizations/context":null);
 const scope=memberSurfaceScope(context.data,!!user?.isVerified);
 const authorizedSelected=scope==="pilot"||scope==="limited";
 const selectedRead=["events","announcements","articles"].includes(kind);
 const pilotContent=allowPilotContent(scope);
 const blocked=!pilotContent&&!(selectedRead&&authorizedSelected);
 const [search,setSearch]=useState("");
 const [settledSearch,setSettledSearch]=useState("");
 React.useEffect(()=>{
  const timer=setTimeout(()=>setSettledSearch(search.trim()),350);
  return ()=>clearTimeout(timer);
 },[search]);
 // Only a verified member can search the currently selected mosque's
 // published gatherings. Changing the filter invalidates useResource results.
 // Guest browsing continues through the original public pilot catalog.
 const safeVenue=venues.some(v=>v.id===filterVenue)?filterVenue:"";
 const filters={query:settledSearch,fromDay,toDay,venueId:safeVenue,category,audience,accessibility};
 const filterError=gatheringFilterError(filters);
 const filterProblem=gatheringFilterProblem(filters);
 const filterErrorKey=filterProblem?({long:"detail.filterErrorLong",start:"detail.filterErrorStart",end:"detail.filterErrorEnd",order:"detail.filterErrorOrder"} as const)[filterProblem]:null;
 const align=isRTL?"right":"left";
 const path=kind==="events"
  ?(user?.isVerified?authorizedSelected?"events/catalog":null:pilotContent?"public/events":null)
    ?id==="all"
     ?gatheringCatalogPath(user?.isVerified?"events/catalog":"public/events",filters)
     :(user?.isVerified?"events/catalog":"public/events")+"?eventId="+encodeURIComponent(id)
    :null
  :user?.isVerified&&selectedRead
   ?authorizedSelected?"organizations/view?resource="+kind+(id==="all"?"":"&itemId="+encodeURIComponent(id)):null
   :pilotContent?"public/"+(config?kind:"events")+
     ((kind==="announcements"||kind==="articles")&&id!=="all"
       ?"?itemId="+encodeURIComponent(id):""):null;
 const result=useResource<Result>(path);
 // A published gathering may change capacity, venue, closure or deadline while
 // someone keeps its detail open. Recheck on foreground and once per minute.
 useVenueSafetyRefresh(kind==="events"&&id!=="all"&&!!path,result.refresh);
 const paged=useGatheringPages<RecordItem>(
  kind==="events"&&id==="all"?path:null,contextVersion,
  kind==="events"&&id==="all"?result.data:null
 );
 const displayItems=kind==="events"&&id==="all"?paged.items:result.data?.items||[];
 const own=useResource<OwnRegistration>(kind==="events"&&id!=="all"&&user?.isVerified&&authorizedSelected?`events/registration?eventId=${encodeURIComponent(id)}`:null);
 const [message,setMessage]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[letter,setLetter]=useState(""),[from,setFrom]=useState(""),[to,setTo]=useState("");
 // One in-flight command belongs to one account, server-selected mosque and
 // detail resource. Switching any of them invalidates its eventual receipt.
 const actionGate=useRef(createScopedActionGate());
 const actionScope=[contextVersion,user?.id||"guest",kind,id,scope,
  context.data?.selectedOrganizationId||"",
  blocked?"blocked":"allowed",contextChanging?"switching":"stable",path||""
 ].join("|");
 React.useLayoutEffect(()=>{
  actionGate.current.bind(actionScope);
  setBusy(false);setError("");setMessage("");
  setLetter("");setFrom("");setTo("");
  return ()=>{actionGate.current.invalidate();};
 },[actionScope]);
 const item=result.data?.items.find(x=>x.id===id);
 const reservationClosed=kind==="events"&&
  isGatheringDeadlineClosed(item?.rsvpDeadlineAt||item?.startAt);
 const cancellationClosed=kind==="events"&&
  isGatheringDeadlineClosed(item?.cancellationDeadlineAt||item?.startAt);
 // Date strings in the UI must use the gathering's own verified timezone,
 // not the venue selected for prayer or the user's device timezone.
 const formatGatheringInstant=(instant:string|null|undefined)=>{
  const display=gatheringLocalTime(instant,item?.venue?.timeZone,
   result.data?.organization?.timeZone,language);
  return display
   ?display.text+" ("+t(display.source==="venue"
     ?"gathering.detailsVenueZone":"gathering.detailsOrganizationZone")+
    ", "+display.timeZone+")"
   :t("gathering.detailsUnknownTime");
 };
 async function perform(){
  if(blocked||contextChanging||!path){setError(t("detail.unavailable"));return;}
  if(!user){router.push("/auth");return;}
  if(!user.isVerified){setError(t("detail.verifyEmail"));return;}
  if(!item)return;
  if(kind==="events"&&isGatheringDeadlineClosed(item.rsvpDeadlineAt||item.startAt)){
   setError(t("detail.rsvpExpired"));return;
  }
  const ticket=actionGate.current.begin();
  if(ticket===null)return; // A synchronous duplicate tap cannot send twice.
  setBusy(true);setError("");setMessage("");
  try{
   const input=kind==="events"?{kind:"rsvp",eventId:item.id}
    :kind==="volunteers"?{kind:"volunteer",opportunityId:item.id}
    :kind==="proposals"?{kind:"vote",proposalId:item.id}
    :kind==="jobs"?{kind:"job",jobId:item.id,coverLetter:letter}
    :kind==="rentals"?{kind:"rental",resourceId:item.id,
       startAt:new Date(from).toISOString(),endAt:new Date(to).toISOString()}
    :null;
   if(!input)return;
   const response=await apiPost<{message?:string;status?:string}>("actions",input);
   if(!actionGate.current.isCurrent(ticket))return;
   if(kind==="events")await own.refresh();
   if(!actionGate.current.isCurrent(ticket))return;
   setMessage(response.message||t("detail.requestSaved"));
  }catch(e){
   if(actionGate.current.isCurrent(ticket))
    setError(e instanceof Error?e.message:t("detail.requestFailed"));
  }finally{
   if(actionGate.current.finish(ticket))setBusy(false);
  }
 }
 async function shareCalendar(){
  if(!item||!user?.isVerified||blocked||contextChanging||!path)return;
  const ticket=actionGate.current.begin();
  if(ticket===null)return;
  setBusy(true);setError("");setMessage("");
  try{
   const ics=await apiCalendar("events/calendar?eventId="+encodeURIComponent(item.id));
   if(!actionGate.current.isCurrent(ticket))return;
   const result=await Share.share({message:ics,title:t("detail.calendarTitle")});
   if(!actionGate.current.isCurrent(ticket))return;
   if(result.action===Share.sharedAction)
    setMessage(t("detail.calendarShared"));
  }catch(e){
   if(actionGate.current.isCurrent(ticket))
    setError(e instanceof Error?e.message:t("detail.calendarFailed"));
  }finally{
   if(actionGate.current.finish(ticket))setBusy(false);
  }
 }
 async function cancelEvent(){
  if(!item||!user?.isVerified||blocked||contextChanging||!path)return;
  if(isGatheringDeadlineClosed(item.cancellationDeadlineAt||item.startAt)){
   setError(t("detail.cancelExpired"));return;
  }
  const ticket=actionGate.current.begin();
  if(ticket===null)return;
  setBusy(true);setError("");setMessage("");
  try{
   await api("events/rsvp",{method:"DELETE",body:JSON.stringify({eventId:item.id})});
   if(!actionGate.current.isCurrent(ticket))return;
   await own.refresh();
   if(!actionGate.current.isCurrent(ticket))return;
   setMessage(t("detail.leftList"));
  }catch(e){
   if(actionGate.current.isCurrent(ticket))
    setError(e instanceof Error?e.message:t("detail.cancelFailed"));
  }finally{
   if(actionGate.current.finish(ticket))setBusy(false);
  }
 }
 const iconName=kind==="events"?"calendar-check-outline":kind==="volunteers"?"hand-heart-outline":kind==="proposals"?"vote-outline":kind==="jobs"?"briefcase-outline":"calendar-plus";
 return <Shell>
  <Action label={t("detail.back")} secondary icon="arrow-left" onPress={()=>router.back()}/>
  <Head eyebrow={t("detail.eyebrow")} title={id==="all"?t(gatheringContentLabelKey(kind)):(item?.title||t("detail.titleFallback"))} subtitle={kind==="events"&&result.data?.organization?.name?result.data.organization.name:id==="all"?t(gatheringContentSubtitleKey(kind)):t("detail.published")}/>
  {kind==="events"&&id==="all"&&!blocked?
   <Card style={{gap:10}}>
    <Field label={t("detail.searchLabel")} value={search} onChange={setSearch}/>
    {search.trim().length===1?<Text style={[S.muted,{textAlign:align}]}>{t("detail.searchMinimum")}</Text>:null}
    <Text style={[S.label,{textAlign:align}]}>{t("detail.filterCategory")}</Text>
    <View style={{flexDirection:isRTL?"row-reverse":"row",flexWrap:"wrap",gap:6}}>{CATEGORIES.map(([value])=>
     <Action key={value||"all"} label={t(gatheringFilterLabelKey("category",value))} secondary={category!==value} onPress={()=>setCategory(value)}/>)}</View>
    <Text style={[S.label,{textAlign:align}]}>{t("detail.filterAudience")}</Text>
    <View style={{flexDirection:isRTL?"row-reverse":"row",flexWrap:"wrap",gap:6}}>{AUDIENCES.map(([value])=>
     <Action key={value||"any"} label={t(gatheringFilterLabelKey("audience",value))} secondary={audience!==value} onPress={()=>setAudience(value)}/>)}</View>
    <Text style={[S.label,{textAlign:align}]}>{t("detail.filterAccessibility")}</Text>
    <View style={{flexDirection:isRTL?"row-reverse":"row",flexWrap:"wrap",gap:6}}>{ACCESSIBILITY.map(([value])=>
     <Action key={value||"any"} label={t(gatheringFilterLabelKey("accessibility",value))} secondary={accessibility!==value} onPress={()=>setAccessibility(value)}/>)}</View>
    <Text style={[S.label,{textAlign:align}]}>{t("detail.filterVenue")}</Text>
    <View style={{flexDirection:isRTL?"row-reverse":"row",flexWrap:"wrap",gap:6}}>
     <Action label={t("detail.anyVenue")} secondary={!!safeVenue} onPress={()=>setFilterVenue("")}/>
     {venues.map(v=><Action key={v.id} label={v.name} secondary={safeVenue!==v.id}
      onPress={()=>setFilterVenue(v.id)}/>)}
    </View>
    <Field label={t("detail.fromDate")} value={fromDay} onChange={setFromDay}/>
    <Field label={t("detail.toDate")} value={toDay} onChange={setToDay}/>
    <Text style={[S.muted,{textAlign:align}]}>{t("detail.filterDisclaimer")}</Text>
    {filterErrorKey?<Text accessibilityRole="alert" style={{color:T.danger,textAlign:align}}>{t(filterErrorKey)}</Text>:null}
   </Card>:null}
  {blocked?<MemberScopeNotice scope={scope} loading={context.loading} error={context.error} refresh={context.refresh}/>:null}
  {!blocked?<Feedback loading={result.loading} error={result.error} empty={!result.data?.items.length} refresh={result.refresh}/>:null}
  {!blocked&&(id==="all")?<View style={S.section}>
   {displayItems.map(x=><PressRow key={x.id} title={x.title}
    subtitle={x.description||x.body||x.purpose||x.company||t("detail.listEmptySubtitle")}
    icon="chevron-right-circle-outline"
    onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind,id:x.id}})}/>)}
   {kind==="events"&&paged.error?<Card><Text accessibilityRole="alert" style={{color:T.danger}}>{paged.error}</Text>
    <Action label={t("detail.refreshList")} secondary onPress={()=>void result.refresh()}/></Card>:null}
   {kind==="events"&&paged.hasMore?<Action
    label={t(paged.busy?"detail.loadingMore":"detail.loadMore")}
    secondary disabled={paged.busy} icon="chevron-down"
    onPress={()=>void paged.loadMore()}/>:null}
   {kind==="events"&&displayItems.length>0?<Text style={S.muted}>
    {t("detail.showing")} {displayItems.length} {t("detail.publishedGatherings")}{paged.hasMore?" · "+t("detail.moreAvailable"):""}
   </Text>:null}
  </View>
  :!blocked&&item?<Card style={{gap:18}}><Text style={S.headline}>{item.title}</Text><Text style={S.bodyText}>{item.description||item.body||item.purpose||""}</Text>
   {item.location?<Text style={[S.muted,{textAlign:align}]}>{t("detail.location")}: {item.location}</Text>:null}
   {kind==="events"&&item.startAt?<Text style={[S.muted,{textAlign:isRTL?"right":"left"}]}>
    {t("gathering.detailsStarts")}: {formatGatheringInstant(item.startAt)}
   </Text>:item.startAt||item.startsAt?<Text style={[S.muted,{textAlign:align}]}>
    {t("detail.date")}: {new Date(item.startAt||item.startsAt||"").toLocaleString(language==="ar"?"ar-EG":"en-US")}
   </Text>:null}
   {kind==="events"&&item.endAt?<Text style={[S.muted,{textAlign:isRTL?"right":"left"}]}>
    {t("gathering.detailsEnds")}: {formatGatheringInstant(item.endAt)}
   </Text>:null}
   {kind==="events"&&item.capacity!==null&&item.capacity!==undefined?
    <Text style={[S.muted,{textAlign:align}]}>{item.rsvpCount??0} {t("detail.of")} {item.capacity} {t("detail.placesConfirmed")} · {t(item.waitlistEnabled?"detail.waitlistAvailable":"detail.noWaitlist")}</Text>:null}
   {kind==="events"&&item.startAt?<View style={{gap:6}}>
    {item.venue?<Text style={[S.muted,{textAlign:align}]}>{t("detail.venueVerified")}: {item.venue.name}</Text>:null}
    {item.category?<Text style={[S.muted,{textAlign:align}]}>{t("detail.category")}: {t(gatheringFilterLabelKey("category",item.category))}</Text>:null}
    {item.audience?<Text style={[S.muted,{textAlign:align}]}>{t("detail.audience")}: {t(gatheringFilterLabelKey("audience",item.audience))}</Text>:null}
    {item.accessibilityFeatures?.length?<Text style={[S.muted,{textAlign:align}]}>{t("detail.accessibility")}: {item.accessibilityFeatures.map(x=>t(gatheringFilterLabelKey("accessibility",x))).join(", ")}</Text>
     :<Text style={[S.muted,{textAlign:align}]}>{t("detail.accessibilityUnverified")}</Text>}
    {item.accessibilityNotes?<Text style={[S.bodyText,{textAlign:align}]}>{t("detail.accommodation")}: {item.accessibilityNotes}</Text>:null}
    <Text style={[S.muted,{textAlign:isRTL?"right":"left"}]}>
     {t("gathering.detailsRsvpCloses")}: {formatGatheringInstant(item.rsvpDeadlineAt||item.startAt)}
     {reservationClosed?" · "+t("gathering.detailsClosed"):""}
    </Text>
    <Text style={[S.muted,{textAlign:isRTL?"right":"left"}]}>
     {t("gathering.detailsCancelCloses")}: {formatGatheringInstant(item.cancellationDeadlineAt||item.startAt)}
     {cancellationClosed?" · "+t("gathering.detailsClosed"):""}
    </Text>
    <Text style={[S.bodyText,{textAlign:align}]}>{item.cancellationTerms||t("detail.cancellationDefault")}</Text>
   </View>:null}
   {kind==="events"&&user?.isVerified&&own.data?.registration?
    <Text style={[S.label,{color:T.deep}]} accessibilityRole="text">
     {t("detail.registration")}: {t(own.data.registration.status==="waitlisted"?"detail.waitlisted":own.data.registration.checkedInAt?"detail.checkedIn":"detail.confirmed")}
    </Text>:null}
   {kind==="events"&&own.data?.registration?.checkedInAt?
    <Text style={[S.muted,{textAlign:isRTL?"right":"left"}]}>
     {t("gathering.detailsArrival")}: {formatGatheringInstant(own.data.registration.checkedInAt)}
    </Text>:null}
   {kind==="events"&&user?.isVerified&&own.error?
    <Text accessibilityRole="alert" style={{color:T.danger}}>{own.error}</Text>:null}
   {item.company?<Text style={S.muted}>Organization: {item.company}</Text>:null}
   {item.milestones?.length?<View style={{gap:12}}><Text style={S.headline}>Project milestones</Text>{item.milestones.map(m=><Card key={m.id} style={{gap:6}}><Text style={S.label}>{m.title}</Text><Text style={S.bodyText}>{m.description}</Text><Text style={S.muted}>{m.completedAt?"Completed "+new Date(m.completedAt).toLocaleDateString():"In progress"}</Text></Card>)}</View>:null}
   {kind==="jobs"?<Field label="Cover letter (minimum 10 characters)" value={letter} onChange={setLetter} multiline/>:null}
   {kind==="rentals"?<><Field label="Start (ISO date/time)" value={from} onChange={setFrom}/><Field label="End (ISO date/time)" value={to} onChange={setTo}/></>:null}
   {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
   {message?<Text style={{color:T.success}}>{message}</Text>:null}
   {kind==="events"&&user?.isVerified?
    <Action label={t("detail.shareCalendar")} secondary icon="calendar-check-outline"
     disabled={busy||contextChanging||!path} onPress={()=>void shareCalendar()}/>:null}
   {kind==="events"&&user?.isVerified&&own.data?.registration?
     <Action label={t(own.data.registration.status==="waitlisted"?"detail.leaveWaitlist":"detail.cancelReservation")}
      secondary disabled={busy||contextChanging||!path||own.loading||cancellationClosed||!!own.data.registration.checkedInAt} loading={busy} icon="calendar-remove-outline" onPress={()=>void cancelEvent()}/>
    :null}
   {kind==="campaigns"?<Action label="Choose a donation" icon="heart-outline" onPress={()=>router.push({pathname:"/giving/[id]",params:{id:item.id}})}/>
    :["events","volunteers","proposals","jobs","rentals"].includes(kind)&&!(kind==="events"&&user?.isVerified&&own.data?.registration)?<Action label={!user?t("detail.signIn"):kind==="events"&&reservationClosed?t("detail.rsvpClosed"):kind==="events"?(item.capacity!==null&&item.capacity!==undefined&&(item.rsvpCount??0)>=item.capacity?(t(item.waitlistEnabled?"detail.joinWaitlist":"detail.full")):t("detail.rsvp")):kind==="volunteers"?"Apply to volunteer":kind==="proposals"?"Support this proposal":kind==="jobs"?"Send application":"Request booking"} loading={busy} disabled={busy||contextChanging||!path||own.loading||!!reservationClosed||(kind==="events"&&item.capacity!==null&&item.capacity!==undefined&&(item.rsvpCount??0)>=item.capacity&&!item.waitlistEnabled)} icon={iconName} onPress={()=>void perform()}/>
    :null}
  </Card>:null}
 </Shell>;
}
