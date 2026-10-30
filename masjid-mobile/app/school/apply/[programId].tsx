import React,{useEffect,useState} from "react";
import {Switch,Text,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Action,Card,Feedback,Field,Head,Shell} from "../../../src/ui";
import {useSession} from "../../../src/session";
import {apiPost} from "../../../src/api";
import {useResource} from "../../../src/useResource";
import {S,T} from "../../../src/theme";
import {usePilotSurface} from "../../../src/usePilotSurface";
import {MemberScopeNotice} from "../../../src/MemberScopeNotice";

type Program={id:string;title:string;description:string};
type Application={id:string;studentFirstName:string;studentLastName:string;status:string;
 program:{title:string};decisionReason:string|null};

export default function Apply(){
 const {programId}=useLocalSearchParams<{programId:string}>();
 const {user}=useSession();
 const surface=usePilotSurface();
 const {allowed,contextVersion}=surface;
 const programs=useResource<{items:Program[]}>(allowed?"public/programs":null);
 const applications=useResource<{applications:Application[]}>(allowed&&user?.isVerified?"enrollment":null);
 const program=programs.data?.items.find(x=>x.id===programId);
 const [first,setFirst]=useState(""),[last,setLast]=useState(""),[notes,setNotes]=useState("");
 const [reviewAcknowledged,setReviewAcknowledged]=useState(false);
 const [reviewing,setReviewing]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");

 // A changed program or mosque must never reuse a previously reviewed child
 // application draft in another organization's context.
 useEffect(()=>{setReviewing(false);},[programId]);
 useEffect(()=>{
  setFirst("");setLast("");setNotes("");setReviewAcknowledged(false);
  setReviewing(false);setError("");setNotice("");
 },[contextVersion]);

 function review(){
  if(!allowed){setError("This school is unavailable for your selected mosque.");return;}
  setError("");setNotice("");
  if(!user){router.push("/auth");return;}
  if(!user.isVerified){setError("Verify your email before applying.");return;}
  if(!program){setError("This school program is not available.");return;}
  if(first.trim().length<2||last.trim().length<2){
   setError("Enter the student's first and last name before reviewing.");return;
  }
  if(!reviewAcknowledged){
   setError("Acknowledge the school review conditions before continuing.");return;
  }
  setReviewing(true);
 }
 async function submit(){
  if(!allowed){setError("This school is unavailable for your selected mosque.");return;}
  if(!reviewing||!program||!programId){setError("Review the selected program and child details first.");return;}
  if(!user){router.push("/auth");return;}
  if(!user.isVerified){setError("Verify your email before applying.");return;}
  if(!reviewAcknowledged){setReviewing(false);setError("Acknowledge the school review conditions.");return;}
  setBusy(true);setError("");setNotice("");
  try{
   const result=await apiPost<{message:string}>("enrollment",{
    programId,studentFirstName:first.trim(),studentLastName:last.trim(),notes:notes.trim(),
    reviewAcknowledged:true
   });
   setNotice(result.message);setFirst("");setLast("");setNotes("");setReviewAcknowledged(false);
   setReviewing(false);await applications.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to submit application. Your draft has been kept.");}
  finally{setBusy(false);}
 }

 return <Shell>
  <Action label="Back to school" secondary icon="arrow-left" onPress={()=>router.back()}/>
  <Head eyebrow="SCHOOL · ENROLLMENT" title={program?.title||"School enrollment"}
   subtitle="Apply for a program. School staff must review each request and separately verify legal guardian relationships before linking a student."/>
  {!allowed?<MemberScopeNotice {...surface}/>:null}
  {allowed?<><Feedback loading={programs.loading} error={programs.error} empty={!program&&!programs.loading} refresh={programs.refresh}/>
  {program?<Card style={{gap:15}}>
   <Text style={S.headline}>{program.title}</Text>
   <Text style={S.bodyText}>{program.description}</Text>
   {reviewing?<>
    <Text style={S.headline}>Review before submitting</Text>
    <Text style={S.bodyText}>Program: {program.title}</Text>
    <Text style={S.bodyText}>Student: {first.trim()} {last.trim()}</Text>
    {notes.trim()?<Text style={S.bodyText}>School notes: {notes.trim()}</Text>:<Text style={S.muted}>No additional notes</Text>}
    <Text style={S.muted}>You acknowledged the review conditions. This does not establish legal guardianship or enroll the child. The school will review your request.</Text>
    <Action label="Edit application" secondary disabled={busy} onPress={()=>{setReviewing(false);setError("");}}/>
    <Action label="Submit for school review" loading={busy} onPress={()=>void submit()}/>
   </>:<>
    <Field label="Student first name" value={first} onChange={setFirst}/>
    <Field label="Student last name" value={last} onChange={setLast}/>
    <Field label="Notes for school (optional)" value={notes} onChange={setNotes} multiline/>
    <Text style={S.muted}>Only submit information needed for school review. Avoid medical or custody documents in these notes.</Text>
    <View style={{flexDirection:"row",alignItems:"center",gap:12,minHeight:56}}>
     <Switch accessibilityLabel="Acknowledge guardian review conditions"
      value={reviewAcknowledged} onValueChange={setReviewAcknowledged}/>
     <Text style={[S.bodyText,{flex:1}]}>
      I confirm I am authorized to submit this request for the child and understand that
      the school must independently verify the legal guardian relationship before linking
      any student record. This is not approval or proof of guardianship.
     </Text>
    </View>
    <Action label={user?"Review application":"Sign in to apply"}
     disabled={busy||!!user&&(!first.trim()||!last.trim()||!reviewAcknowledged)}
     onPress={review}/>
   </>}
   {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
   {notice?<Text accessibilityRole="alert" style={{color:T.success}}>{notice}</Text>:null}
  </Card>:null}
  {user?.isVerified?<View style={S.section}>
   <Text style={S.headline}>Your applications</Text>
   {applications.data?.applications.map(a=><Card key={a.id} style={{gap:8}}>
    <Text style={S.label}>{a.studentFirstName} {a.studentLastName}</Text>
    <Text style={S.muted}>{a.program.title} · {a.status}</Text>
    {a.decisionReason?<Text style={S.bodyText}>{a.decisionReason}</Text>:null}
   </Card>)}
  </View>:null}</>:null}
 </Shell>;
}
