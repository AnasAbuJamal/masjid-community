import React,{useState} from "react";
import {Text,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Action,Card,Feedback,Field,Head,PressRow,Shell} from "../../../src/ui";
import {S,T} from "../../../src/theme";
import {useResource} from "../../../src/useResource";
import {api,apiPost} from "../../../src/api";
import {useSession} from "../../../src/session";
import {memberSurfaceScope,allowPilotContent,type MembershipSearchContext} from "../../../src/searchScope";
import {MemberScopeNotice} from "../../../src/MemberScopeNotice";
type RecordItem={milestones?:{id:string;title:string;description:string;completedAt:string|null}[];id:string;title:string;description?:string;body?:string;purpose?:string;company?:string;location?:string;startAt?:string;startsAt?:string;capacity?:number|null;rsvpCount?:number;waitlistEnabled?:boolean;filled?:number;publishedAt?:string;currency?:string};
type Result={items:RecordItem[];organization?:{name:string;timeZone?:string}};
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
// Use the mosque's IANA timezone for trusted gatherings when supplied by the
// selected membership API. If the native Intl runtime cannot format that zone,
// show the real UTC instant rather than a guessed local wall-clock time.
function gatheringTime(value:string,timeZone?:string){
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return "Schedule unavailable";
 if(!timeZone)return date.toLocaleString()+" (device time)";
 try{
  return new Intl.DateTimeFormat(undefined,{
   dateStyle:"medium",timeStyle:"short",timeZone
  }).format(date)+" ("+timeZone+")";
 }catch{return date.toISOString()+" (UTC)";}
}
export default function Details(){
 const params=useLocalSearchParams<{kind:string;id:string}>();
 const kind=String(params.kind||""),id=String(params.id||"all");
 const config=categories[kind];
 const {user}=useSession();
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
 const path=user?.isVerified&&selectedRead
  ?authorizedSelected
   ?kind==="events"?"events/catalog"+(id==="all"
      ?(settledSearch.length>=2?"?q="+encodeURIComponent(settledSearch):"")
      :"?eventId="+encodeURIComponent(id))
    :"organizations/view?resource="+kind+(id==="all"?"":"&itemId="+encodeURIComponent(id))
   :null
  :pilotContent?"public/"+(config?kind:"events"):null;
 const result=useResource<Result>(path);
 const own=useResource<OwnRegistration>(kind==="events"&&id!=="all"&&user?.isVerified&&authorizedSelected?`events/registration?eventId=${encodeURIComponent(id)}`:null);
 const [message,setMessage]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[letter,setLetter]=useState(""),[from,setFrom]=useState(""),[to,setTo]=useState("");
 const item=result.data?.items.find(x=>x.id===id);
 async function perform(){
  if(blocked){setError("This action is unavailable at your selected mosque.");return;}
  if(!user){router.push("/auth");return;}
  if(!user.isVerified){setError("Verify your email before participating.");return;}
  if(!item)return;
  setBusy(true);setError("");setMessage("");
  try{
   const input=kind==="events"?{kind:"rsvp",eventId:item.id}
    :kind==="volunteers"?{kind:"volunteer",opportunityId:item.id}
    :kind==="proposals"?{kind:"vote",proposalId:item.id}
    :kind==="jobs"?{kind:"job",jobId:item.id,coverLetter:letter}
    :kind==="rentals"?{kind:"rental",resourceId:item.id,startAt:new Date(from).toISOString(),endAt:new Date(to).toISOString()}
    :null;
   if(!input)return;
   const response=await apiPost<{message?:string;status?:string}>("actions",input);
   setMessage(response.message||"Your request was received and saved.");
   if(kind==="events")await own.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Request unsuccessful.");}
  finally{setBusy(false);}
 }
 async function cancelEvent(){
  if(!item||!user?.isVerified)return;
  setBusy(true);setError("");setMessage("");
  try{
   await api("events/rsvp",{method:"DELETE",body:JSON.stringify({eventId:item.id})});
   await own.refresh();
   setMessage("You have left the gathering reservation list.");
  }catch(e){setError(e instanceof Error?e.message:"Could not cancel your reservation.");}
  finally{setBusy(false);}
 }
 const iconName=kind==="events"?"calendar-check-outline":kind==="volunteers"?"hand-heart-outline":kind==="proposals"?"vote-outline":kind==="jobs"?"briefcase-outline":"calendar-plus";
 return <Shell>
  <Action label="Back" secondary icon="arrow-left" onPress={()=>router.back()}/>
  <Head eyebrow="DISCOVER · COMMUNITY" title={id==="all"?(config?.label||"Discover"):(item?.title||"Community")} subtitle={kind==="events"&&result.data?.organization?.name?result.data.organization.name:id==="all"?config?.subtitle:"Published by the mosque."}/>
  {kind==="events"&&id==="all"&&user?.isVerified?
   <View style={{gap:6}}><Field label="Search gatherings by name or location" value={search} onChange={setSearch}/>
    {search.trim().length===1?<Text style={S.muted}>Enter at least two characters to search.</Text>:null}
   </View>:null}
  {blocked?<MemberScopeNotice scope={scope} loading={context.loading} error={context.error} refresh={context.refresh}/>:null}
  {!blocked?<Feedback loading={result.loading} error={result.error} empty={!result.data?.items.length} refresh={result.refresh}/>:null}
  {!blocked&&(id==="all")?<View style={S.section}>{result.data?.items.map(x=><PressRow key={x.id} title={x.title} subtitle={x.description||x.body||x.purpose||x.company||"View details and next steps"} icon="chevron-right-circle-outline" onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind,id:x.id}})}/>)}</View>
  :!blocked&&item?<Card style={{gap:18}}><Text style={S.headline}>{item.title}</Text><Text style={S.bodyText}>{item.description||item.body||item.purpose||""}</Text>
   {item.location?<Text style={S.muted}>Location: {item.location}</Text>:null}
   {item.startAt||item.startsAt?<Text style={S.muted}>Date: {kind==="events"?gatheringTime(item.startAt||item.startsAt||"",result.data?.organization?.timeZone):new Date(item.startAt||item.startsAt||"").toLocaleString()}</Text>:null}
   {kind==="events"&&item.capacity!==null&&item.capacity!==undefined?
    <Text style={S.muted}>{item.rsvpCount??0} of {item.capacity} places confirmed · {item.waitlistEnabled?"Waitlist available if full":"No waitlist"}</Text>:null}
   {kind==="events"&&user?.isVerified&&own.data?.registration?
    <Text style={[S.label,{color:T.deep}]} accessibilityRole="text">
     Your registration: {own.data.registration.status==="waitlisted"?"Waitlisted — not confirmed":own.data.registration.checkedInAt?"Checked in — arrival confirmed":"Confirmed place"}
    </Text>:null}
   {kind==="events"&&own.data?.registration?.checkedInAt?
    <Text style={S.muted}>Arrival recorded {new Date(own.data.registration.checkedInAt).toLocaleString()}. If this is incorrect, contact an assigned host for an audited correction.</Text>:null}
   {kind==="events"&&user?.isVerified&&own.error?
    <Text accessibilityRole="alert" style={{color:T.danger}}>{own.error}</Text>:null}
   {item.company?<Text style={S.muted}>Organization: {item.company}</Text>:null}
   {item.milestones?.length?<View style={{gap:12}}><Text style={S.headline}>Project milestones</Text>{item.milestones.map(m=><Card key={m.id} style={{gap:6}}><Text style={S.label}>{m.title}</Text><Text style={S.bodyText}>{m.description}</Text><Text style={S.muted}>{m.completedAt?"Completed "+new Date(m.completedAt).toLocaleDateString():"In progress"}</Text></Card>)}</View>:null}
   {kind==="jobs"?<Field label="Cover letter (minimum 10 characters)" value={letter} onChange={setLetter} multiline/>:null}
   {kind==="rentals"?<><Field label="Start (ISO date/time)" value={from} onChange={setFrom}/><Field label="End (ISO date/time)" value={to} onChange={setTo}/></>:null}
   {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
   {message?<Text style={{color:T.success}}>{message}</Text>:null}
   {kind==="events"&&user?.isVerified&&own.data?.registration?
     <Action label={own.data.registration.status==="waitlisted"?"Leave waitlist":"Cancel my reservation"}
      secondary disabled={busy||own.loading||!!own.data.registration.checkedInAt} loading={busy} icon="calendar-remove-outline" onPress={()=>void cancelEvent()}/>
    :null}
   {kind==="campaigns"?<Action label="Choose a donation" icon="heart-outline" onPress={()=>router.push({pathname:"/giving/[id]",params:{id:item.id}})}/>
    :["events","volunteers","proposals","jobs","rentals"].includes(kind)&&!(kind==="events"&&user?.isVerified&&own.data?.registration)?<Action label={!user?"Sign in to participate":kind==="events"?(item.capacity!==null&&item.capacity!==undefined&&(item.rsvpCount??0)>=item.capacity?(item.waitlistEnabled?"Join event waitlist":"Event full — no waitlist"):"RSVP to event"):kind==="volunteers"?"Apply to volunteer":kind==="proposals"?"Support this proposal":kind==="jobs"?"Send application":"Request booking"} loading={busy} disabled={own.loading||(kind==="events"&&item.capacity!==null&&item.capacity!==undefined&&(item.rsvpCount??0)>=item.capacity&&!item.waitlistEnabled)} icon={iconName} onPress={()=>void perform()}/>
    :null}
  </Card>:null}
 </Shell>;
}
