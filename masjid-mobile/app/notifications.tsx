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
import {createScopedActionGate} from "../src/scoped-action-gate";
import {gatheringLocalTime} from "../src/gathering-local-time";

type Note={id:string;title:string;body:string;readAt:string|null;createdAt:string};
type InboxResponse={organization:{id:string;name:string;timeZone:string};items:Note[];
 hasMore:boolean;nextCursor:string|null;pageSize:number};

export default function Notifications(){
 const {t,isRTL,language}=useLanguage();
 const {user,loading:sessionLoading,contextVersion,contextChanging}=useSession();
 const path=user?.isVerified?"notifications":null;
 const data=useResource<InboxResponse>(path);
 // Only the API may decide which notification and mosque the member owns.
 // The cursor hook discards another account's or mosque's delayed page.
 const pages=useGatheringPages<Note>(path,contextVersion,data.data);
 const [error,setError]=React.useState(""),[busy,setBusy]=React.useState("");
 const gate=React.useRef(createScopedActionGate());
 const scope=[contextVersion,user?.id||"guest",path||"unavailable",
  data.data?.organization.id||"pending",
  contextChanging?"switching":"stable"
 ].join("|");
 React.useLayoutEffect(()=>{
  gate.current.bind(scope);
  setBusy("");setError("");
  return ()=>{gate.current.invalidate();};
 },[scope]);

 const align=isRTL?"right":"left";
 const canMark=!!path&&!sessionLoading&&!contextChanging&&!data.loading&&
  !!data.data?.organization.id&&!data.error;

 async function markRead(id:string){
  if(!canMark||!pages.items.some(n=>n.id===id&&!n.readAt))return;
  const ticket=gate.current.begin();
  if(ticket===null)return; // Prevent double taps and overlapping mutations.
  setBusy(id);setError("");
  try{
   const response=await api<{id:string;read:boolean}>(
    "notifications/"+encodeURIComponent(id),{method:"PATCH"}
   );
   if(!gate.current.isCurrent(ticket))return;
   if(response.id!==id||response.read!==true)
    throw new Error(t("inbox.readError"));
   // The next screen must show a server-confirmed read state, not a local
   // optimistic mutation. A context switch invalidates this refresh.
   await data.refresh();
  }catch(e){
   if(gate.current.isCurrent(ticket))
    setError(e instanceof Error?e.message:t("inbox.readError"));
  }finally{
   if(gate.current.finish(ticket))setBusy("");
  }
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
  {pages.items.map(n=>{
   const timestamp=gatheringLocalTime(n.createdAt,null,
    data.data?.organization.timeZone,language);
   return <Card key={n.id} style={{gap:10}}>
    <View style={[S.row,{flexDirection:isRTL?"row-reverse":"row"}]}>
     <Text style={[S.label,{flex:1,textAlign:align}]}>{n.title}</Text>
     {!n.readAt?<Text style={{fontSize:12,fontWeight:"800",color:T.blue}}>
      {t("inbox.new")}
     </Text>:null}
    </View>
    <Text style={[S.bodyText,{textAlign:align}]}>{n.body}</Text>
    <Text style={[S.muted,{textAlign:align}]}>
     {timestamp
      ?timestamp.text+" ("+t("inbox.mosqueTime")+", "+timestamp.timeZone+")"
      :t("inbox.timeUnavailable")}
    </Text>
    {!n.readAt?<Action secondary label={t("inbox.markRead")}
     disabled={!canMark||!!busy} loading={busy===n.id}
     onPress={()=>void markRead(n.id)}/>:null}
   </Card>;
  })}
  {pages.hasMore?<Action secondary label={t("inbox.loadMore")}
   disabled={!canMark||!!busy||pages.busy} loading={pages.busy}
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
