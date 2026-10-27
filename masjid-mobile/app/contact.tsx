import React,{useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {Action,Card,Field,Head,Shell} from "../src/ui";
import {apiPost} from "../src/api";
import {S,T} from "../src/theme";
export default function Contact(){
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[subject,setSubject]=useState(""),[message,setMessage]=useState("");
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 async function submit(){
  setBusy(true);setError("");setNotice("");
  try{
   const result=await apiPost<{message:string}>("contact",{name,email,subject,message,website:""});
   setNotice(result.message);setSubject("");setMessage("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to send request.");}finally{setBusy(false);}
 }
 return <Shell><Action label="Back" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="COMMUNITY · CONTACT" title="We're here to listen." subtitle="Your message goes to authorized mosque staff, not a public discussion board."/>
 <Card style={{gap:16}}><Field label="Your name" value={name} onChange={setName}/>
 <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address"/>
 <Field label="Subject" value={subject} onChange={setSubject}/>
 <Field label="Your message" value={message} onChange={setMessage} multiline/>
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 <Action label="Send message" icon="send-outline" loading={busy} disabled={!name.trim()||!email.trim()||!subject.trim()||message.trim().length<15} onPress={()=>void submit()}/>
 <Text style={S.muted}>Do not send urgent or emergency requests through this form. For emergencies, contact local emergency services.</Text>
 </Card></Shell>;
}
