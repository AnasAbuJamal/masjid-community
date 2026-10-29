import React,{useState} from "react";
import {router} from "expo-router";
import {Text,View} from "react-native";
import {Action,Card,Feedback,Field,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {apiPost} from "../../src/api";
import {useResource} from "../../src/useResource";
type Status="present"|"absent"|"late"|"excused";
type Mark={studentId:string;status:Status;revision:number;markedAt:string|null;correctedAt:string|null};
type Session={id:string;startsAt:string;attendance:Mark[]};
type ClassItem={id:string;name:string;schedule:string;enrollments:{
 student:{id:string;firstName:string;lastName:string}}[];sessions:Session[]};
export default function Teacher(){
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
    if(reason.trim().length<10){setError("Enter a correction reason of at least 10 characters.");return;}
    await apiPost("actions",{kind:"attendance-correction",sessionId,studentId,
     status,expectedRevision:previous.revision,reason});
    setNotice("Attendance correction recorded with an audit trail.");
   }else{
    await apiPost("actions",{kind:"attendance",sessionId,studentId,status});
    setNotice("Initial attendance mark recorded.");
   }
   setReasons(old=>({...old,[sessionId+studentId]:""}));
   await result.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to update attendance. Refresh the session.");}
  finally{setBusy("");}
 }
 const now=Date.now();
 return <Shell><Action label="Back to school" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="TEACHER · PRIVATE WORKSPACE" title="Your classroom."
 subtitle="Your assigned classes only. First marks and corrections have separate, audited rules."/>
 <Action label="Class assignments & reports" secondary icon="book-open-variant" onPress={()=>router.push("/school/work")}/>
 <Action label="Refresh attendance" secondary icon="refresh" onPress={()=>void result.refresh()}/>
 <Text style={S.muted}>Initial marks: from 15 minutes before to 4 hours after the scheduled start. Corrections: until 24 hours after, with a reason. The school must review older records separately.</Text>
 <Feedback loading={result.loading} error={result.error} empty={!result.data?.classes?.length} refresh={result.refresh}/>
 {result.data?.classes.map(c=><Card key={c.id} style={{gap:11}}><Text style={S.headline}>{c.name}</Text>
 <Text style={S.muted}>{c.schedule} · {c.enrollments.length} enrolled</Text>
 <Action secondary label={selected===c.id?"Hide sessions":"Manage attendance"}
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
     <Text style={S.muted}>Current: {previous?.status||"not marked"}{previous?" · revision "+previous.revision:""}</Text>
     {previous?<Field label="Correction reason (required, no sensitive details)" value={reasons[reasonKey]||""}
      onChange={value=>setReasons(old=>({...old,[reasonKey]:value}))}/>:null}
     {!canAct?<Text style={S.muted}>This session is outside the attendance window. Contact school administration for a governed correction.</Text>:null}
     <View style={{flexDirection:"row",flexWrap:"wrap",gap:7}}>
      {(["present","absent","late","excused"] as const).map(status=><Action key={status}
       label={previous?"Correct to "+status:"Mark "+status} secondary
       disabled={!!busy||!canAct||status===previous?.status||(!!previous&&(reasons[reasonKey]||"").trim().length<10)}
       onPress={()=>void mark(session.id,e.student.id,status,previous)}/>)}
     </View>
    </View>;
   })}
  </View>;
 }):<Text style={S.muted}>No sessions scheduled. Ask the school administrator to create a session.</Text>):null}
 </Card>)}
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 </Shell>;
}
