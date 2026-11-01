import React,{useEffect,useRef,useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {Action,Card,Field,Head,Shell} from "../src/ui";
import {apiPost} from "../src/api";
import {S,T} from "../src/theme";
import {useLanguage} from "../src/i18n";
import {contactValidationCode} from "../src/contact-form";
import {usePilotSurface} from "../src/usePilotSurface";
import {MemberScopeNotice} from "../src/MemberScopeNotice";

export default function Contact(){
 const surface=usePilotSurface();
 const {t,isRTL}=useLanguage();
 const [name,setName]=useState(""),[email,setEmail]=useState("");
 const [subject,setSubject]=useState(""),[message,setMessage]=useState("");
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const pending=useRef(false);
 const requestGeneration=useRef(0);
 const currentScope=useRef({version:surface.contextVersion,allowed:surface.allowed});
 currentScope.current={version:surface.contextVersion,allowed:surface.allowed};

 // Drafts are private to the account/mosque context that entered them.
 // Invalidate any late server receipt and remove previous account's text.
 useEffect(()=>{
  requestGeneration.current++;
  pending.current=false;
  setBusy(false);setNotice("");setError("");
  setName("");setEmail("");setSubject("");setMessage("");
  return ()=>{requestGeneration.current++;};
 },[surface.contextVersion,surface.allowed]);

 function validationMessage(code:ReturnType<typeof contactValidationCode>){
  switch(code){
   case "name":return t("contact.checkName");
   case "email":return t("contact.checkEmail");
   case "subject":return t("contact.checkSubject");
   case "message":return t("contact.checkMessage");
   case "messageTooLong":return t("contact.checkMessageTooLong");
   default:return "";
  }
 }

 async function submit(){
  // Recheck at the actual click. The UI is never permission authority;
  // the server still owns intake policy, validation and rate limiting.
  if(pending.current)return;
  if(!currentScope.current.allowed){
   setError(t("contact.unavailable"));return;
  }
  const validation=contactValidationCode({name,email,subject,message});
  if(validation){setError(validationMessage(validation));return;}
  const generation=++requestGeneration.current;
  const version=currentScope.current.version;
  pending.current=true;setBusy(true);setError("");setNotice("");
  try{
   const response=await apiPost<{received:boolean;message?:string}>("contact",{
    name:name.trim(),email:email.trim(),subject:subject.trim(),
    message:message.trim(),website:""
   });
   if(generation!==requestGeneration.current||
      version!==currentScope.current.version||!currentScope.current.allowed)return;
   if(response.received!==true)throw new Error("Receipt was not confirmed.");
   setNotice(t("contact.sent"));
   setSubject("");setMessage("");
  }catch{
   if(generation===requestGeneration.current&&
      version===currentScope.current.version&&currentScope.current.allowed)
    setError(t("contact.failed"));
  }finally{
   if(generation===requestGeneration.current&&
      version===currentScope.current.version&&currentScope.current.allowed){
    pending.current=false;setBusy(false);
   }
  }
 }

 const validation=contactValidationCode({name,email,subject,message});
 const align=isRTL?"right":"left";
 return <Shell>
  <Action label={t("common.back")} secondary icon="arrow-left"
   onPress={()=>router.back()}/>
  <Head eyebrow={t("contact.eyebrow")} title={t("contact.title")}
   subtitle={t("contact.subtitle")}/>
  {!surface.allowed?<MemberScopeNotice {...surface}/>:null}
  {surface.allowed?<Card style={{gap:16}}>
   <Field label={t("contact.name")} value={name} onChange={setName}/>
   <Field label={t("contact.email")} value={email} onChange={setEmail}
    keyboardType="email-address"/>
   <Field label={t("contact.subject")} value={subject} onChange={setSubject}/>
   <Field label={t("contact.message")} value={message} onChange={setMessage} multiline/>
   {error?<Text accessibilityRole="alert" style={{color:T.danger,textAlign:align}}>{error}</Text>:null}
   {notice?<Text accessibilityRole="alert" style={{color:T.success,textAlign:align}}>{notice}</Text>:null}
   <Action label={t("contact.submit")} icon="send-outline" loading={busy}
    disabled={!!validation||busy} onPress={()=>void submit()}/>
   <Text style={[S.muted,{textAlign:align}]}>{t("contact.deliveryNotice")}</Text>
   <Text style={[S.muted,{textAlign:align}]}>{t("contact.warning")}</Text>
  </Card>:null}
 </Shell>;
}
