import React,{useState} from "react";
import {Switch,Text,View} from "react-native";
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
 const [reviewAcknowledged,setReviewAcknowledged]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function submit(){
  if(!user){router.push("/auth");return;}
  if(!user.isVerified){setError("Verify your email before applying.");return;}
  if(!reviewAcknowledged){setError("Confirm the application review conditions before submitting.");return;}
  setBusy(true);setError("");setNotice("");
  try{const result=await apiPost<{message:string}>("enrollment",{programId,studentFirstName:first,studentLastName:last,notes,
   reviewAcknowledged:true});
   setNotice(result.message);setFirst("");setLast("");setNotes("");setReviewAcknowledged(false);await applications.refresh();
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
 <Text style={S.muted}>Only submit information needed for school review. Avoid sharing medical or custody documents in these notes.</Text>
 <View style={{flexDirection:"row",alignItems:"center",gap:12,minHeight:56}}>
  <Switch accessibilityLabel="Acknowledge guardian review conditions" value={reviewAcknowledged}
   onValueChange={setReviewAcknowledged}/>
  <Text style={[S.bodyText,{flex:1}]}>I confirm I am authorized to submit this request for the child and understand that the school must independently verify the legal guardian relationship before linking any student record. This is not approval or proof of guardianship.</Text>
 </View>
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 <Action label={user?"Submit for school review":"Sign in to apply"} loading={busy} disabled={!!user&&(!first.trim()||!last.trim()||!reviewAcknowledged)} onPress={()=>void submit()}/>
 </Card>:null}
 {user?.isVerified?<View style={S.section}><Text style={S.headline}>Your applications</Text>
 {applications.data?.applications.map(a=><Card key={a.id} style={{gap:8}}><Text style={S.label}>{a.studentFirstName} {a.studentLastName}</Text>
 <Text style={S.muted}>{a.program.title} · {a.status}</Text>{a.decisionReason?<Text style={S.bodyText}>{a.decisionReason}</Text>:null}</Card>)}
 </View>:null}</Shell>;
}
