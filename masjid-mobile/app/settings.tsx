import React,{useEffect,useRef,useState} from "react";
import {Alert,Share,Switch,Text,View} from "react-native";
import {router} from "expo-router";
import {api,apiPost} from "../src/api";
import {useSession} from "../src/session";
import {Action,Card,Feedback,Field,Head,Shell} from "../src/ui";
import {useResource} from "../src/useResource";
import {S,T} from "../src/theme";
import {useLanguage} from "../src/i18n";
import {createScopedActionGate} from "../src/scoped-action-gate";
import {parseEmailQuietHours} from "../src/delivery-hours";
import {createPrivateExportAction,type ExportOwner} from "../src/private-export";
type Session={id:string;createdAt:string;expiresAt:string};
type Data={profile:{firstName:string;lastName:string;email:string;role:string};
 currentSessionId:string;sessions:Session[];deletion:{id:string;status:string;createdAt:string}|null};
type DeliveryPreference={purpose:"community_news"|"event_updates";enabled:boolean;quietStartHour:number|null;quietEndHour:number|null};
type DeliveryData={organization:{id:string;name:string;timeZone:string};optional:DeliveryPreference[];policy:string};
type SavedDelivery={saved:boolean;organizationId:string;preferences:DeliveryPreference[]};
type AnalyticsConsentData={organization:{name:string;id:string};enabled:boolean;consentedAt:string|null;policy:string};
type ContextData={selectedOrganizationId:string;selectedActive:boolean;organizations:{id:string;name:string;slug:string;timeZone:string;selectable:boolean;memberWorkspace:string}[];policy:string};
export default function Settings(){
 const {language,setLanguage,t,isRTL}=useLanguage();
 const {refresh:refreshUser,logout,selectOrganization,user,contextVersion,contextChanging}=useSession();
 const result=useResource<Data>("account");
 const context=useResource<ContextData>("organizations/context");
 const delivery=useResource<DeliveryData>("me/preferences");
 const analytics=useResource<AnalyticsConsentData>("me/analytics-consent");
 const [first,setFirst]=useState(""),[last,setLast]=useState("");
 const [newsletter,setNewsletter]=useState(false),[events,setEvents]=useState(false),[quiet,setQuiet]=useState(false);
 const [analyticsEnabled,setAnalyticsEnabled]=useState(false);
 const [quietStart,setQuietStart]=useState("22"),[quietEnd,setQuietEnd]=useState("7");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [exportPassword,setExportPassword]=useState("");
 const privateExport=useRef(createPrivateExportAction());
 const exportScope=user?.isVerified&&!contextChanging&&context.data?.selectedActive?
  [contextVersion,user.id,context.data.selectedOrganizationId].join("|"):null;
 React.useLayoutEffect(()=>{
  privateExport.current.bind(exportScope);
  setExportPassword("");
  return ()=>{privateExport.current.invalidate();};
 },[exportScope]);
 const deliveryGate=useRef(createScopedActionGate());
 // Never allow a preference receipt from the former account or mosque to
 // update the current Settings screen. Refreshing preferences alone does not
 // change this scope because the resource temporarily clears its own data.
 const deliveryScope=[contextVersion,user?.id||"guest",
  contextChanging?"switching":"stable"].join("|");
 React.useLayoutEffect(()=>{
  deliveryGate.current.bind(deliveryScope);
  setBusy(false);setNotice("");setError("");
  return ()=>{deliveryGate.current.invalidate();};
 },[deliveryScope]);
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
 useEffect(()=>{
  setAnalyticsEnabled(analytics.data?.enabled||false);
 },[analytics.data]);
 async function saveAnalytics(){
  if(!analytics.data||analyticsEnabled===analytics.data.enabled||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   await api("me/analytics-consent",{method:"PATCH",
    body:JSON.stringify({enabled:analyticsEnabled,confirm:true})});
   await analytics.refresh();
   setNotice(t("settings.analyticsSaved"));
  }catch(e){
   await analytics.refresh();
   setError(e instanceof Error?e.message:t("settings.analyticsError"));
  }finally{setBusy(false);}
 }
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
  if(busy||contextChanging||!delivery.data)return;
  const hours=parseEmailQuietHours(quiet,quietStart,quietEnd);
  if(!hours){setError(t("settings.quietInvalid"));return;}
  const ticket=deliveryGate.current.begin();
  if(ticket===null)return;
  const expectedOrg=delivery.data.organization.id;
  const choices=[
   {purpose:"community_news" as const,enabled:newsletter,...hours},
   {purpose:"event_updates" as const,enabled:events,...hours}
  ];
  setBusy(true);setNotice("");setError("");
  try{
   // One server transaction, never two sequential independent opt-in writes.
   const response=await api<SavedDelivery>("me/preferences",{
    method:"PATCH",body:JSON.stringify({preferences:choices})
   });
   if(!deliveryGate.current.isCurrent(ticket))return;
   if(response.saved!==true||response.organizationId!==expectedOrg||
    !Array.isArray(response.preferences)||response.preferences.length!==choices.length||
    choices.some(choice=>!response.preferences.some(item=>
     item.purpose===choice.purpose&&item.enabled===choice.enabled&&
     item.quietStartHour===choice.quietStartHour&&
     item.quietEndHour===choice.quietEndHour)))
    throw new Error(t("settings.deliveryUnverified"));
   await delivery.refresh();
   if(deliveryGate.current.isCurrent(ticket))
    setNotice(t("settings.deliverySaved"));
  }catch(e){
   if(deliveryGate.current.isCurrent(ticket)){
    setError(t("settings.deliveryFailed"));
    // Only refresh when the same member and mosque are still authoritative.
    await delivery.refresh();
   }
  }finally{
   if(deliveryGate.current.finish(ticket))setBusy(false);
  }
 }
 async function revoke(id:string){
  const current=id===result.data?.currentSessionId;
  setBusy(true);setError("");setNotice("");
  try{
   await api("account/sessions/"+encodeURIComponent(id),{method:"DELETE"});
   if(current){
    // Once this token is revoked server-side, clear SecureStore and all
    // session-keyed private responses before leaving the Settings screen.
    await logout();
    router.replace("/(tabs)/profile");
    return;
   }
   setNotice(t("settings.sessionRevoked"));await result.refresh();
  }catch(e){setError(e instanceof Error?e.message:t("settings.sessionError"));}
  finally{setBusy(false);}
 }
 async function exportData(intent:number,expected:ExportOwner){
  if(!privateExport.current.isCurrent(intent))return;
  if(!exportPassword){setError(t("settings.exportPasswordRequired"));return;}
  let ownsRequest=true;
  setBusy(true);setError("");setNotice("");
  try{
   setExportPassword("");
   const outcome=await privateExport.current.run(intent,expected,
    ()=>apiPost("account/export",{password:exportPassword,confirm:true}),
    async value=>{
     // Already validated against the account/mosque that confirmed sharing.
     // The OS destination can retain a copy; no delivery is inferred here.
     await Share.share({title:t("settings.export")+" — "+value.organization.name,
      message:JSON.stringify(value,null,2)});
     if(privateExport.current.isCurrent(intent))
      setNotice(value.truncatedCategories.length?t("settings.exportPartialNotice"):t("settings.exportSuccessNotice"));
    });
   if(outcome==="busy")ownsRequest=false;
  }catch{
   if(privateExport.current.isCurrent(intent))setError(t("settings.exportFailed"));
  }finally{
   if(ownsRequest){
    if(privateExport.current.isCurrent(intent))setBusy(false);
   }
  }
 }
 async function deleteRequest(){
  setBusy(true);setError("");setNotice("");
  try{const response=await apiPost<{message:string}>("account/deletion-request",{confirm:true});
   setNotice(response.message);await result.refresh();}
  catch(e){setError(e instanceof Error?e.message:t("settings.requestSubmitFailed"));}finally{setBusy(false);}
 }
 async function logoutEverywhere(){
  setBusy(true);
  try{await apiPost("auth/logout-all",{});}catch{}
  finally{await logout();setBusy(false);router.replace("/(tabs)/profile");}
 }
 const currentSessionId=result.data?.currentSessionId;
 const pref=(label:string,value:boolean,onValueChange:(v:boolean)=>void)=><View key={label} style={[S.row,{paddingVertical:7,flexDirection:isRTL?"row-reverse":"row"}]}><Text style={[S.label,{flex:1,textAlign:isRTL?"right":"left"}]}>{label}</Text>
  <Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} trackColor={{true:T.blue}}/></View>;
 return <Shell><Action label={t("settings.back")} secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow={t("settings.eyebrow")} title={t("settings.pageTitle")} subtitle={t("settings.pageSubtitle")}/>
 <Feedback loading={result.loading} error={result.error} empty={false} refresh={result.refresh}/>
 {result.data?<><Card style={{gap:14}}><Text style={S.headline}>{t("settings.language")}</Text>
 <View style={{flexDirection:"row",gap:10}}><View style={{flex:1}}><Action label={t("settings.english")} secondary={language!=="en"} onPress={()=>void setLanguage("en")}/></View>
 <View style={{flex:1}}><Action label={t("settings.arabic")} secondary={language!=="ar"} onPress={()=>void setLanguage("ar")}/></View></View>
 <Text style={[S.muted,{textAlign:isRTL?"right":"left"}]}>{t("settings.languageNotice")}</Text>
 <Text style={[S.headline,{textAlign:isRTL?"right":"left"}]}>{t("settings.profileTitle")}</Text>
 <Text style={S.muted}>{result.data.profile.email}</Text>
 <Field label={t("settings.firstName")} value={first} onChange={setFirst}/><Field label={t("settings.lastName")} value={last} onChange={setLast}/>
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
 {delivery.data?<>
 {pref(t("settings.communityOptIn"),newsletter,setNewsletter)}
 {pref(t("settings.eventOptIn"),events,setEvents)}
 {pref(t("settings.quietHours"),quiet,setQuiet)}
 {quiet?<View style={{gap:8}}>
 <Field label={t("settings.quietStart")} value={quietStart} onChange={setQuietStart}/>
 <Field label={t("settings.quietEnd")} value={quietEnd} onChange={setQuietEnd}/>
 <Text style={S.muted}>{t("settings.quietZone")}</Text>
 </View>:null}
 </>:null}
 <Text style={S.muted}>{t("settings.deliveryPolicy")}</Text>
 <Action label={t("settings.saveDelivery")} loading={busy} disabled={busy||contextChanging||!delivery.data}
 onPress={()=>void saveDelivery()}/></Card>
 <Card style={{gap:13}}>
 <Text style={S.headline}>{t("settings.analyticsTitle")}</Text>
 <Feedback loading={analytics.loading} error={analytics.error} empty={false} refresh={analytics.refresh}/>
 <Text style={S.muted}>{analytics.data?.organization.name||t("inbox.currentMosque")}</Text>
 <Text style={S.bodyText}>{t("settings.analyticsPolicy")}</Text>
 {analytics.data?pref(t("settings.analyticsOptIn"),analyticsEnabled,setAnalyticsEnabled):null}
 <Action label={t("settings.analyticsSave")} secondary disabled={busy||!analytics.data||
  analyticsEnabled===analytics.data.enabled}
  onPress={()=>{
   if(analyticsEnabled){
    Alert.alert(t("settings.analyticsConfirmTitle"),t("settings.analyticsConfirmBody"),[
     {text:t("settings.cancel"),style:"cancel"},
     {text:t("settings.analyticsSave"),onPress:()=>void saveAnalytics()}
    ]);
   }else void saveAnalytics();
  }}/>
 </Card>
 <Card style={{gap:13}}><Text style={S.headline}>{t("settings.sessionsTitle")}</Text>
 {result.data.sessions.map(s=><View key={s.id} style={[S.row,{paddingVertical:8,
  flexDirection:language==="ar"?"row-reverse":"row"}]}>
  <View style={{flex:1}}>
   <Text style={S.label}>{t("settings.signedIn")} {new Date(s.createdAt).toLocaleDateString(language==="ar"?"ar-EG-u-ca-gregory":"en-US")}
    {s.id===currentSessionId?" · "+t("settings.currentDevice"):""}</Text>
   <Text style={S.muted}>{t("settings.sessionExpires")} {new Date(s.expiresAt).toLocaleDateString(language==="ar"?"ar-EG-u-ca-gregory":"en-US")}</Text>
  </View>
  <Action label={t("settings.sessionRevoke")} secondary disabled={busy}
   onPress={()=>{
    if(s.id===currentSessionId){
     Alert.alert(t("settings.selfRevokeTitle"),t("settings.selfRevokeBody"),[
      {text:t("settings.cancel"),style:"cancel"},
      {text:t("settings.sessionRevoke"),style:"destructive",onPress:()=>void revoke(s.id)}
     ]);
    }else void revoke(s.id);
   }}/>
 </View>)}
 <Action label={t("settings.logoutEverywhere")} secondary icon="shield-lock-outline" disabled={busy} onPress={()=>Alert.alert(t("settings.logoutTitle"),t("settings.logoutBody"),[
  {text:t("settings.cancel"),style:"cancel"},{text:t("settings.logoutConfirm"),style:"destructive",onPress:()=>void logoutEverywhere()}])}/>
 </Card>
 <Card style={{gap:13}}><Text style={S.headline}>{t("settings.privacy")}</Text>
 <Text style={S.bodyText}>{t("settings.exportScope")}</Text>
 <Text style={S.muted}>{t("settings.exportSecurity")}</Text>
 <Field label={t("settings.exportPasswordLabel")} value={exportPassword} onChange={setExportPassword} secure/>
 <Action label={t("settings.export")} secondary icon="download-outline" disabled={busy||!exportPassword||contextChanging||exportScope===null}
 onPress={()=>{
  const intent=privateExport.current.capture();
  if(intent===null||!context.data||!user?.isVerified)return;
  const expected={organizationId:context.data.selectedOrganizationId,email:user.email};
  Alert.alert(t("settings.exportConfirmTitle"),t("settings.exportConfirmBody"),[
  {text:t("settings.cancel"),style:"cancel"},
  {text:t("settings.export"),onPress:()=>void exportData(intent,expected)}
  ]);
 }}/>
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
