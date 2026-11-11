import React,{useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {apiPost} from "../src/api";
import {Action,Card,Field,Head,Shell} from "../src/ui";
import {S,T} from "../src/theme";
import {useLanguage} from "../src/i18n";
export default function Recover(){
 const {t,isRTL}=useLanguage();const align=isRTL?"right":"left";
 const [email,setEmail]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 async function request(){
  setBusy(true);setError("");setNotice("");
  try{await apiPost<{message:string}>("auth/request-password-reset",{email});setNotice(t("account.resetAccepted"));}
  catch{setError(t("account.resetFailed"));}
  finally{setBusy(false);}
 }
 return <Shell><Action secondary label={t("common.back")} icon={isRTL?"arrow-right":"arrow-left"} onPress={()=>router.back()}/>
 <Head eyebrow={t("account.securityEyebrow")} title={t("account.recover")} subtitle={t("account.recoverSubtitle")}/>
 <Card style={{gap:16}}><Field label={t("account.accountEmail")} keyboardType="email-address" value={email} onChange={setEmail}/>
 {error?<Text accessibilityRole="alert" style={{color:T.danger,textAlign:align}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success,textAlign:align}}>{notice}</Text>:null}
 <Action label={t("account.sendReset")} loading={busy} onPress={()=>void request()}/>
 <Text style={[S.muted,{textAlign:align}]}>{t("account.recoveryPrivacy")}</Text>
 </Card></Shell>;
}
