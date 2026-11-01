import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../src/ui";
import {S,T} from "../src/theme";
import {useLanguage} from "../src/i18n";
import {useResource} from "../src/useResource";
import {useSession} from "../src/session";
import {publishedPrayerDayLabel} from "../src/prayer-civil-day";
import {scheduleRevisionTime} from "../src/schedule-revision-time";

type Notice={
 id:string;kind:string;localDate:string;title:string;body:string;
 publishedAt:string;revision:number
};
type Data={organization:{name:string;timeZone:string}|null;
 notices:Notice[];policy:string};

export default function FaithCalendar(){
 const {t,isRTL,language}=useLanguage();
 const {user}=useSession();
 const result=useResource<Data>(user?.isVerified
  ?"organizations/view?resource=faith":"public/faith");
 const align=isRTL?"right":"left";

 function kindLabel(kind:string){
  switch(kind){
   case "ramadan_start":return t("faith.kindRamadan");
   case "eid_al_fitr":return t("faith.kindFitr");
   case "eid_al_adha":return t("faith.kindAdha");
   case "moon_sighting":return t("faith.kindMoon");
   default:return t("faith.kindOther");
  }
 }

 return <Shell>
  <Action label={t("faith.back")} secondary icon="arrow-left"
   onPress={()=>router.back()}/>
  <Head eyebrow={t("faith.eyebrow")} title={t("faith.title")}
   subtitle={result.data?.organization?.name||t("faith.subtitle")}/>
  <Feedback loading={result.loading} error={result.error}
   empty={!result.data?.notices?.length} refresh={result.refresh}/>
  <Card style={{backgroundColor:T.ice,gap:8}}>
   <Text style={[S.bodyText,{textAlign:align}]}>{t("faith.confirmedPolicy")}</Text>
   {result.data?.policy?<View style={{gap:5}}>
    <Text style={[S.label,{textAlign:align}]}>{t("faith.policy")}</Text>
    <Text style={[S.muted,{textAlign:align}]}>{result.data.policy}</Text>
   </View>:null}
  </Card>
  {result.data?.notices?.map(n=>{
   // The published date is a mosque-approved civil date; the timestamp is
   // formatted separately in its mosque's configured timezone.
   const date=publishedPrayerDayLabel(n.localDate,language);
   const published=scheduleRevisionTime(n.publishedAt,
    result.data?.organization?.timeZone,language);
   return <Card key={n.id} style={{gap:11}}>
    <Text style={[S.overline,{textAlign:align}]}>{kindLabel(n.kind)}</Text>
    <Text style={[S.headline,{textAlign:align}]}>{n.title}</Text>
    <Text style={[S.value,{fontSize:22,textAlign:align}]}>
     {date||t("faith.dateUnavailable")}
    </Text>
    <Text style={[S.bodyText,{textAlign:align}]}>{n.body}</Text>
    <Text style={[S.muted,{textAlign:align}]}>
     {t("faith.updated")}: {published||t("faith.updateUnavailable")}
     {" · "}{t("faith.revision")} {n.revision}
    </Text>
   </Card>;
  })}
 </Shell>;
}
