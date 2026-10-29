import React,{useState} from "react";
import {router} from "expo-router";
import {Text,View} from "react-native";
import {Action,Card,Feedback,Field,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {apiPost} from "../../src/api";
import {useResource} from "../../src/useResource";
import {useLanguage} from "../../src/i18n";
type Status="present"|"absent"|"late"|"excused";
type Mark={studentId:string;status:Status;revision:number;markedAt:string|null;correctedAt:string|null};
type Session={id:string;startsAt:string;attendance:Mark[]};
type ClassItem={id:string;name:string;schedule:string;enrollments:{
 student:{id:string;firstName:string;lastName:string}}[];sessions:Session[]};
export default function Teacher(){
 const {language}=useLanguage();
 const L=(en:string,ar:string)=>language==="ar"?ar:en;
 const statusName=(status:Status)=>({present:L("present","حاضر"),absent:L("absent","غائب"),late:L("late","متأخر"),excused:L("excused","بعذر")})[status];
 const result=useResource<{classes:ClassItem[]}>("teacher");
 const [selected,setSelected]=useState<string|null>(null),[busy,setBusy]=useState("");
 const [reasons,setReasons]=useState<Record<string,string>>({});
 const [notice,setNotice]=useState(""),[error,setError]=useState("");
 async function mark(sessionId:string,studentId:string,status:Status,previous?:Mark){
  const key=sessionId+studentId+status;
  setBusy(key);setError("");setNotice("");
  const reason=reasons[sessionId+studentId]||"";
  try{
   if(previous){
    if(reason.trim().length<10){setError(L("Enter a correction reason of at least 10 characters.","أدخل سببًا للتصحيح من ١٠ أحرف على الأقل."));return;}
    await apiPost("actions",{kind:"attendance-correction",sessionId,studentId,
     status,expectedRevision:previous.revision,reason});
    setNotice(L("Attendance correction recorded with an audit trail.","سُجّل تصحيح الحضور في سجل التدقيق."));
   }else{
    await apiPost("actions",{kind:"attendance",sessionId,studentId,status});
    setNotice(L("Initial attendance mark recorded.","سُجّل الحضور الأولي."));
   }
   setReasons(old=>({...old,[sessionId+studentId]:""}));
   await result.refresh();
  }catch(e){setError(e instanceof Error?e.message:L("Unable to update attendance. Refresh the session.","تعذر تحديث الحضور. حدّث الحصة."));}
  finally{setBusy("");}
 }
 const now=Date.now();
 return <Shell><Action label={L("Back to school","العودة إلى المدرسة")} secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow={L("TEACHER · PRIVATE WORKSPACE","المعلم · مساحة خاصة")} title={L("Your classroom.","صفّك الدراسي.")}
 subtitle={L("Your assigned classes only. First marks and corrections have separate, audited rules.","صفوفك المخصصة فقط. تسجيل الحضور الأولي وتصحيحاته إجراءان منفصلان قابلان للتدقيق.")}/>
 <Action label={L("Class assignments & reports","الواجبات والتقارير")} secondary icon="book-open-variant" onPress={()=>router.push("/school/work")}/>
 <Action label={L("Refresh attendance","تحديث الحضور")} secondary icon="refresh" onPress={()=>void result.refresh()}/>
 <Text style={S.muted}>{L("Initial marks: from 15 minutes before to 4 hours after the scheduled start. Corrections: until 24 hours after, with a reason. The school must review older records separately.","التسجيل الأولي: من ١٥ دقيقة قبل بدء الحصة وحتى ٤ ساعات بعدها. التصحيح: خلال ٢٤ ساعة مع ذكر السبب. تتطلب السجلات الأقدم مراجعة منفصلة.")}</Text>
 <Feedback loading={result.loading} error={result.error} empty={!result.data?.classes?.length} refresh={result.refresh}/>
 {result.data?.classes.map(c=><Card key={c.id} style={{gap:11}}><Text style={S.headline}>{c.name}</Text>
 <Text style={S.muted}>{c.schedule} · {c.enrollments.length} {L("enrolled","مسجّل")}</Text>
 <Action secondary label={selected===c.id?L("Hide sessions","إخفاء الحصص"):L("Manage attendance","إدارة الحضور")}
 onPress={()=>setSelected(selected===c.id?null:c.id)}/>
 {selected===c.id?(c.sessions.length?c.sessions.map(session=>{
  const start=Date.parse(session.startsAt);
  const initialOpen=now>=start-15*60000&&now<=start+4*3600000;
  const correctionOpen=now>=start-15*60000&&now<=start+24*3600000;
  return <View key={session.id} style={{gap:12,paddingTop:10}}>
   <Text style={S.label}>{new Date(session.startsAt).toLocaleString()}</Text>
   {c.enrollments.map(e=>{
    const previous=session.attendance.find(a=>a.studentId===e.student.id);
    const reasonKey=session.id+e.student.id;
    const canAct=previous?correctionOpen:initialOpen;
    return <View key={e.student.id} style={{paddingBottom:12,borderBottomWidth:1,borderBottomColor:T.line,gap:10}}>
     <Text style={S.label}>{e.student.firstName} {e.student.lastName}</Text>
     <Text style={S.muted}>{L("Current: ","الحالة الحالية: ")}{previous?statusName(previous.status):L("not marked","لم يُسجل")}{previous?L(" · revision "," · الإصدار ")+previous.revision:""}</Text>
     {previous?<Field label={L("Correction reason (required, no sensitive details)","سبب التصحيح (مطلوب دون تفاصيل حساسة)")} value={reasons[reasonKey]||""}
      onChange={value=>setReasons(old=>({...old,[reasonKey]:value}))}/>:null}
     {!canAct?<Text style={S.muted}>{L("This session is outside the attendance window. Contact school administration for a governed correction.","هذه الحصة خارج مهلة التسجيل. تواصل مع إدارة المدرسة لتصحيح معتمد.")}</Text>:null}
     <View style={{flexDirection:"row",flexWrap:"wrap",gap:7}}>
      {(["present","absent","late","excused"] as const).map(status=><Action key={status}
       label={previous?L("Correct to ","التصحيح إلى ")+statusName(status):L("Mark ","تسجيل ")+statusName(status)} secondary
       disabled={!!busy||!canAct||status===previous?.status||(!!previous&&(reasons[reasonKey]||"").trim().length<10)}
       onPress={()=>void mark(session.id,e.student.id,status,previous)}/>)}
     </View>
    </View>;
   })}
  </View>;
 }):<Text style={S.muted}>{L("No sessions scheduled. Ask the school administrator to create a session.","لا توجد حصص مجدولة. اطلب من إدارة المدرسة إنشاء حصة.")}</Text>):null}
 </Card>)}
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 </Shell>;
}
