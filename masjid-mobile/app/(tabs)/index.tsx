import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,PressRow,Shell} from "../../src/ui";
import {useResource} from "../../src/useResource";
import {S,T} from "../../src/theme";
import {useLanguage} from "../../src/i18n";
import {useVenue} from "../../src/venue";
import {VenuePicker} from "../../src/VenuePicker";
import {nextPublishedPrayer} from "../../src/nextPrayer";
type Prayer={fajr:string;sunrise:string;dhuhr:string;asr:string;maghrib:string;isha:string;localDate:string;source:string};
type Home={organization:{id:string;name:string;timeZone:string}|null;venue:{id:string;name:string;timeZone:string}|null;prayer:Prayer|null;announcements:{id:string;title:string;body:string}[];events:{id:string;title:string;startAt:string;location:string}[]};
export default function HomeScreen(){
 const {t}=useLanguage();
 const {venue,ready}=useVenue();
 const path=ready?(venue?`public/home?venueId=${encodeURIComponent(venue.id)}`:"public/home"):null;
 const {data,loading,error,refresh}=useResource<Home>(path);
 // Recheck the clock while Today is open; never call yesterday's prayer "next".
 const [now,setNow]=React.useState(()=>new Date());
 React.useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60_000);return()=>clearInterval(timer)},[]);
 const next=nextPublishedPrayer(data?.prayer,data?.venue?.timeZone||data?.organization?.timeZone,now);
 const prayerNames={fajr:t("prayer.fajr"),dhuhr:t("prayer.dhuhr"),asr:t("prayer.asr"),maghrib:t("prayer.maghrib"),isha:t("prayer.isha")};
 return <Shell>
  <Head eyebrow={t("home.eyebrow")} title={t("home.title")} subtitle={t("home.subtitle")}/>
  <Feedback loading={loading||!ready} error={error} empty={ready&&!data?.organization} refresh={refresh}/>
  <VenuePicker/>
  {data?.organization?<Card style={{padding:0,overflow:"hidden"}}>
   <View style={{backgroundColor:T.deep,padding:25,gap:12}}>
    <Text style={{color:"#CFEAFE",fontSize:12,letterSpacing:1.7,fontWeight:"800"}}>{t("home.today")} · {data.organization.name}</Text>
    <Text style={{fontSize:31,fontWeight:"800",color:"white",letterSpacing:-1}}>{next?prayerNames[next.name]+" · "+next.time:t("home.prayerSchedule")}</Text>
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
