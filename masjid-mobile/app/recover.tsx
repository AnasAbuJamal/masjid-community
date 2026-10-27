import React,{useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {apiPost} from "../src/api";
import {Action,Card,Field,Head,Shell} from "../src/ui";
import {S,T} from "../src/theme";
export default function Recover(){
 const [email,setEmail]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 async function request(){
  setBusy(true);setError("");setNotice("");
  try{const response=await apiPost<{message:string}>("auth/request-password-reset",{email});setNotice(response.message);}
  catch(e){setError(e instanceof Error?e.message:"Unable to request reset.");}
  finally{setBusy(false);}
 }
 return <Shell><Action secondary label="Back" icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="ACCOUNT · SECURITY" title="Recover access." subtitle="Enter your email and use the secure reset link if your account exists."/>
 <Card style={{gap:16}}><Field label="Account email" keyboardType="email-address" value={email} onChange={setEmail}/>
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 <Action label="Send reset link" loading={busy} onPress={()=>void request()}/>
 <Text style={S.muted}>For account safety, we do not disclose whether an email is registered.</Text>
 </Card></Shell>;
}
