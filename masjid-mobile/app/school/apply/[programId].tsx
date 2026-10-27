import React,{useState} from "react";
import {Text,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Action,Card,Feedback,Field,Head,Shell} from "../../../src/ui";
import {useSession} from "../../../src/session";
import {apiPost} from "../../../src/api";
import {useResource} from "../../../src/useResource";
import {S,T} from "../../../src/theme";
type Program={id:string;title:string;description:string};
type Application={id:string;studentFirstName:string;studentLastName:string;status:string;program:{title:string};decisionReason:string|null};
export default function Apply(){
 const {programId}=useLocalSearchParams<{programId:string}>();
 const {user}=useSession();
 const programs=useResource<{items:Program[]}>("public/programs");
 const applications=useResource<{applications:Application[]}>(user?.isVerified?"enrollment":"public/programs");
 const program=programs.data?.items.find(x=>x.id===programId);
 const [first,setFirst]=useState(""),[last,setLast]=useState(""),[notes,setNotes]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function submit(){
  if(!user){router.push("/auth");return;}
  if(!user.isVerified){setError("Verify your email before applying.");return;}
  setBusy(true);setError("");setNotice("");
  try{const result=await apiPost<{message:string}>("enrollment",{programId,studentFirstName:first,studentLastName:last,notes});
   setNotice(result.message);setFirst("");setLast("");setNotes("");await applications.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to submit application.");}
  finally{setBusy(false);}
 }
 return <Shell><Action label="Back to school" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="SCHOOL · ENROLLMENT" title={program?.title||"School enrollment"} subtitle="Apply for a program. The school must approve applications and verify guardian relationships before linking student records."/>
 <Feedback loading={programs.loading} error={programs.error} empty={!program} refresh={programs.refresh}/>
 {program?<Card style={{gap:15}}><Text style={S.headline}>{program.title}</Text><Text style={S.bodyText}>{program.description}</Text>
 <Field label="Student first name" value={first} onChange={setFirst}/>
 <Field label="Student last name" value={last} onChange={setLast}/>
 <Field label="Notes for school (optional)" value={notes} onChange={setNotes} multiline/>
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 <Action label={user?"Submit for school review":"Sign in to apply"} loading={busy} disabled={!!user&&(!first.trim()||!last.trim())} onPress={()=>void submit()}/>
 </Card>:null}
 {user?.isVerified?<View style={S.section}><Text style={S.headline}>Your applications</Text>
 {applications.data?.applications.map(a=><Card key={a.id} style={{gap:8}}><Text style={S.label}>{a.studentFirstName} {a.studentLastName}</Text>
 <Text style={S.muted}>{a.program.title} · {a.status}</Text>{a.decisionReason?<Text style={S.bodyText}>{a.decisionReason}</Text>:null}</Card>)}
 </View>:null}</Shell>;
}
