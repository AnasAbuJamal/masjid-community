import React,{useState} from "react";
import {router} from "expo-router";
import {Text,View} from "react-native";
import {Action,Card,Feedback,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {apiPost} from "../../src/api";
import {useResource} from "../../src/useResource";
type ClassItem={id:string;name:string;schedule:string;enrollments:{student:{id:string;firstName:string;lastName:string}}[];sessions:{id:string;startsAt:string;attendance:{studentId:string;status:string}[]}[]};
export default function Teacher(){
 const result=useResource<{classes:ClassItem[]}>("teacher");
 const [selected,setSelected]=useState<string|null>(null),[busy,setBusy]=useState(""),[notice,setNotice]=useState(""),[error,setError]=useState("");
 async function mark(sessionId:string,studentId:string,status:"present"|"absent"|"late"|"excused"){
  const key=sessionId+studentId+status;setBusy(key);setError("");setNotice("");
  try{await apiPost("actions",{kind:"attendance",sessionId,studentId,status});setNotice("Attendance saved.");await result.refresh();}
  catch(e){setError(e instanceof Error?e.message:"Unable to mark attendance.");}
  finally{setBusy("");}
 }
 return <Shell><Action label="Back to school" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="TEACHER · PRIVATE WORKSPACE" title="Your classroom." subtitle="Only classes assigned to your verified teacher account are shown."/>
 <Action label="Class assignments & reports" secondary icon="book-open-variant" onPress={()=>router.push("/school/work")}/>
 <Feedback loading={result.loading} error={result.error} empty={!result.data?.classes?.length} refresh={result.refresh}/>
 {result.data?.classes.map(c=><Card key={c.id} style={{gap:11}}><Text style={S.headline}>{c.name}</Text><Text style={S.muted}>{c.schedule} · {c.enrollments.length} enrolled</Text>
 <Action secondary label={selected===c.id?"Hide sessions":"Manage attendance"} onPress={()=>setSelected(selected===c.id?null:c.id)}/>
 {selected===c.id?(c.sessions.length?c.sessions.map(session=><View key={session.id} style={{gap:12,paddingTop:10}}>
  <Text style={S.label}>{new Date(session.startsAt).toLocaleString()}</Text>
  {c.enrollments.map(e=><View key={e.student.id} style={{paddingBottom:12,borderBottomWidth:1,borderBottomColor:T.line,gap:10}}>
   <Text style={S.label}>{e.student.firstName} {e.student.lastName}</Text><Text style={S.muted}>Current mark: {session.attendance.find(a=>a.studentId===e.student.id)?.status||"not marked"}</Text>
   <View style={{flexDirection:"row",flexWrap:"wrap",gap:7}}>{(["present","absent","late","excused"] as const).map(status=><Action key={status} label={status} secondary disabled={!!busy} onPress={()=>void mark(session.id,e.student.id,status)}/>)}</View>
  </View>)}
 </View>):<Text style={S.muted}>No sessions scheduled. Ask the school administrator to create a session.</Text>):null}
 </Card>)}
 {error?<Text style={{color:T.danger}}>{error}</Text>:null}{notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 </Shell>;
}
