import React,{useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Field,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useResource} from "../../src/useResource";
import {useSession} from "../../src/session";
import {apiPost} from "../../src/api";
import {useLanguage} from "../../src/i18n";
type Assignment={id:string;title:string;instructions:string;dueAt:string;classSection:{name:string};studentIds:string[]};
type Schoolwork={mode:"family"|"teacher";organization?:{name:string;timeZone:string};assignments?:Assignment[];selfStudentId?:string|null;reports?:{id:string;studentId:string;summary:string;classSection:{name:string};student:{firstName:string;lastName:string}}[];submissions?:{id:string;assignmentId:string;studentId:string;submittedAt:string;body?:string}[];classes?:{id:string;name:string;assignments:{id:string;title:string;published:boolean;dueAt:string}[]}[]};
export default function Work(){
 const {t,language,isRTL}=useLanguage();
 const {contextVersion}=useSession();
 const result=useResource<Schoolwork>("schoolwork");
 const [expanded,setExpanded]=useState(""),[body,setBody]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const activeContext=React.useRef(contextVersion);
 const align=isRTL?"right":"left";
 // An unsubmitted child's draft is local sensitive state. Never preserve it
 // across a signed-in identity or mosque-context change; late responses from
 // the old context must not put a success/error notice on the new screen.
 React.useEffect(()=>{
  activeContext.current=contextVersion;
  setExpanded("");setBody("");setBusy(false);setError("");setNotice("");
 },[contextVersion]);
 function dueLabel(instant:string){
  const timeZone=result.data?.organization?.timeZone;
  const date=new Date(instant);
  if(!Number.isFinite(date.getTime()))return t("schoolwork.timeUnavailable");
  try{
   if(!timeZone)throw new Error("No mosque zone");
   return new Intl.DateTimeFormat(language==="ar"?"ar":"en-US",{
    timeZone,dateStyle:"medium",timeStyle:"short"
   }).format(date)+" ("+timeZone+")";
  }catch{return date.toISOString()+" (UTC)";}
 }
 async function submit(id:string){
  if(busy)return;
  const sendingContext=contextVersion;
  setBusy(true);setError("");setNotice("");
  try{
   await apiPost("schoolwork",{kind:"submission",assignmentId:id,body});
   if(activeContext.current!==sendingContext)return;
   setNotice(t("schoolwork.submitted"));setExpanded("");setBody("");
   await result.refresh();
  }catch(e){
   if(activeContext.current===sendingContext)
    setError(e instanceof Error?e.message:t("schoolwork.submitError"));
  }finally{
   if(activeContext.current===sendingContext)setBusy(false);
  }
 }
 return <Shell><Action label={t("schoolwork.back")} secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow={t("schoolwork.eyebrow")} title={t("schoolwork.title")} subtitle={t("schoolwork.subtitle")}/>
 <Feedback loading={result.loading} error={result.error} empty={!result.data?.assignments?.length&&!result.data?.classes?.length&&!result.data?.reports?.length} refresh={result.refresh}/>
 {result.data?.mode==="teacher"?result.data.classes?.map(c=><Card key={c.id} style={{gap:9}}>
 <Text style={[S.headline,{textAlign:align}]}>{c.name}</Text>
 <Text style={[S.muted,{textAlign:align}]}>{t("schoolwork.classAssignments")}</Text>
 {c.assignments.map(a=><Text key={a.id} style={[S.bodyText,{textAlign:align}]}>
  {a.title} · {t(a.published?"schoolwork.published":"schoolwork.draft")}
 </Text>)}
 <Text style={[S.muted,{textAlign:align}]}>{t("schoolwork.teacherPortal")}</Text>
 </Card>):null}
 {result.data?.assignments?.map(a=><Card key={a.id} style={{gap:13}}>
  <Text style={[S.overline,{textAlign:align}]}>{a.classSection.name}</Text>
  <Text style={[S.headline,{textAlign:align}]}>{a.title}</Text>
  <Text style={[S.bodyText,{textAlign:align}]}>{a.instructions}</Text>
  <Text style={[S.muted,{textAlign:align}]}>{t("schoolwork.due")} {dueLabel(a.dueAt)}</Text>
  {a.studentIds.includes(result.data?.selfStudentId||"")&&!result.data?.submissions?.some(s=>s.assignmentId===a.id&&s.studentId===result.data?.selfStudentId)&&new Date(a.dueAt)>new Date()?
    expanded===a.id?<View style={{gap:12}}>
     <Field label={t("schoolwork.yourSubmission")} value={body} onChange={setBody} multiline/>
     <Text style={[S.muted,{textAlign:align}]}>{t("schoolwork.finalHint")}</Text>
     <Action label={t("schoolwork.submitAssignment")} loading={busy} disabled={busy||!body.trim()} onPress={()=>void submit(a.id)}/>
     <Action label={t("settings.cancel")} secondary onPress={()=>setExpanded("")}/>
    </View>
     :<Action label={t("schoolwork.writeSubmission")} secondary onPress={()=>setExpanded(a.id)}/>:null}
  {result.data?.submissions?.some(s=>s.assignmentId===a.id&&s.studentId===result.data?.selfStudentId)?<View accessibilityRole="text" style={{gap:4}}>
   <Text style={{color:T.success,fontWeight:"700",textAlign:align}}>{t("schoolwork.received")}</Text>
   <Text style={[S.muted,{textAlign:align}]}>{t("schoolwork.receivedAt")} {dueLabel(result.data.submissions.find(s=>s.assignmentId===a.id&&s.studentId===result.data?.selfStudentId)!.submittedAt)}</Text>
   <Text style={[S.muted,{textAlign:align}]}>{t("schoolwork.receiptId")} {result.data.submissions.find(s=>s.assignmentId===a.id&&s.studentId===result.data?.selfStudentId)!.id}</Text>
  </View>:null}
 </Card>)}
 {result.data?.submissions?.filter(s=>s.studentId===result.data?.selfStudentId&&
  typeof s.body==="string"&&result.data?.assignments?.some(a=>a.id===s.assignmentId)).map(s=>
  <Card key={s.id} style={{gap:8,backgroundColor:T.ice}}>
   <Text style={[S.label,{textAlign:align}]}>{t("schoolwork.originalWork")}</Text>
   <Text selectable style={[S.bodyText,{textAlign:align}]}>{s.body}</Text>
   <Text style={[S.muted,{textAlign:align}]}>{t("schoolwork.originalPrivate")}</Text>
  </Card>
 )}
 {result.data?.reports?.length?<View style={S.section}>
 <Text style={[S.headline,{textAlign:align}]}>{t("schoolwork.publishedReports")}</Text>
 {result.data.reports.map(r=><Card key={r.id} style={{gap:9}}>
  <Text style={[S.label,{textAlign:align}]}>{r.student.firstName} {r.student.lastName} · {r.classSection.name}</Text>
  <Text style={[S.bodyText,{textAlign:align}]}>{r.summary}</Text>
 </Card>)}
 </View>:null}
 {error?<Text accessibilityRole="alert" style={{color:T.danger,textAlign:align}}>{error}</Text>:null}
 {notice?<Text accessibilityRole="alert" style={{color:T.success,textAlign:align}}>{notice}</Text>:null}
 </Shell>;
}
