import React from "react";
import {useResource} from "../../src/useResource";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Card,Head,PressRow,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useLanguage} from "../../src/i18n";
import {useSession} from "../../src/session";

export default function CareScreen(){
 const {t,isRTL}=useLanguage();
 const {user}=useSession();
 const policy=useResource<{enabled:boolean;message:string;hours:string;response:string;limits:string;emergency:string}>("care");
 return <Shell>
  <Head eyebrow={t("care.eyebrow")} title={t("care.title")} subtitle={t("care.subtitle")}/>
  <View style={S.section}>
   <PressRow icon="hand-heart-outline" title={t("care.time")} subtitle={t("care.timeDesc")}
    onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind:"volunteers",id:"all"}})}/>
   <PressRow icon="heart-outline" title={t("care.funds")} subtitle={t("care.fundsDesc")}
    onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind:"campaigns",id:"all"}})}/>
   {user?<PressRow icon="calendar-check-outline" title={t("care.shifts")} subtitle={t("care.shiftsDesc")}
    onPress={()=>router.push("/volunteer/shifts")}/>:null}
   <PressRow icon="chart-box-outline" title={t("care.transparency")} subtitle={t("care.transparencyDesc")}
    onPress={()=>router.push("/finance/transparency")}/>
  </View>
  <Card style={{gap:12,backgroundColor:T.ice}}>
   <Text style={[S.headline,{textAlign:isRTL?"right":"left"}]}>{t("care.support")}</Text>
   <Text style={[S.bodyText,{textAlign:isRTL?"right":"left"}]}>{policy.data?.enabled?t("care.supportActiveDesc"):t("care.supportDesc")}</Text>
   {policy.data?.enabled?<PressRow icon="hand-heart-outline"
    title={t("care.privateRequest")} subtitle={t("care.privateRequestDesc")}
    onPress={()=>router.push("/care/request")}/>:null}
   <PressRow icon="email-outline" title={t("care.contact")} onPress={()=>router.push("/contact")}/>
   <Text style={S.muted}>{policy.loading?t("feedback.loading"):policy.data?.enabled?
    policy.data.response:t("care.unavailable")}</Text>
  </Card>
 </Shell>;
}
