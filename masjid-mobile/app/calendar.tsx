import React,{useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../src/ui";
import {S,T} from "../src/theme";
import {useResource} from "../src/useResource";
function changeDate(key:string,days:number){
 const d=new Date(key+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);
}
export default function Calendar(){
 const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const result=useResource<{days:{id:string;fajr:string;sunrise:string;dhuhr:string;asr:string;maghrib:string;isha:string;source:string}[]}>("public/prayers?date="+date);
 const times=result.data?.days[0];
 return <Shell><Action secondary icon="arrow-left" label="Back to Salah" onPress={()=>router.back()}/>
 <Head eyebrow="SALAH · CALENDAR" title="Prayer calendar." subtitle="Browse the mosque's published daily schedule."/>
 <Card style={{gap:14}}><View style={S.row}><Action secondary label="Previous" icon="chevron-left" onPress={()=>setDate(changeDate(date,-1))}/><Text style={S.label}>{date}</Text><Action secondary label="Next" icon="chevron-right" onPress={()=>setDate(changeDate(date,1))}/></View>
 <Feedback loading={result.loading} error={result.error} empty={!times} refresh={result.refresh}/>
 {times?Object.entries(times).filter(([key])=>["fajr","sunrise","dhuhr","asr","maghrib","isha"].includes(key)).map(([key,value])=><View key={key} style={[S.row,{paddingVertical:8}]}><Text style={S.label}>{key.charAt(0).toUpperCase()+key.slice(1)}</Text><Text style={S.value}>{String(value)}</Text></View>):null}
 </Card></Shell>;
}
