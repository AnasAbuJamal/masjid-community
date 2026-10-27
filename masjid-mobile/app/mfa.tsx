import React,{useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {Action,Card,Field,Head,Shell} from "../src/ui";
import {useSession} from "../src/session";
import {apiPost} from "../src/api";
import {S,T} from "../src/theme";
export default function MfaScreen(){
 const {user,refresh}=useSession();
 const [password,setPassword]=useState(""),[secret,setSecret]=useState(""),[code,setCode]=useState("");
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 async function submit(name:"mfa-setup"|"mfa-enable"|"mfa-verify",body:unknown){
  setBusy(true);setError("");setNotice("");
  try{
   const value=await apiPost<{secret?:string;message?:string}>("auth/"+name,body);
   if(name==="mfa-setup"){setSecret(value.secret||"");setNotice("Copy this secret into your authenticator app and enter a fresh six-digit code.");}
   else{await refresh();setNotice("Authenticator verified.");router.replace("/(tabs)/profile");}
  }catch(e){setError(e instanceof Error?e.message:"Authenticator verification failed.");}
  finally{setBusy(false);}
 }
 return <Shell><Action label="Back to profile" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="SECURITY · AUTHENTICATOR" title="Protect privileged access." subtitle="Administrator and finance actions require an authenticator code."/>
 <Card style={{gap:15}}>{user?.mfaSetupRequired?<><Field label="Confirm your password" value={password} onChange={setPassword} secure/>
 <Action label="Generate authenticator key" secondary disabled={!password} loading={busy} onPress={()=>void submit("mfa-setup",{password})}/>
 {secret?<Text selectable style={[S.label,{color:T.deep}]}>{secret}</Text>:null}</>:null}
 <Field label="Six-digit authenticator code" value={code} onChange={setCode} keyboardType="numeric"/>
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 <Action label="Verify code" disabled={code.length!==6||!!user?.mfaSetupRequired&&!secret} loading={busy}
 onPress={()=>void submit(user?.mfaSetupRequired?"mfa-enable":"mfa-verify",{code})}/>
 </Card></Shell>;
}
