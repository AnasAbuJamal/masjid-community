import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,PressRow,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useLanguage} from "../../src/i18n";
import {useResource} from "../../src/useResource";
import {useSession} from "../../src/session";
import {useVenue} from "../../src/venue";
import {VenuePicker} from "../../src/VenuePicker";
type Day={id:string;localDate:string;fajr:string;sunrise:string;dhuhr:string;asr:string;maghrib:string;isha:string;fajrIqamah?:string;dhuhrIqamah?:string;asrIqamah?:string;maghribIqamah?:string;ishaIqamah?:string;source:string;updatedAt:string};
type VenueEmergency={id:string;kind:string;title:string;body:string;
 instructions:string;revision:number;expiresAt:string;publishedAt:string};
type Schedule={venue:{id:string;name:string;timeZone:string}|null;
 emergency:VenueEmergency|null;days:Day[];jummah:{id:string;ordinal:number;khutbahAt?:string;iqamahAt:string}[]};
const rows:[string,keyof Day,keyof Day|undefined][]=[["Fajr","fajr","fajrIqamah"],["Sunrise","sunrise",undefined],["Dhuhr","dhuhr","dhuhrIqamah"],["Asr","asr","asrIqamah"],["Maghrib","maghrib","maghribIqamah"],["Isha","isha","ishaIqamah"]];
export default function Salah(){
 const {t}=useLanguage();
 const {user}=useSession();
 const {venue,ready}=useVenue();
 const base=user?.isVerified?"organizations/view?resource=prayers":"public/prayers";
 const path=ready?(venue?base+(base.includes("?")?"&":"?")+"venueId="+encodeURIComponent(venue.id):base):null;
 const {data,loading,error,refresh}=useResource<Schedule>(path);
 React.useEffect(()=>{
  if(!path)return;
  const timer=setInterval(()=>void refresh(),60_000);
  return ()=>clearInterval(timer);
 },[path,refresh]);
 const day=data?.days[0];
 return <Shell>
 <Head eyebrow={t("salah.eyebrow")} title={t("salah.title")} subtitle={t("salah.subtitle")}/>
 <Card style={{backgroundColor:"#EAF6FF"}}>
  <Text style={S.overline}>{t("salah.mosque")}</Text><Text style={[S.headline,{marginTop:9}]}>{data?.venue?.name||t("salah.noVenue")}</Text>
  <Text style={[S.muted,{marginTop:7}]}>{data?.venue?.timeZone||t("salah.local")}</Text>
 </Card>
 <VenuePicker/>
 <Feedback loading={loading||!ready} error={error} empty={ready&&!day} refresh={refresh}/>
 {data?.emergency?<View accessibilityRole="alert">
  <Card style={{backgroundColor:"#FFF1E9",borderWidth:2,borderColor:"#9B3D28",gap:9}}>
   <Text style={{color:"#6C2517",fontWeight:"800"}}>VENUE NOTICE · {data.venue?.name}</Text>
   <Text style={{fontSize:20,fontWeight:"800",color:"#6C2517"}}>{data.emergency.title}</Text>
   <Text style={[S.bodyText,{color:"#522118"}]}>{data.emergency.body}</Text>
   <Text style={[S.bodyText,{color:"#522118",fontWeight:"700"}]}>What to do: {data.emergency.instructions}</Text>
   <Text style={S.muted}>Revision {data.emergency.revision} · Expires {data.emergency.expiresAt} (UTC)</Text>
  </Card>
 </View>:null}
 {day?<Card><View style={[S.row,{marginBottom:16}]}><Text style={S.label}>{day.localDate}</Text><Text style={S.muted}>{t("salah.adhan")}</Text></View>
 {rows.map(([label,key,iq],index)=><View key={label} style={[S.row,{paddingVertical:14,borderBottomWidth:index===rows.length-1?0:1,borderBottomColor:T.line}]}>
  <Text style={[S.label,{fontSize:16}]}>{t(label==="Sunrise"?"salah.sunrise":label==="Fajr"?"prayer.fajr":label==="Dhuhr"?"prayer.dhuhr":label==="Asr"?"prayer.asr":label==="Maghrib"?"prayer.maghrib":"prayer.isha")}</Text><View style={{alignItems:"flex-end"}}><Text style={[S.value,{fontSize:21}]}>{day[key]||"—"}</Text>{iq&&day[iq]?<Text style={S.muted}>Iqamah {day[iq]}</Text>:null}</View>
 </View>)}
 <Text style={[S.muted,{marginTop:12}]}>Source: {day.source} · Updated {new Date(day.updatedAt).toLocaleDateString()}</Text>
 </Card>:null}
 {data?.jummah?.length?<Card><Text style={S.headline}>{t("salah.jummah")}</Text>{data.jummah.map(j=><Text key={j.id} style={[S.bodyText,{marginTop:9}]}>Session {j.ordinal} · {j.iqamahAt} {j.khutbahAt?"· Khutbah "+j.khutbahAt:""}</Text>)}</Card>:null}
 <View style={S.section}><PressRow icon="compass-outline" title={t("salah.qibla")} subtitle={t("salah.qiblaSubtitle")} onPress={()=>router.push("/qibla")}/>
 <PressRow icon="moon-waning-crescent" title={t("salah.faith")} subtitle={t("salah.faithSubtitle")} onPress={()=>router.push("/faith")}/>
 <PressRow icon="calendar-month-outline" title={t("salah.calendar")} subtitle={t("salah.calendarSubtitle")} onPress={()=>router.push("/calendar")}/>
 <Action label={t("salah.refresh")} secondary icon="refresh" onPress={()=>void refresh()}/></View>
 </Shell>;
}
