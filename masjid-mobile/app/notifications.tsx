import React,{useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../src/ui";
import {S,T} from "../src/theme";
import {useResource} from "../src/useResource";
import {api} from "../src/api";
import {useLanguage} from "../src/i18n";
type Note={id:string;title:string;body:string;readAt:string|null;createdAt:string};
export default function Notifications(){
 const {t}=useLanguage();
 const data=useResource<{organization?:{name:string};notifications:Note[]}>("me");
 const [error,setError]=useState(""),[busy,setBusy]=useState("");
 async function markRead(id:string){
  setBusy(id);setError("");
  try{await api("notifications/"+id,{method:"PATCH"});await data.refresh();}
  catch(e){setError(e instanceof Error?e.message:t("inbox.readError"));}
  finally{setBusy("");}
 }
 return <Shell><Action label={t("inbox.back")} icon="arrow-left" secondary onPress={()=>router.back()}/>
 <Head eyebrow={t("inbox.eyebrow")} title={t("inbox.title")}
 subtitle={(data.data?.organization?.name||t("inbox.currentMosque"))+" · "+t("inbox.subtitle")}/>
 <Feedback loading={data.loading} error={data.error} empty={!data.data?.notifications.length} refresh={data.refresh}/>
 {data.data?.notifications.map(n=><Card key={n.id} style={{gap:10}}>
  <View style={S.row}><Text style={S.label}>{n.title}</Text>{!n.readAt?<Text style={{fontSize:12,fontWeight:"800",color:T.blue}}>{t("inbox.new")}</Text>:null}</View>
  <Text style={S.bodyText}>{n.body}</Text><Text style={S.muted}>{new Date(n.createdAt).toLocaleString()}</Text>
  {!n.readAt?<Action secondary label={t("inbox.markRead")} disabled={!!busy} onPress={()=>void markRead(n.id)}/>:null}
 </Card>)}
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 </Shell>;
}
