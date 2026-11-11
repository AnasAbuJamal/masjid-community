import React,{useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {Action,Card,Field,Head,Shell} from "../src/ui";
import {useSession} from "../src/session";
import {S,T} from "../src/theme";
import {useLanguage} from "../src/i18n";
export default function AuthScreen(){
 const {t,isRTL}=useLanguage();const align=isRTL?"right":"left";
 const {login,register}=useSession();
 const [mode,setMode]=useState<"login"|"register">("login");
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[firstName,setFirstName]=useState(""),[lastName,setLastName]=useState("");
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const submit=async()=>{
  if(busy)return;setBusy(true);setError("");setNotice("");
  try{
   if(mode==="login"){const result=await login(email,password);router.replace(result.mfaRequired?"/mfa":"/(tabs)/profile");}
   else{await register({email,password,firstName,lastName});setMode("login");setNotice(t("account.registered"));setPassword("");}
  }catch{setError(t("account.authFailed"));}
  finally{setBusy(false);}
 };
 return <Shell><Head eyebrow={t("account.authEyebrow")} title={mode==="login"?t("account.welcome"):t("account.join")} subtitle={t("account.private")}/>
 <Card style={{gap:16}}>
  {mode==="register"?<><Field label={t("account.firstName")} value={firstName} onChange={setFirstName}/><Field label={t("account.lastName")} value={lastName} onChange={setLastName}/></>:null}
  <Field label={t("account.email")} value={email} onChange={setEmail} keyboardType="email-address"/>
  <Field label={t("account.password")} value={password} onChange={setPassword} secure/>
  {mode==="register"?<Text style={[S.muted,{textAlign:align}]}>{t("account.passwordHelp")}</Text>:null}
  {error?<Text accessibilityRole="alert" style={{color:T.danger,textAlign:align}}>{error}</Text>:null}
  {notice?<Text style={{color:T.success,textAlign:align}}>{notice}</Text>:null}
  <Action label={mode==="login"?t("account.signIn"):t("account.create")} loading={busy} onPress={()=>void submit()}/>
  <Action label={mode==="login"?t("account.createMember"):t("account.haveAccount")} secondary onPress={()=>{setError("");setMode(mode==="login"?"register":"login")}}/>
  <Action label={t("account.forgot")} secondary icon="lock-reset" onPress={()=>router.push("/recover")}/>
  <Action label={t("account.community")} secondary icon={isRTL?"arrow-right":"arrow-left"} onPress={()=>router.back()}/>
 </Card></Shell>;
}
