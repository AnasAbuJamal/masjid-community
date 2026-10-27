import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,PressRow,Shell} from "../../src/ui";
import {useResource} from "../../src/useResource";
import {S,T} from "../../src/theme";
type Prayer={fajr:string;sunrise:string;dhuhr:string;asr:string;maghrib:string;isha:string;localDate:string;source:string};
type Home={organization:{id:string;name:string;timeZone:string}|null;prayer:Prayer|null;announcements:{id:string;title:string;body:string}[];events:{id:string;title:string;startAt:string;location:string}[]};
export default function HomeScreen(){
 const {data,loading,error,refresh}=useResource<Home>("public/home");
 const prayers:[keyof Prayer,string][]=[["fajr","Fajr"],["dhuhr","Dhuhr"],["asr","Asr"],["maghrib","Maghrib"],["isha","Isha"]];
 const next=data?.prayer?prayers.find(([k])=>{const v=data.prayer?.[k]||"";if(!/^\d{2}:\d{2}$/.test(v))return false;
  const tz=data.organization?.timeZone||"America/New_York";
  const clock=new Intl.DateTimeFormat("en-US",{hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:tz}).format(new Date());
  return v>clock;
 }):null;
 return <Shell>
  <Head eyebrow="MASJID COMMUNITY" title="Assalamu alaikum." subtitle="A thoughtful space to stay close to your mosque, wherever you are."/>
  <Feedback loading={loading} error={error} empty={!data?.organization} refresh={refresh}/>
  {data?.organization?<Card style={{padding:0,overflow:"hidden"}}>
   <View style={{backgroundColor:T.deep,padding:25,gap:12}}>
    <Text style={{color:"#CFEAFE",fontSize:12,letterSpacing:1.7,fontWeight:"800"}}>TODAY AT {data.organization.name.toUpperCase()}</Text>
    <Text style={{fontSize:31,fontWeight:"800",color:"white",letterSpacing:-1}}>{next?next[1]+" · "+data.prayer?.[next[0]]:"Prayer schedule"}</Text>
    <Text style={{color:"#DDF2FF",fontSize:14}}>{data.prayer?data.prayer.localDate+" · "+data.prayer.source:"No published times for today"}</Text>
   </View>
   <View style={{padding:16}}><Action label="Explore Salah" icon="clock-outline" onPress={()=>router.push("/salah")} secondary/></View>
  </Card>:null}
  <View style={S.section}><Text style={S.headline}>Quickly get involved</Text>
   <View style={{gap:9}}><PressRow icon="calendar-heart" title="Community events" subtitle="Gatherings, classes and opportunities" onPress={()=>router.push("/details/events/all")}/>
   <PressRow icon="heart-outline" title="Support your community" subtitle="Giving campaigns and real receipts" onPress={()=>router.push("/details/campaigns/all")}/>
   <PressRow icon="hands-pray" title="Salah and Qibla" subtitle="Published prayer times and direction" onPress={()=>router.push("/salah")}/></View>
  </View>
  {data?.announcements?.length?<View style={S.section}><Text style={S.headline}>From the mosque</Text>{data.announcements.map(a=><Card key={a.id}><Text style={S.label}>{a.title}</Text><Text style={[S.bodyText,{marginTop:7}]} numberOfLines={3}>{a.body}</Text></Card>)}</View>:null}
  {data?.events?.length?<View style={S.section}><Text style={S.headline}>Coming together</Text>{data.events.map(e=><PressRow key={e.id} title={e.title} subtitle={new Date(e.startAt).toLocaleString()+" · "+e.location} icon="calendar-check-outline" onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind:"events",id:e.id}})}/>)}</View>:null}
 </Shell>;
}
