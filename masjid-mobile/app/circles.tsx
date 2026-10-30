import React,{useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {api,apiPost} from "../src/api";
import {useSession} from "../src/session";
import {useLanguage} from "../src/i18n";
import {useResource} from "../src/useResource";
import {Action,Card,Feedback,Head,Shell} from "../src/ui";
import {S,T} from "../src/theme";
import {usePilotSurface} from "../src/usePilotSurface";
import {MemberScopeNotice} from "../src/MemberScopeNotice";

type Circle={id:string;title:string;summary:string;cadence:string;guidelines:string};
type Membership={id:string;status:"requested"|"approved"|"declined"|"left";circle:{id:string;title:string;summary:string;cadence:string}};
type Update={id:string;circleId:string;body:string;publishedAt:string;revision:number};
export default function Circles(){
 const {user}=useSession();
 const surface=usePilotSurface();
 const {allowed}=surface;
 const {language}=useLanguage();
 const ar=language==="ar";
 const publicList=useResource<{items:Circle[]}>(allowed?"circles":null);
 const own=useResource<{memberships:Membership[];updates:Update[]}>(allowed&&user?.isVerified?"circles/mine":null);
 const [busy,setBusy]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const label=(en:string,arabic:string)=>ar?arabic:en;
 async function change(circleId:string,kind:"join"|"leave"){
  if(!allowed){setError("Circles are unavailable at your selected mosque.");return;}
  if(!user){router.push("/auth");return;}
  if(!user.isVerified){setError(label("Verify your email first.","وثّق بريدك الإلكتروني أولاً."));return;}
  setBusy(circleId);setError("");setNotice("");
  try{
   const result=kind==="join"?await apiPost<{message:string}>("circles",{circleId}):
    await api<{left:boolean}>("circles",{method:"DELETE",body:JSON.stringify({circleId})});
   setNotice(kind==="join"?(result as {message:string}).message:
    label("You have left this circle. Private updates are no longer available.","غادرت الحلقة، ولم تعد تحديثاتها الخاصة متاحة."));
   await own.refresh();
  }catch(e){setError(e instanceof Error?e.message:label("Could not update the request.","تعذر تحديث الطلب."));}
  finally{setBusy("");}
 }
 return <Shell>
 <Action secondary icon="arrow-left" label={label("Back","رجوع")} onPress={()=>router.back()}/>
 <Head eyebrow={label("GATHER · MODERATED CIRCLES","اللقاءات · الحلقات المُدارة")}
  title={label("Find a circle to belong to.","اعثر على حلقة تناسبك.")}
  subtitle={label("Read the public description, request to join, and wait for host approval. Member lists are never public.",
   "اقرأ الوصف العام، وقدّم طلب الانضمام وانتظر موافقة المشرف. قوائم الأعضاء ليست عامة.")}/>
 {!allowed?<MemberScopeNotice {...surface}/>:null}
 {allowed?<>{error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 <Feedback loading={publicList.loading} error={publicList.error} empty={publicList.data?.items.length===0} refresh={publicList.refresh}/>
 {publicList.data?.items.map(c=>{
  const membership=own.data?.memberships.find(m=>m.circle.id===c.id);
  return <Card key={c.id} style={{gap:12}}>
   <Text style={S.headline}>{c.title}</Text>
   <Text style={S.bodyText}>{c.summary}</Text>
   <Text style={S.muted}>{label("Meeting rhythm: ","المواعيد: ")}{c.cadence}</Text>
   <Text style={S.label}>{label("Participation guidelines","قواعد المشاركة")}</Text>
   <Text style={S.bodyText}>{c.guidelines}</Text>
   {membership?<Text style={S.muted}>{label("Your status: ","حالة الطلب: ")}{membership.status}</Text>:null}
   {membership?.status==="approved"?<Action label={label("Leave this circle","مغادرة الحلقة")} secondary
    disabled={!!busy} onPress={()=>void change(c.id,"leave")}/>:
    membership?.status==="requested"?<Text style={S.muted}>{label("Awaiting host review","بانتظار مراجعة المشرف")}</Text>:
    <Action label={user?label("Request to join","طلب الانضمام"):label("Sign in to join","سجّل الدخول للانضمام")}
     disabled={!!busy||!!(user&&!user.isVerified)||!!(user&&own.loading)}
     loading={busy===c.id} onPress={()=>void change(c.id,"join")}/>}
  </Card>;
 })}
 {user?.isVerified?<View style={S.section}>
  <Text style={S.headline}>{label("Updates from your approved circles","تحديثات الحلقات المعتمدة")}</Text>
  <Feedback loading={own.loading} error={own.error} empty={!own.data?.updates.length} refresh={own.refresh}/>
  {own.data?.updates.map(u=><Card key={u.id} style={{gap:9}}>
   <Text style={S.label}>{own.data?.memberships.find(m=>m.circle.id===u.circleId)?.circle.title}</Text>
   <Text style={S.bodyText}>{u.body}</Text><Text style={S.muted}>{new Date(u.publishedAt).toLocaleString()}</Text>
  </Card>)}
 </View>:null}</>:null}
 </Shell>;
}
