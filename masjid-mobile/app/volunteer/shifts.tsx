import React from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useResource} from "../../src/useResource";
import {useLanguage} from "../../src/i18n";
import {volunteerTime} from "../../src/volunteerTime";

type Shift={
 id:string;startAt:string;endAt:string;checkedInAt:string|null;
 status:"scheduled"|"completed"|"cancelled";opportunity:{title:string}
};
type ShiftResponse={organization:{name:string;timeZone:string};shifts:Shift[]};

export default function MyShifts(){
 const {t,isRTL,language}=useLanguage();
 const {data,loading,error,refresh}=useResource<ShiftResponse>("shifts");
 const zone=data?.organization.timeZone;
 const align=isRTL?"right":"left";
 const status=(value:Shift["status"])=>value==="scheduled"?t("shifts.scheduled"):
  value==="completed"?t("shifts.completed"):t("shifts.cancelled");
 const time=(value:string)=>zone?volunteerTime(value,zone,language):"";
 return <Shell>
  <Action label={t("shifts.back")} secondary icon="arrow-left" onPress={()=>router.back()}/>
  <Head eyebrow={t("shifts.eyebrow")} title={t("shifts.title")}
   subtitle={t("shifts.subtitle")}/>
  <Feedback loading={loading} error={error} empty={false} refresh={refresh}/>
  {zone?<Card style={{gap:5}}>
   <Text style={[S.label,{textAlign:align}]}>{t("shifts.timezone")}</Text>
   <Text style={[S.bodyText,{textAlign:align}]}>{data?.organization.name} · {zone}</Text>
  </Card>:null}
  {!loading&&!error&&data?.shifts.length===0?
   <Card><Text style={[S.muted,{textAlign:align}]}>{t("shifts.empty")}</Text></Card>:null}
  {zone&&data?.shifts.map(s=><Card key={s.id} style={{gap:8}}>
   <Text style={[S.headline,{textAlign:align}]}>{s.opportunity.title}</Text>
   <Text style={[S.bodyText,{textAlign:align}]}>{t("shifts.from")}: {time(s.startAt)}</Text>
   <Text style={[S.bodyText,{textAlign:align}]}>{t("shifts.to")}: {time(s.endAt)}</Text>
   <Text style={{fontWeight:"700",color:s.status==="completed"?T.success:T.deep,textAlign:align}}>
    {status(s.status)}
   </Text>
   <Text style={[S.muted,{textAlign:align}]}>{s.checkedInAt?
    t("shifts.arrived")+": "+time(s.checkedInAt):t("shifts.notCheckedIn")}</Text>
  </Card>)}
 </Shell>;
}
