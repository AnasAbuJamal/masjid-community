import React from "react";
import {Text,View} from "react-native";
import {Action,Card} from "./ui";
import {S} from "./theme";
import {useLanguage} from "./i18n";

// Keep the mosque's published title, body and instructions verbatim. Only
// interface labels are translated; safety translations need human review.
export type VenueEmergencyNotice={
 kind:string;title:string;body:string;instructions:string;
 revision:number;expiresAt:string
};
export function VenueEmergencyAlert({notice,venueName,onRefresh}:{
 notice:VenueEmergencyNotice;venueName?:string|null;onRefresh:()=>void
}){
 const {t,isRTL}=useLanguage();
 const align=isRTL?"right":"left";
 const kind=notice.kind==="closure"?t("emergency.closure"):
  notice.kind==="access_change"?t("emergency.accessChange"):
  notice.kind==="safety"?t("emergency.safety"):t("emergency.other");
 return <View accessibilityRole="alert">
  <Card style={{backgroundColor:"#FFF1E9",borderWidth:2,borderColor:"#9B3D28",gap:9}}>
   <Text style={{color:"#6C2517",fontWeight:"800",textAlign:align}}>
    {t("emergency.venueNotice")}{venueName?" · "+venueName:""} · {kind}
   </Text>
   <Text style={{fontSize:20,fontWeight:"800",color:"#6C2517",textAlign:align}}>{notice.title}</Text>
   <Text style={[S.bodyText,{color:"#522118",textAlign:align}]}>{notice.body}</Text>
   <Text style={[S.bodyText,{color:"#522118",fontWeight:"700",textAlign:align}]}>
    {t("emergency.instructions")}: {notice.instructions}
   </Text>
   <Text style={[S.muted,{textAlign:align}]}>
    {t("emergency.revision")} {notice.revision} · {t("emergency.expires")} {notice.expiresAt} (UTC)
   </Text>
   <Action secondary icon="refresh" label={t("emergency.refresh")} onPress={onRefresh}/>
  </Card>
 </View>;
}
