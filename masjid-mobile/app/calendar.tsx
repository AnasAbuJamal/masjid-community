import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../src/ui";
import {S,T} from "../src/theme";
import {useLanguage} from "../src/i18n";
import {useResource} from "../src/useResource";
import {useVenueSafetyRefresh} from "../src/useVenueSafetyRefresh";
import {useSession} from "../src/session";
import {useVenue} from "../src/venue";
import {VenuePicker} from "../src/VenuePicker";
import {
  venueLocalCivilDay,shiftPublishedCivilDay,selectedVenuePrayerDay
} from "../src/prayer-calendar-date";
import {publishedPrayerDayLabel} from "../src/prayer-civil-day";
import {scheduleRevisionTime} from "../src/schedule-revision-time";

type PrayerDay={
 id:string;localDate:string;fajr:string|null;sunrise:string|null;
 dhuhr:string|null;asr:string|null;maghrib:string|null;isha:string|null;
 fajrIqamah?:string|null;dhuhrIqamah?:string|null;asrIqamah?:string|null;
 maghribIqamah?:string|null;ishaIqamah?:string|null;
 source:string;updatedAt:string
};
type Schedule={
 venue:{id:string;name:string;timeZone:string}|null;
 localDate?:string;days:PrayerDay[];
};
const rows=[
 {key:"fajr",label:"prayer.fajr",iqamah:"fajrIqamah"},
 {key:"sunrise",label:"calendar.sunrise",iqamah:null},
 {key:"dhuhr",label:"prayer.dhuhr",iqamah:"dhuhrIqamah"},
 {key:"asr",label:"prayer.asr",iqamah:"asrIqamah"},
 {key:"maghrib",label:"prayer.maghrib",iqamah:"maghribIqamah"},
 {key:"isha",label:"prayer.isha",iqamah:"ishaIqamah"}
] as const;

export default function Calendar(){
 const {t,isRTL,language}=useLanguage();
 const {user}=useSession();
 const {venue,ready}=useVenue();
 const [selection,setSelection]=React.useState<{venueId:string;localDate:string}|null>(null);

 // Date selection belongs to one published venue. Never carry a previous
 // mosque's chosen date into another venue while its catalog is loading.
 React.useEffect(()=>{
  const initial=ready&&venue?venueLocalCivilDay(venue.timeZone):null;
  setSelection(initial&&venue?{venueId:venue.id,localDate:initial}:null);
 },[ready,venue?.id,venue?.timeZone]);

 const date=selectedVenuePrayerDay(selection,ready?venue?.id:null);
 const validToday=venue?venueLocalCivilDay(venue.timeZone):null;
 const base=user?.isVerified?"organizations/view?resource=prayers":"public/prayers";
 const path=date&&validToday&&ready&&venue
  ?base+(base.includes("?")?"&":"?")+"date="+encodeURIComponent(date)+
   "&venueId="+encodeURIComponent(venue.id)
  :null;
 const result=useResource<Schedule>(path);
 // Revalidate publication/retraction after the app resumes or each minute.
 useVenueSafetyRefresh(!!path,result.refresh);

 // Do not render a mismatched response, even when the request generation
 // guard already protects in-flight account and venue changes.
 const matched=!!(path&&venue&&result.data?.venue?.id===venue.id&&
  result.data?.localDate===date);
 const day=matched?result.data?.days[0]:null;
 const formattedDay=date?publishedPrayerDayLabel(date,language):null;
 const revision=day?scheduleRevisionTime(day.updatedAt,venue?.timeZone,language):null;
 const align=isRTL?"right":"left";

 function changeDay(delta:-1|1){
  if(!date||!venue)return;
  const next=shiftPublishedCivilDay(date,delta);
  if(next)setSelection({venueId:venue.id,localDate:next});
 }
 function backToToday(){
  const today=venue?venueLocalCivilDay(venue.timeZone):null;
  if(today&&venue)setSelection({venueId:venue.id,localDate:today});
 }

 return <Shell>
  <Action secondary icon="arrow-left" label={t("calendar.back")} onPress={()=>router.back()}/>
  <Head eyebrow={t("calendar.eyebrow")} title={t("calendar.title")}
   subtitle={t("calendar.subtitle")}/>
  <VenuePicker/>
  {ready&&!venue?<Card><Text style={S.bodyText}>{t("calendar.noVenue")}</Text></Card>:null}
  {ready&&venue&&!validToday?<Card><Text accessibilityRole="alert"
   style={{color:T.danger,textAlign:align}}>{t("calendar.invalidZone")}</Text></Card>:null}
  {date&&validToday?<Card style={{gap:14}}>
   <View style={[S.row,{flexDirection:isRTL?"row-reverse":"row",flexWrap:"wrap"}]}>
    <Action secondary label={t("calendar.previous")} icon="chevron-left"
     disabled={!shiftPublishedCivilDay(date,-1)} onPress={()=>changeDay(-1)}/>
    <Text style={[S.label,{flexShrink:1,textAlign:"center"}]}>
     {formattedDay||t("calendar.unavailableDate")}
    </Text>
    <Action secondary label={t("calendar.next")} icon="chevron-right"
     disabled={!shiftPublishedCivilDay(date,1)} onPress={()=>changeDay(1)}/>
   </View>
   <Action secondary icon="calendar-today" label={t("calendar.today")}
    onPress={backToToday} disabled={date===validToday}/>
   <Feedback loading={result.loading} error={result.error}
    empty={!result.loading&&!day} refresh={result.refresh}/>
   {day?<>
    {rows.map(({key,label,iqamah},index)=>{
     const name=t(label);
     const value=day[key]||"—";
     const iq=iqamah?day[iqamah]:null;
     return <View key={key} accessible
      accessibilityLabel={name+": "+value+(iq?" · "+t("calendar.iqamah")+": "+iq:"")}
      style={[S.row,{flexDirection:isRTL?"row-reverse":"row",
       paddingVertical:11,borderBottomWidth:index===rows.length-1?0:1,
       borderBottomColor:T.line}]}>
      <Text style={[S.label,{textAlign:align}]}>{name}</Text>
      <View style={{alignItems:isRTL?"flex-start":"flex-end",gap:3}}>
       <Text style={[S.value,{fontSize:20,writingDirection:"ltr"}]}>{value}</Text>
       {iq?<Text style={S.muted}>{t("calendar.iqamah")} {iq}</Text>:null}
      </View>
     </View>;
    })}
    <Text style={[S.muted,{textAlign:align}]}>
     {t("calendar.source")}: {day.source}
    </Text>
    <Text style={[S.muted,{textAlign:align}]}>
     {t("calendar.updated")}: {revision||t("calendar.updateUnavailable")}
    </Text>
   </>:null}
  </Card>:null}
 </Shell>;
}
