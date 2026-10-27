import React,{useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Field,Head,Shell} from "../src/ui";
import {useSession} from "../src/session";
import {S,T} from "../src/theme";
export default function AuthScreen(){
 const {login,register}=useSession();
 const [mode,setMode]=useState<"login"|"register">("login");
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[firstName,setFirstName]=useState(""),[lastName,setLastName]=useState("");
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const submit=async()=>{
  if(busy)return;setBusy(true);setError("");setNotice("");
  try{
   if(mode==="login"){const result=await login(email,password);router.replace(result.mfaRequired?"/mfa":"/(tabs)/profile");}
   else{const message=await register({email,password,firstName,lastName});setMode("login");setNotice(message);setPassword("");}
  }catch(e){setError(e instanceof Error?e.message:"Unable to contact server.");}
  finally{setBusy(false);}
 };
 return <Shell><Head eyebrow="IDENTITY · SECURE ACCESS" title={mode==="login"?"Welcome back.":"Join our community."} subtitle="Personal information stays protected and private."/>
 <Card style={{gap:16}}>
  {mode==="register"?<><Field label="First name" value={firstName} onChange={setFirstName}/><Field label="Last name" value={lastName} onChange={setLastName}/></>:null}
  <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address"/>
  <Field label="Password" value={password} onChange={setPassword} secure/>
  {mode==="register"?<Text style={S.muted}>Use at least 12 characters. An email verification link will be sent if email delivery is configured.</Text>:null}
  {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
  {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
  <Action label={mode==="login"?"Sign in":"Create account"} loading={busy} onPress={()=>void submit()}/>
  <Action label={mode==="login"?"Create a member account":"I already have an account"} secondary onPress={()=>{setError("");setMode(mode==="login"?"register":"login")}}/>
  <Action label="Forgot password?" secondary icon="lock-reset" onPress={()=>router.push("/recover")}/>
  <Action label="Back to community" secondary icon="arrow-left" onPress={()=>router.back()}/>
 </Card></Shell>;
}
