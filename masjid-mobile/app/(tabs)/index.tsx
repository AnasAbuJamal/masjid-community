import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,PressRow,Shell} from "../../src/ui";
import {useResource} from "../../src/useResource";
import {S,T} from "../../src/theme";
import {useLanguage} from "../../src/i18n";
type Prayer={fajr:string;sunrise:string;dhuhr:string;asr:string;maghrib:string;isha:string;localDate:string;source:string};
type Home={organization:{id:string;name:string;timeZone:string}|null;prayer:Prayer|null;announcements:{id:string;title:string;body:string}[];events:{id:string;title:string;startAt:string;location:string}[]};
export default function HomeScreen(){
 const {t}=useLanguage();
 const {data,loading,error,refresh}=useResource<Home>("public/home");
 const prayers:[keyof Prayer,string][]=[["fajr","Fajr"],["dhuhr","Dhuhr"],["asr","Asr"],["maghrib","Maghrib"],["isha","Isha"]];
 const next=data?.prayer?prayers.find(([k])=>{const v=data.prayer?.[k]||"";if(!/^\d{2}:\d{2}$/.test(v))return false;
  const tz=data.organization?.timeZone||"America/New_York";
  const clock=new Intl.DateTimeFormat("en-US",{hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:tz}).format(new Date());
  return v>clock;
 }):null;
 return <Shell>
  <Head eyebrow={t("home.eyebrow")} title={t("home.title")} subtitle={t("home.subtitle")}/>
  <Feedback loading={loading} error={error} empty={!data?.organization} refresh={refresh}/>
  {data?.organization?<Card style={{padding:0,overflow:"hidden"}}>
   <View style={{backgroundColor:T.deep,padding:25,gap:12}}>
    <Text style={{color:"#CFEAFE",fontSize:12,letterSpacing:1.7,fontWeight:"800"}}>{t("home.today")} · {data.organization.name}</Text>
    <Text style={{fontSize:31,fontWeight:"800",color:"white",letterSpacing:-1}}>{next?next[1]+" · "+data.prayer?.[next[0]]:t("home.prayerSchedule")}</Text>
    <Text style={{color:"#DDF2FF",fontSize:14}}>{data.prayer?data.prayer.localDate+" · "+data.prayer.source:t("home.noPrayers")}</Text>
   </View>
   <View style={{padding:16}}><Action label={t("home.explore")} icon="clock-outline" onPress={()=>router.push("/salah")} secondary/></View>
  </Card>:null}
  <View style={S.section}><Text style={S.headline}>{t("home.quick")}</Text>
   <View style={{gap:9}}><PressRow icon="calendar-heart" title={t("home.events")} subtitle={t("home.eventsSubtitle")} onPress={()=>router.push("/details/events/all")}/>
   <PressRow icon="heart-outline" title={t("home.give")} subtitle={t("home.giveSubtitle")} onPress={()=>router.push("/details/campaigns/all")}/>
   <PressRow icon="hands-pray" title={t("home.qibla")} subtitle={t("home.qiblaSubtitle")} onPress={()=>router.push("/salah")}/></View>
  </View>
  {data?.announcements?.length?<View style={S.section}><Text style={S.headline}>{t("home.announcements")}</Text>{data.announcements.map(a=><Card key={a.id}><Text style={S.label}>{a.title}</Text><Text style={[S.bodyText,{marginTop:7}]} numberOfLines={3}>{a.body}</Text></Card>)}</View>:null}
  {data?.events?.length?<View style={S.section}><Text style={S.headline}>{t("home.upcoming")}</Text>{data.events.map(e=><PressRow key={e.id} title={e.title} subtitle={new Date(e.startAt).toLocaleString()+" · "+e.location} icon="calendar-check-outline" onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind:"events",id:e.id}})}/>)}</View>:null}
 </Shell>;
}
