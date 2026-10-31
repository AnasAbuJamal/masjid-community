import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../src/ui";
import {S,T} from "../src/theme";
import {useResource} from "../src/useResource";
import {useGatheringPages} from "../src/useGatheringPages";
import {useSession} from "../src/session";
import {api} from "../src/api";
import {useLanguage} from "../src/i18n";

type Note={id:string;title:string;body:string;readAt:string|null;createdAt:string};
type InboxResponse={organization:{id:string;name:string};items:Note[];
 hasMore:boolean;nextCursor:string|null;pageSize:number};
export default function Notifications(){
 const {t,isRTL,language}=useLanguage();
 const {user,loading:sessionLoading,contextVersion}=useSession();
 const path=user?.isVerified?"notifications":null;
 const data=useResource<InboxResponse>(path);
 // Reuse the tenant- and generation-bound page hook to discard late responses
 // from another session or mosque after a user changes context.
 const pages=useGatheringPages<Note>(path,contextVersion,data.data);
 const [error,setError]=React.useState(""),[busy,setBusy]=React.useState("");
 const align=isRTL?"right":"left";
 async function markRead(id:string){
  setBusy(id);setError("");
  try{
   await api("notifications/"+encodeURIComponent(id),{method:"PATCH"});
   await data.refresh();
  }catch(e){setError(e instanceof Error?e.message:t("inbox.readError"));}
  finally{setBusy("");}
 }
 return <Shell>
  <Action label={t("inbox.back")} icon="arrow-left" secondary onPress={()=>router.back()}/>
  <Head eyebrow={t("inbox.eyebrow")} title={t("inbox.title")}
   subtitle={(data.data?.organization.name||t("inbox.currentMosque"))+" · "+t("inbox.subtitle")}/>
  {!sessionLoading&&!user?.isVerified?<Card style={{gap:12}}>
   <Text style={[S.bodyText,{textAlign:align}]}>{t("inbox.verify")}</Text>
   <Action secondary label={t("profile.login")} onPress={()=>router.push("/auth")}/>
  </Card>:null}
  <Feedback loading={data.loading||sessionLoading} error={data.error}
   empty={!!path&&!data.loading&&pages.items.length===0} refresh={data.refresh}/>
  {pages.items.map(n=><Card key={n.id} style={{gap:10}}>
   <View style={[S.row,{flexDirection:isRTL?"row-reverse":"row"}]}>
    <Text style={[S.label,{flex:1,textAlign:align}]}>{n.title}</Text>
    {!n.readAt?<Text style={{fontSize:12,fontWeight:"800",color:T.blue}}>
     {t("inbox.new")}
    </Text>:null}
   </View>
   <Text style={[S.bodyText,{textAlign:align}]}>{n.body}</Text>
   <Text style={[S.muted,{textAlign:align}]}>
    {new Date(n.createdAt).toLocaleString(language==="ar"?"ar":"en-US")}
   </Text>
   {!n.readAt?<Action secondary label={t("inbox.markRead")} disabled={!!busy}
    onPress={()=>void markRead(n.id)}/>:null}
  </Card>)}
  {pages.hasMore?<Action secondary label={t("inbox.loadMore")} loading={pages.busy}
   onPress={()=>void pages.loadMore()}/>:null}
  {pages.error?<View style={{gap:9}}>
   <Text accessibilityRole="alert" style={{color:T.danger,textAlign:align}}>
    {t("inbox.moreError")}
   </Text>
   <Action secondary label={t("common.refresh")} onPress={()=>void data.refresh()}/>
  </View>:null}
  {error?<Text accessibilityRole="alert" style={{color:T.danger,textAlign:align}}>
   {error}
  </Text>:null}
 </Shell>;
}
