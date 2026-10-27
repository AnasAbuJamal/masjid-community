import React,{useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {apiPost} from "../../src/api";
import {useSession} from "../../src/session";
import {Action,Card,Feedback,Field,Head,Shell} from "../../src/ui";
import {useResource} from "../../src/useResource";
import {S,T} from "../../src/theme";
type Item={id:string;title:string;description:string;status:string};
export default function Proposal(){
 const {user}=useSession();
 const items=useResource<{items:Item[]}>(user?.isVerified?"proposals":"public/proposals");
 const [title,setTitle]=useState(""),[description,setDescription]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function submit(){
  if(!user){router.push("/auth");return;}
  if(!user.isVerified){setError("Verify your email address before submitting an idea.");return;}
  setBusy(true);setError("");setNotice("");
  try{
   const result=await apiPost<{message:string}>("proposals",{title,description});
   setTitle("");setDescription("");setNotice(result.message);await items.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to send proposal.");}finally{setBusy(false);}
 }
 return <Shell><Action label="Back" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="COMMUNITY · IDEAS" title="Your voice matters." subtitle="Share a thoughtful proposal. The mosque reviews ideas before making them public."/>
 <Card style={{gap:15}}><Field label="Proposal title" value={title} onChange={setTitle}/><Field label="Tell us more about your idea" multiline value={description} onChange={setDescription}/>
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text style={{color:T.success}}>{notice}</Text>:null}
 <Action label={user?"Submit for review":"Sign in to submit"} loading={busy} disabled={!!user&&(!title.trim()||description.trim().length<30)} onPress={()=>void submit()}/></Card>
 {user?.isVerified?<View style={S.section}><Text style={S.headline}>Your submissions</Text><Feedback loading={items.loading} error={items.error} empty={!items.data?.items.length} refresh={items.refresh}/>
 {items.data?.items.map(p=><Card key={p.id} style={{gap:8}}><Text style={S.label}>{p.title}</Text><Text style={S.bodyText}>{p.description}</Text><Text style={S.muted}>Review status: {p.status}</Text></Card>)}</View>:null}
 </Shell>;
}
