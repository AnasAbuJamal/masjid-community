import React,{useState} from "react";
import {Text,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Action,Card,Feedback,Field,Head,PressRow,Shell} from "../../../src/ui";
import {S,T} from "../../../src/theme";
import {useResource} from "../../../src/useResource";
import {apiPost} from "../../../src/api";
import {useSession} from "../../../src/session";
type RecordItem={id:string;title:string;description?:string;body?:string;purpose?:string;company?:string;location?:string;startAt?:string;startsAt?:string;capacity?:number;filled?:number;publishedAt?:string;currency?:string};
type Result={items:RecordItem[]};
const categories:{[key:string]:{label:string;subtitle:string}}={
 events:{label:"Events",subtitle:"Discover upcoming gatherings."},
 announcements:{label:"Announcements",subtitle:"Published news from the mosque."},
 campaigns:{label:"Giving campaigns",subtitle:"Support the mosque's published initiatives."},
 volunteers:{label:"Volunteer",subtitle:"Give your time to meaningful work."},
 programs:{label:"School programs",subtitle:"Learn with the community."},
 jobs:{label:"Jobs",subtitle:"Published opportunities."},
 proposals:{label:"Proposals",subtitle:"Share your voice in community projects."},
 rentals:{label:"Facilities",subtitle:"Resources available to request."},
};
export default function Details(){
 const params=useLocalSearchParams<{kind:string;id:string}>();
 const kind=String(params.kind||""),id=String(params.id||"all");
 const config=categories[kind];
 const path="public/"+(config?kind:"events");
 const result=useResource<Result>(path);
 const {user}=useSession();
 const [message,setMessage]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[letter,setLetter]=useState(""),[from,setFrom]=useState(""),[to,setTo]=useState("");
 const item=result.data?.items.find(x=>x.id===id);
 async function perform(){
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
   const response=await apiPost<{message?:string}>("actions",input);
   setMessage(response.message||"Your request was received and saved.");
  }catch(e){setError(e instanceof Error?e.message:"Request unsuccessful.");}
  finally{setBusy(false);}
 }
 const iconName=kind==="events"?"calendar-check-outline":kind==="volunteers"?"hand-heart-outline":kind==="proposals"?"vote-outline":kind==="jobs"?"briefcase-outline":"calendar-plus";
 return <Shell>
  <Action label="Back" secondary icon="arrow-left" onPress={()=>router.back()}/>
  <Head eyebrow="DISCOVER · COMMUNITY" title={id==="all"?(config?.label||"Discover"):(item?.title||"Community")} subtitle={id==="all"?config?.subtitle:"Published by the mosque."}/>
  <Feedback loading={result.loading} error={result.error} empty={!result.data?.items.length} refresh={result.refresh}/>
  {id==="all"?<View style={S.section}>{result.data?.items.map(x=><PressRow key={x.id} title={x.title} subtitle={x.description||x.body||x.purpose||x.company||"View details and next steps"} icon="chevron-right-circle-outline" onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind,id:x.id}})}/>)}</View>
  :item?<Card style={{gap:18}}><Text style={S.headline}>{item.title}</Text><Text style={S.bodyText}>{item.description||item.body||item.purpose||""}</Text>
   {item.location?<Text style={S.muted}>Location: {item.location}</Text>:null}
   {item.startAt||item.startsAt?<Text style={S.muted}>Date: {new Date(item.startAt||item.startsAt||"").toLocaleString()}</Text>:null}
   {item.company?<Text style={S.muted}>Organization: {item.company}</Text>:null}
   {kind==="jobs"?<Field label="Cover letter (minimum 10 characters)" value={letter} onChange={setLetter} multiline/>:null}
   {kind==="rentals"?<><Field label="Start (ISO date/time)" value={from} onChange={setFrom}/><Field label="End (ISO date/time)" value={to} onChange={setTo}/></>:null}
   {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
   {message?<Text style={{color:T.success}}>{message}</Text>:null}
   {kind==="campaigns"?<Action label="Choose a donation" icon="heart-outline" onPress={()=>router.push({pathname:"/giving/[id]",params:{id:item.id}})}/>
    :["events","volunteers","proposals","jobs","rentals"].includes(kind)?<Action label={!user?"Sign in to participate":kind==="events"?"RSVP to event":kind==="volunteers"?"Apply to volunteer":kind==="proposals"?"Support this proposal":kind==="jobs"?"Send application":"Request booking"} loading={busy} icon={iconName} onPress={()=>void perform()}/>
    :null}
  </Card>:null}
 </Shell>;
}
