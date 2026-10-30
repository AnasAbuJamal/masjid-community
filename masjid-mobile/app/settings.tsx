import React,{useEffect,useState} from "react";
import {Alert,Share,Switch,Text,View} from "react-native";
import {router} from "expo-router";
import {api,apiPost} from "../src/api";
import {useSession} from "../src/session";
import {Action,Card,Feedback,Field,Head,Shell} from "../src/ui";
import {useResource} from "../src/useResource";
import {S,T} from "../src/theme";
import {useLanguage} from "../src/i18n";
type Session={id:string;createdAt:string;expiresAt:string};
type Data={profile:{firstName:string;lastName:string;email:string;role:string};
 sessions:Session[];deletion:{id:string;status:string;createdAt:string}|null};
type DeliveryPreference={purpose:"community_news"|"event_updates";enabled:boolean;quietStartHour:number|null;quietEndHour:number|null};
type DeliveryData={organization:{name:string;timeZone:string};optional:DeliveryPreference[];policy:string};
type ContextData={selectedOrganizationId:string;selectedActive:boolean;organizations:{id:string;name:string;slug:string;timeZone:string;selectable:boolean;memberWorkspace:string}[];policy:string};
export default function Settings(){
 const {language,setLanguage,t}=useLanguage();
 const {refresh:refreshUser,logout,selectOrganization}=useSession();
 const result=useResource<Data>("account");
 const context=useResource<ContextData>("organizations/context");
 const delivery=useResource<DeliveryData>("me/preferences");
 const [first,setFirst]=useState(""),[last,setLast]=useState("");
 const [newsletter,setNewsletter]=useState(false),[events,setEvents]=useState(false),[quiet,setQuiet]=useState(false);
 const [quietStart,setQuietStart]=useState("22"),[quietEnd,setQuietEnd]=useState("7");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [exportPassword,setExportPassword]=useState("");
 useEffect(()=>{if(result.data){setFirst(result.data.profile.firstName);setLast(result.data.profile.lastName);}},[result.data]);
 useEffect(()=>{if(delivery.data){
  const community=delivery.data.optional.find(x=>x.purpose==="community_news");
  const events=delivery.data.optional.find(x=>x.purpose==="event_updates");
  setNewsletter(!!community?.enabled);setEvents(!!events?.enabled);
  const window=community?.quietStartHour!==null&&community?.quietStartHour!==undefined?community:
   events?.quietStartHour!==null&&events?.quietStartHour!==undefined?events:null;
  setQuiet(!!window);
  if(window?.quietStartHour!==null&&window?.quietStartHour!==undefined)setQuietStart(String(window.quietStartHour));
  if(window?.quietEndHour!==null&&window?.quietEndHour!==undefined)setQuietEnd(String(window.quietEndHour));
 }},[delivery.data]);
 async function switchMosque(id:string){
  setBusy(true);setNotice("");setError("");
  try{
   await selectOrganization(id);
   await context.refresh();
   setNotice(t("settings.mosqueSelected"));
  }catch(e){setError(e instanceof Error?e.message:t("settings.mosqueSwitchError"));}
  finally{setBusy(false);}
 }
 async function saveProfile(){
  setBusy(true);setNotice("");setError("");
  try{await api("account",{method:"PATCH",body:JSON.stringify({firstName:first,lastName:last})});
   await result.refresh();await refreshUser();setNotice(t("settings.profileSaved"));}
  catch(e){setError(e instanceof Error?e.message:t("settings.saveError"));}
  finally{setBusy(false);}
 }
 async function saveDelivery(){
  const from=Number(quietStart),until=Number(quietEnd);
  if(quiet&&(!/^\\d{1,2}$/.test(quietStart)||!/^\\d{1,2}$/.test(quietEnd)||
   from<0||from>23||until<0||until>23||from===until)){
   setError(t("settings.quietInvalid"));return;
  }
  setBusy(true);setNotice("");setError("");
  const hours={quietStartHour:quiet?from:null,quietEndHour:quiet?until:null};
  try{
   await api("me/preferences",{method:"PATCH",body:JSON.stringify({purpose:"community_news",enabled:newsletter,...hours})});
   await api("me/preferences",{method:"PATCH",body:JSON.stringify({purpose:"event_updates",enabled:events,...hours})});
   await delivery.refresh();setNotice(t("settings.deliverySaved"));
  }catch(e){
   setError((e instanceof Error?e.message:"")+". "+t("settings.deliveryPartial"));
   await delivery.refresh();
  }finally{setBusy(false);}
 }
 async function revoke(id:string){
  setBusy(true);setError("");setNotice("");
  try{await api("account/sessions/"+id,{method:"DELETE"});setNotice("Session revoked.");await result.refresh();}
  catch(e){setError(e instanceof Error?e.message:"Could not revoke session.");}
  finally{setBusy(false);}
 }
 async function exportData(){
  if(!exportPassword){setError(t("settings.exportPasswordRequired"));return;}
  setBusy(true);setError("");setNotice("");
  try{
   const value=await apiPost<{organization:{name:string};scope:string;truncatedCategories:string[]}&Record<string,unknown>>("account/export",{
    password:exportPassword,confirm:true
   });
   setExportPassword("");
   setNotice(value.truncatedCategories.length?t("settings.exportPartialNotice"):t("settings.exportSuccessNotice"));
   // Native sharing is an explicit user action; the OS sharing destination is
   // outside SILA's control. Warn before disclosing personal account content.
   await Share.share({title:t("settings.export")+" — "+value.organization.name,
    message:JSON.stringify(value,null,2)});
  }catch(e){setError(e instanceof Error?e.message:t("settings.exportFailed"));}
  finally{setExportPassword("");setBusy(false);}
 }
 async function deleteRequest(){
  setBusy(true);setError("");setNotice("");
  try{const response=await apiPost<{message:string}>("account/deletion-request",{confirm:true});
   setNotice(response.message);await result.refresh();}
  catch(e){setError(e instanceof Error?e.message:"Unable to record request.");}finally{setBusy(false);}
 }
 async function logoutEverywhere(){
  setBusy(true);
  try{await apiPost("auth/logout-all",{});}catch{}
  finally{await logout();setBusy(false);router.replace("/(tabs)/profile");}
 }
 const pref=(label:string,value:boolean,onValueChange:(v:boolean)=>void)=><View key={label} style={[S.row,{paddingVertical:7}]}><Text style={[S.label,{flex:1}]}>{label}</Text>
  <Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} trackColor={{true:T.blue}}/></View>;
 return <Shell><Action label="Back to profile" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="ACCOUNT · PRIVACY" title="Your account, your choice." subtitle="Manage your identity, communication preferences, and active device sessions."/>
 <Feedback loading={result.loading} error={result.error} empty={false} refresh={result.refresh}/>
 {result.data?<><Card style={{gap:14}}><Text style={S.headline}>{t("settings.language")}</Text>
 <View style={{flexDirection:"row",gap:10}}><View style={{flex:1}}><Action label={t("settings.english")} secondary={language!=="en"} onPress={()=>void setLanguage("en")}/></View>
 <View style={{flex:1}}><Action label={t("settings.arabic")} secondary={language!=="ar"} onPress={()=>void setLanguage("ar")}/></View></View>
 <Text style={S.muted}>Arabic labels and layout are being introduced progressively. Financial records stay unchanged.</Text>
 <Text style={S.headline}>Profile</Text>
 <Text style={S.muted}>{result.data.profile.email}</Text>
 <Field label="First name" value={first} onChange={setFirst}/><Field label="Last name" value={last} onChange={setLast}/>
 <Action label={t("settings.saveProfile")} loading={busy} disabled={busy} onPress={()=>void saveProfile()}/></Card>
 <Card style={{gap:12}}>
 <Text style={S.headline}>{t("settings.mosqueTitle")}</Text>
 <Feedback loading={context.loading} error={context.error} empty={false} refresh={context.refresh}/>
 <Text style={S.muted}>{t("settings.mosquePolicy")}</Text>
 {context.data?.organizations.map(item=><View key={item.id} style={{gap:6,paddingVertical:6}}>
  <Text style={S.label}>{item.name} · {item.timeZone}</Text>
  <Action label={item.id===context.data?.selectedOrganizationId?t("settings.mosqueCurrent"):t("settings.mosqueSwitch")}
   secondary={item.id===context.data?.selectedOrganizationId}
   disabled={busy||!item.selectable||item.id===context.data?.selectedOrganizationId}
   onPress={()=>void switchMosque(item.id)}/>
  {item.memberWorkspace!=="pilot"?<Text style={S.muted}>{t("settings.mosqueLimited")}</Text>:null}
 </View>)}
 {context.data&&!context.data.selectedActive?<Text accessibilityRole="alert" style={{color:T.danger}}>{t("settings.mosqueRevoked")}</Text>:null}
 </Card>
 <Card style={{gap:13}}>
 <Text style={S.headline}>{t("settings.deliveryTitle")}</Text>
 <Feedback loading={delivery.loading} error={delivery.error} empty={false} refresh={delivery.refresh}/>
 <Text style={S.muted}>{delivery.data?.organization.name||t("inbox.currentMosque")} · {delivery.data?.organization.timeZone||""}</Text>
 <Text style={S.bodyText}>{t("settings.serviceEmail")}</Text>
 {pref(t("settings.communityOptIn"),newsletter,setNewsletter)}
 {pref(t("settings.eventOptIn"),events,setEvents)}
 {pref(t("settings.quietHours"),quiet,setQuiet)}
 {quiet?<View style={{gap:8}}>
 <Field label={t("settings.quietStart")} value={quietStart} onChange={setQuietStart}/>
 <Field label={t("settings.quietEnd")} value={quietEnd} onChange={setQuietEnd}/>
 <Text style={S.muted}>{t("settings.quietZone")}</Text>
 </View>:null}
 <Text style={S.muted}>{t("settings.deliveryPolicy")}</Text>
 <Action label={t("settings.saveDelivery")} loading={busy} disabled={busy||!delivery.data}
 onPress={()=>void saveDelivery()}/></Card>
 <Card style={{gap:13}}><Text style={S.headline}>Your sessions</Text>
 {result.data.sessions.map(s=><View key={s.id} style={[S.row,{paddingVertical:8}]}><View style={{flex:1}}><Text style={S.label}>Signed in {new Date(s.createdAt).toLocaleDateString()}</Text>
 <Text style={S.muted}>Expires {new Date(s.expiresAt).toLocaleDateString()}</Text></View>
 <Action label="Revoke" secondary disabled={busy} onPress={()=>void revoke(s.id)}/></View>)}
 <Action label="Sign out on all devices" secondary icon="shield-lock-outline" disabled={busy} onPress={()=>Alert.alert("Sign out all sessions?","You will need to sign in again on every device.",[
  {text:"Cancel",style:"cancel"},{text:"Sign out all",style:"destructive",onPress:()=>void logoutEverywhere()}])}/>
 </Card>
 <Card style={{gap:13}}><Text style={S.headline}>{t("settings.privacy")}</Text>
 <Text style={S.bodyText}>{t("settings.exportScope")}</Text>
 <Text style={S.muted}>{t("settings.exportSecurity")}</Text>
 <Field label={t("settings.exportPasswordLabel")} value={exportPassword} onChange={setExportPassword} secure/>
 <Action label={t("settings.export")} secondary icon="download-outline" disabled={busy||!exportPassword}
 onPress={()=>Alert.alert(t("settings.exportConfirmTitle"),t("settings.exportConfirmBody"),[
  {text:t("settings.cancel"),style:"cancel"},
  {text:t("settings.export"),onPress:()=>void exportData()}
 ])}/>
 {result.data.deletion?<Text style={S.muted}>{t("settings.requestStatus")}: {result.data.deletion.status}</Text>:null}
 <Action label={t("settings.requestReview")} secondary icon="account-remove-outline" disabled={busy}
 onPress={()=>Alert.alert(t("settings.requestConfirmTitle"),t("settings.requestConfirmBody"),[
  {text:t("settings.cancel"),style:"cancel"},
  {text:t("settings.submitRequest"),style:"destructive",onPress:()=>void deleteRequest()}
 ])}/>
 </Card></>:null}
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 </Shell>;
}
