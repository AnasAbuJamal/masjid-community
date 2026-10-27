import React,{useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Field,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useResource} from "../../src/useResource";
import {apiPost} from "../../src/api";
type Assignment={id:string;title:string;instructions:string;dueAt:string;classSection:{name:string};studentIds:string[]};
type Schoolwork={mode:"family"|"teacher";assignments?:Assignment[];selfStudentId?:string|null;reports?:{id:string;studentId:string;summary:string;classSection:{name:string};student:{firstName:string;lastName:string}}[];submissions?:{assignmentId:string;studentId:string}[];classes?:{id:string;name:string;assignments:{id:string;title:string;published:boolean;dueAt:string}[]}[]};
export default function Work(){
 const result=useResource<Schoolwork>("schoolwork");
 const [expanded,setExpanded]=useState(""),[body,setBody]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function submit(id:string){
  setBusy(true);setError("");setNotice("");
  try{await apiPost("schoolwork",{kind:"submission",assignmentId:id,body});setNotice("Your work was submitted.");setExpanded("");setBody("");await result.refresh();}
  catch(e){setError(e instanceof Error?e.message:"Unable to submit your assignment.");}
  finally{setBusy(false);}
 }
 return <Shell><Action label="Back to school" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="SCHOOL · PRIVATE LEARNING" title="Learning in progress." subtitle="Assignments and progress reports are visible only to authorized students, guardians and assigned teachers."/>
 <Feedback loading={result.loading} error={result.error} empty={!result.data?.assignments?.length&&!result.data?.classes?.length&&!result.data?.reports?.length} refresh={result.refresh}/>
 {result.data?.mode==="teacher"?result.data.classes?.map(c=><Card key={c.id} style={{gap:9}}><Text style={S.headline}>{c.name}</Text><Text style={S.muted}>Assignments in this class</Text>{c.assignments.map(a=><Text key={a.id} style={S.bodyText}>{a.title} · {a.published?"Published":"Draft"}</Text>)}
 <Text style={S.muted}>New assignments and reports can be authored from the teacher web portal.</Text></Card>):null}
 {result.data?.assignments?.map(a=><Card key={a.id} style={{gap:13}}>
  <Text style={S.overline}>{a.classSection.name}</Text><Text style={S.headline}>{a.title}</Text>
  <Text style={S.bodyText}>{a.instructions}</Text><Text style={S.muted}>Due {new Date(a.dueAt).toLocaleString()}</Text>
  {a.studentIds.includes(result.data?.selfStudentId||"")&&!result.data?.submissions?.some(s=>s.assignmentId===a.id&&s.studentId===result.data?.selfStudentId)&&new Date(a.dueAt)>new Date()?
    expanded===a.id?<View style={{gap:12}}><Field label="Your submission" value={body} onChange={setBody} multiline/><Action label="Submit assignment" loading={busy} disabled={!body.trim()} onPress={()=>void submit(a.id)}/><Action label="Cancel" secondary onPress={()=>setExpanded("")}/></View>
     :<Action label="Write your submission" secondary onPress={()=>setExpanded(a.id)}/>:null}
  {result.data?.submissions?.some(s=>s.assignmentId===a.id&&s.studentId===result.data?.selfStudentId)?<Text style={{color:T.success,fontWeight:"700"}}>Submitted</Text>:null}
 </Card>)}
 {result.data?.reports?.length?<View style={S.section}><Text style={S.headline}>Published progress reports</Text>{result.data.reports.map(r=><Card key={r.id} style={{gap:9}}><Text style={S.label}>{r.student.firstName} {r.student.lastName} · {r.classSection.name}</Text><Text style={S.bodyText}>{r.summary}</Text></Card>)}</View>:null}
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}{notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 </Shell>;
}
