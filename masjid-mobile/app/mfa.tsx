import React,{useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {Action,Card,Field,Head,Shell} from "../src/ui";
import {useSession} from "../src/session";
import {apiPost} from "../src/api";
import {S,T} from "../src/theme";
import {useLanguage} from "../src/i18n";
export default function MfaScreen(){
 const {t,isRTL}=useLanguage();const align=isRTL?"right":"left";
 const {user,refresh}=useSession();
 const [password,setPassword]=useState(""),[secret,setSecret]=useState(""),[code,setCode]=useState("");
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 async function submit(name:"mfa-setup"|"mfa-enable"|"mfa-verify",body:unknown){
  setBusy(true);setError("");setNotice("");
  try{
   const value=await apiPost<{secret?:string;message?:string}>("auth/"+name,body);
   if(name==="mfa-setup"){setSecret(value.secret||"");setNotice(t("account.mfaSetup"));}
   else{await refresh();setNotice(t("account.mfaVerified"));router.replace("/(tabs)/profile");}
  }catch{setError(t("account.mfaFailed"));}
  finally{setBusy(false);}
 }
 return <Shell><Action label={t("settings.back")} secondary icon={isRTL?"arrow-right":"arrow-left"} onPress={()=>router.back()}/>
 <Head eyebrow={t("account.mfaEyebrow")} title={t("account.mfaTitle")} subtitle={t("account.mfaSubtitle")}/>
 <Card style={{gap:15}}>{user?.mfaSetupRequired?<><Field label={t("account.confirmPassword")} value={password} onChange={setPassword} secure/>
 <Action label={t("account.generateKey")} secondary disabled={!password} loading={busy} onPress={()=>void submit("mfa-setup",{password})}/>
 {secret?<><Text style={[S.label,{textAlign:align}]}>{t("account.authenticatorKey")}</Text><Text selectable style={[S.label,{color:T.deep,textAlign:"left",writingDirection:"ltr"}]}>{secret}</Text></>:null}</>:null}
 <Field label={t("account.sixDigit")} value={code} onChange={setCode} keyboardType="numeric"/>
 {error?<Text accessibilityRole="alert" style={{color:T.danger,textAlign:align}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success,textAlign:align}}>{notice}</Text>:null}
 <Action label={t("account.verifyCode")} disabled={code.length!==6||!!user?.mfaSetupRequired&&!secret} loading={busy}
 onPress={()=>void submit(user?.mfaSetupRequired?"mfa-enable":"mfa-verify",{code})}/>
 </Card></Shell>;
}
