import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,PressRow,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useLanguage} from "../../src/i18n";
import {useResource} from "../../src/useResource";
import {useSession} from "../../src/session";
import {useVenue} from "../../src/venue";
import {VenuePicker} from "../../src/VenuePicker";
import {VenueEmergencyAlert} from "../../src/VenueEmergencyAlert";
import {useVenueSafetyRefresh} from "../../src/useVenueSafetyRefresh";
import {scheduleRevisionTime} from "../../src/schedule-revision-time";

type Day={
 id:string;localDate:string;fajr:string;sunrise:string;dhuhr:string;
 asr:string;maghrib:string;isha:string;fajrIqamah?:string;
 dhuhrIqamah?:string;asrIqamah?:string;maghribIqamah?:string;
 ishaIqamah?:string;source:string;updatedAt:string;
};
type VenueEmergency={id:string;kind:string;title:string;body:string;
 instructions:string;revision:number;expiresAt:string;publishedAt:string};
type Schedule={venue:{id:string;name:string;timeZone:string}|null;
 emergency:VenueEmergency|null;days:Day[];
 jummah:{id:string;ordinal:number;khutbahAt?:string;iqamahAt:string}[]};
const rows:[string,keyof Day,keyof Day|undefined][]=[
 ["Fajr","fajr","fajrIqamah"],["Sunrise","sunrise",undefined],
 ["Dhuhr","dhuhr","dhuhrIqamah"],["Asr","asr","asrIqamah"],
 ["Maghrib","maghrib","maghribIqamah"],["Isha","isha","ishaIqamah"]
];

export default function Salah(){
 const {t,isRTL,language}=useLanguage();
 const {user}=useSession();
 const {venue,ready}=useVenue();
 const base=user?.isVerified?"organizations/view?resource=prayers":"public/prayers";
 const path=ready?(venue?base+(base.includes("?")?"&":"?")+
  "venueId="+encodeURIComponent(venue.id):base):null;
 const {data,loading,error,refresh}=useResource<Schedule>(path);
 useVenueSafetyRefresh(!!path,refresh);
 const day=data?.days[0];
 const revision=day?scheduleRevisionTime(day.updatedAt,data?.venue?.timeZone,language):null;

 return <Shell>
  <Head eyebrow={t("salah.eyebrow")} title={t("salah.title")} subtitle={t("salah.subtitle")}/>
  <Card style={{backgroundColor:"#EAF6FF"}}>
   <Text style={S.overline}>{t("salah.mosque")}</Text>
   <Text style={[S.headline,{marginTop:9,textAlign:isRTL?"right":"left"}]}>
    {data?.venue?.name||t("salah.noVenue")}
   </Text>
   <Text style={[S.muted,{marginTop:7}]}>{data?.venue?.timeZone||t("salah.local")}</Text>
  </Card>
  <VenuePicker/>
  <Feedback loading={loading||!ready} error={error} empty={ready&&!day} refresh={refresh}/>
  {data?.emergency?<VenueEmergencyAlert notice={data.emergency}
   venueName={data.venue?.name} onRefresh={()=>void refresh()}/>:null}
  {day?<Card>
   <View style={[S.row,{marginBottom:16,flexDirection:isRTL?"row-reverse":"row"}]}>
    <Text style={S.label}>{day.localDate}</Text>
    <Text style={S.muted}>{t("salah.adhan")}</Text>
   </View>
   {rows.map(([label,key,iq],index)=>{
    const name=t(label==="Sunrise"?"salah.sunrise":
     label==="Fajr"?"prayer.fajr":label==="Dhuhr"?"prayer.dhuhr":
     label==="Asr"?"prayer.asr":label==="Maghrib"?"prayer.maghrib":"prayer.isha");
    const adhan=day[key]||"—";
    const iqamah=iq?day[iq]:null;
    return <View key={label} accessible
     accessibilityLabel={name+": "+adhan+(iqamah?" · "+t("salah.iqamah")+": "+iqamah:"")}
     style={[S.row,{paddingVertical:14,flexDirection:isRTL?"row-reverse":"row",
      borderBottomWidth:index===rows.length-1?0:1,borderBottomColor:T.line}]}>
     <Text style={[S.label,{fontSize:16,textAlign:isRTL?"right":"left"}]}>{name}</Text>
     <View style={{alignItems:isRTL?"flex-start":"flex-end"}}>
      <Text style={[S.value,{fontSize:21,writingDirection:"ltr"}]}>{adhan}</Text>
      {iqamah?<Text style={S.muted}>{t("salah.iqamah")} {iqamah}</Text>:null}
     </View>
    </View>;
   })}
   <Text style={[S.muted,{marginTop:12,textAlign:isRTL?"right":"left"}]}>
    {t("salah.source")}: {day.source} · {t("salah.updated")}: {revision||t("salah.updateUnavailable")}
   </Text>
  </Card>:null}
  {data?.jummah?.length?<Card>
   <Text style={S.headline}>{t("salah.jummah")}</Text>
   {data.jummah.map(j=><Text key={j.id}
    style={[S.bodyText,{marginTop:9,textAlign:isRTL?"right":"left"}]}>
    {t("salah.session")} {j.ordinal} · {t("salah.iqamah")} {j.iqamahAt}
    {j.khutbahAt?" · "+t("salah.khutbah")+" "+j.khutbahAt:""}
   </Text>)}
  </Card>:null}
  <View style={S.section}>
   <PressRow icon="compass-outline" title={t("salah.qibla")}
    subtitle={t("salah.qiblaSubtitle")} onPress={()=>router.push("/qibla")}/>
   <PressRow icon="moon-waning-crescent" title={t("salah.faith")}
    subtitle={t("salah.faithSubtitle")} onPress={()=>router.push("/faith")}/>
   <PressRow icon="calendar-month-outline" title={t("salah.calendar")}
    subtitle={t("salah.calendarSubtitle")} onPress={()=>router.push("/calendar")}/>
   <Action label={t("salah.refresh")} secondary icon="refresh" onPress={()=>void refresh()}/>
  </View>
 </Shell>;
}
