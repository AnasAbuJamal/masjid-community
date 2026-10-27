import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,PressRow,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useResource} from "../../src/useResource";
type Day={id:string;localDate:string;fajr:string;sunrise:string;dhuhr:string;asr:string;maghrib:string;isha:string;fajrIqamah?:string;dhuhrIqamah?:string;asrIqamah?:string;maghribIqamah?:string;ishaIqamah?:string;source:string;updatedAt:string};
type Schedule={venue:{id:string;name:string;timeZone:string}|null;days:Day[];jummah:{id:string;ordinal:number;khutbahAt?:string;iqamahAt:string}[]};
const rows:[string,keyof Day,keyof Day|undefined][]=[["Fajr","fajr","fajrIqamah"],["Sunrise","sunrise",undefined],["Dhuhr","dhuhr","dhuhrIqamah"],["Asr","asr","asrIqamah"],["Maghrib","maghrib","maghribIqamah"],["Isha","isha","ishaIqamah"]];
export default function Salah(){
 const {data,loading,error,refresh}=useResource<Schedule>("public/prayers");
 const day=data?.days[0];
 return <Shell>
 <Head eyebrow="WORSHIP · SALAH" title="A moment of peace." subtitle="Mosque-published timings, designed for clarity."/>
 <Card style={{backgroundColor:"#EAF6FF"}}>
  <Text style={S.overline}>YOUR MOSQUE</Text><Text style={[S.headline,{marginTop:9}]}>{data?.venue?.name||"No venue configured"}</Text>
  <Text style={[S.muted,{marginTop:7}]}>{data?.venue?.timeZone||"Timings are venue-local"}</Text>
 </Card>
 <Feedback loading={loading} error={error} empty={!day} refresh={refresh}/>
 {day?<Card><View style={[S.row,{marginBottom:16}]}><Text style={S.label}>{day.localDate}</Text><Text style={S.muted}>Adhan · Iqamah</Text></View>
 {rows.map(([label,key,iq],index)=><View key={label} style={[S.row,{paddingVertical:14,borderBottomWidth:index===rows.length-1?0:1,borderBottomColor:T.line}]}>
  <Text style={[S.label,{fontSize:16}]}>{label}</Text><View style={{alignItems:"flex-end"}}><Text style={[S.value,{fontSize:21}]}>{day[key]||"—"}</Text>{iq&&day[iq]?<Text style={S.muted}>Iqamah {day[iq]}</Text>:null}</View>
 </View>)}
 <Text style={[S.muted,{marginTop:12}]}>Source: {day.source} · Updated {new Date(day.updatedAt).toLocaleDateString()}</Text>
 </Card>:null}
 {data?.jummah?.length?<Card><Text style={S.headline}>Jummah</Text>{data.jummah.map(j=><Text key={j.id} style={[S.bodyText,{marginTop:9}]}>Session {j.ordinal} · {j.iqamahAt} {j.khutbahAt?"· Khutbah "+j.khutbahAt:""}</Text>)}</Card>:null}
 <View style={S.section}><PressRow icon="compass-outline" title="Find the Qibla" subtitle="Optional location-based direction" onPress={()=>router.push("/qibla")}/>
 <PressRow icon="calendar-month-outline" title="Prayer calendar" subtitle="Check another date's published schedule" onPress={()=>router.push("/calendar")}/>
 <Action label="Refresh schedule" secondary icon="refresh" onPress={()=>void refresh()}/></View>
 </Shell>;
}
