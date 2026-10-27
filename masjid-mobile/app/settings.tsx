import React,{useEffect,useState} from "react";
import {Alert,Share,Switch,Text,View} from "react-native";
import {router} from "expo-router";
import {api,apiPost} from "../src/api";
import {useSession} from "../src/session";
import {Action,Card,Feedback,Field,Head,Shell} from "../src/ui";
import {useResource} from "../src/useResource";
import {S,T} from "../src/theme";
type Session={id:string;createdAt:string;expiresAt:string};
type Data={profile:{firstName:string;lastName:string;email:string;role:string};preferences:{newsletterOptIn:boolean;eventEmailOptIn:boolean;quietHoursEnabled:boolean};
 sessions:Session[];deletion:{id:string;status:string;createdAt:string}|null};
export default function Settings(){
 const {refresh:refreshUser,logout}=useSession();
 const result=useResource<Data>("account");
 const [first,setFirst]=useState(""),[last,setLast]=useState("");
 const [newsletter,setNewsletter]=useState(false),[events,setEvents]=useState(false),[quiet,setQuiet]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 useEffect(()=>{if(result.data){setFirst(result.data.profile.firstName);setLast(result.data.profile.lastName);
  setNewsletter(result.data.preferences.newsletterOptIn);setEvents(result.data.preferences.eventEmailOptIn);setQuiet(result.data.preferences.quietHoursEnabled);}},[result.data]);
 async function save(){
  setBusy(true);setNotice("");setError("");
  try{await api("account",{method:"PATCH",body:JSON.stringify({firstName:first,lastName:last,newsletterOptIn:newsletter,eventEmailOptIn:events,quietHoursEnabled:quiet})});
   await result.refresh();await refreshUser();setNotice("Your preferences were saved.");}
  catch(e){setError(e instanceof Error?e.message:"Unable to save.");}
  finally{setBusy(false);}
 }
 async function revoke(id:string){
  setBusy(true);setError("");setNotice("");
  try{await api("account/sessions/"+id,{method:"DELETE"});setNotice("Session revoked.");await result.refresh();}
  catch(e){setError(e instanceof Error?e.message:"Could not revoke session.");}
  finally{setBusy(false);}
 }
 async function exportData(){
  setBusy(true);setError("");
  try{const value=await api<Record<string,unknown>>("account/export");
   await Share.share({title:"Your account data",message:JSON.stringify(value,null,2)});}
  catch(e){setError(e instanceof Error?e.message:"Unable to prepare export.");}finally{setBusy(false);}
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
 {result.data?<><Card style={{gap:14}}><Text style={S.headline}>Profile</Text>
 <Text style={S.muted}>{result.data.profile.email}</Text>
 <Field label="First name" value={first} onChange={setFirst}/><Field label="Last name" value={last} onChange={setLast}/>
 <Text style={S.headline}>Communication choices</Text>
 {pref("Newsletter opt-in",newsletter,setNewsletter)}{pref("Event emails opt-in",events,setEvents)}
 {pref("Quiet hours preference",quiet,setQuiet)}
 <Text style={S.muted}>Email and push providers are not yet fully connected. Saving preferences does not enroll you in an active mailing service.</Text>
 <Action label="Save my settings" loading={busy} onPress={()=>void save()}/></Card>
 <Card style={{gap:13}}><Text style={S.headline}>Your sessions</Text>
 {result.data.sessions.map(s=><View key={s.id} style={[S.row,{paddingVertical:8}]}><View style={{flex:1}}><Text style={S.label}>Signed in {new Date(s.createdAt).toLocaleDateString()}</Text>
 <Text style={S.muted}>Expires {new Date(s.expiresAt).toLocaleDateString()}</Text></View>
 <Action label="Revoke" secondary disabled={busy} onPress={()=>void revoke(s.id)}/></View>)}
 <Action label="Sign out on all devices" secondary icon="shield-lock-outline" disabled={busy} onPress={()=>Alert.alert("Sign out all sessions?","You will need to sign in again on every device.",[
  {text:"Cancel",style:"cancel"},{text:"Sign out all",style:"destructive",onPress:()=>void logoutEverywhere()}])}/>
 </Card>
 <Card style={{gap:13}}><Text style={S.headline}>Data and privacy</Text>
 <Text style={S.bodyText}>Export a bounded copy of your own account activity, excluding student records that require a safeguarding review.</Text>
 <Action label="Export my account data" secondary icon="download-outline" disabled={busy} onPress={()=>void exportData()}/>
 {result.data.deletion?<Text style={S.muted}>Most recent deletion request: {result.data.deletion.status}</Text>:null}
 <Action label="Request account deletion" secondary icon="account-remove-outline" disabled={busy} onPress={()=>Alert.alert("Request account deletion?","This will create a review request, not immediately erase financial or child records.",[
  {text:"Cancel",style:"cancel"},{text:"Submit request",style:"destructive",onPress:()=>void deleteRequest()}])}/>
 </Card></>:null}
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 </Shell>;
}
