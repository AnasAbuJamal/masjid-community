import React,{useEffect,useRef,useState} from "react";
import {Text,View} from "react-native";
import {Action,Card} from "./ui";
import {S,T} from "./theme";
import {api} from "./api";
import {useResource} from "./useResource";
import {useSession} from "./session";
import {useLanguage} from "./i18n";
type Report={id:string;studentId:string;summary:string;publishedAt:string|null;
 classSection:{name:string};student:{firstName:string;lastName:string}};
type Page={mode:"family-reports";items:Report[];nextCursor:string|null;
 complete:boolean;pageSize:number};
export function PublishedFamilyReports({enabled,timeZone}:{
 enabled:boolean;timeZone?:string
}){
 const {t,language,isRTL}=useLanguage();
 const {contextVersion}=useSession();
 const archive=useResource<Page>(enabled?"schoolwork/reports":null);
 const [older,setOlder]=useState<Report[]>([]);
 const [cursor,setCursor]=useState<string|null>(null);
 const [complete,setComplete]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const activeContext=useRef(contextVersion);
 const align=isRTL?"right":"left";
 useEffect(()=>{
  activeContext.current=contextVersion;
  setOlder([]);setCursor(archive.data?.nextCursor??null);
  setComplete(archive.data?.complete??true);setBusy(false);setError("");
 },[contextVersion,enabled,archive.data]);
 async function loadMore(){
  if(!enabled||!cursor||complete||busy)return;
  const capturedContext=contextVersion;
  setBusy(true);setError("");
  try{
   const page=await api<Page>("schoolwork/reports?cursor="+encodeURIComponent(cursor));
   if(activeContext.current!==capturedContext)return;
   if(page.mode!=="family-reports"||!Array.isArray(page.items))
    throw Error("Unexpected private report history response.");
   setOlder(current=>[...current,...page.items.filter(x=>
    !current.some(y=>y.id===x.id)&&!archive.data?.items.some(y=>y.id===x.id))]);
   setCursor(page.nextCursor);setComplete(page.complete);
  }catch(e){
   if(activeContext.current===capturedContext)
    setError(e instanceof Error?e.message:t("schoolwork.reportHistoryError"));
  }finally{if(activeContext.current===capturedContext)setBusy(false);}
 }
 function displayTime(instant:string|null){
  if(!instant)return t("schoolwork.timeUnavailable");
  const date=new Date(instant);
  if(!Number.isFinite(date.getTime()))return t("schoolwork.timeUnavailable");
  try{
   if(!timeZone)throw Error("Mosque timezone unavailable");
   return new Intl.DateTimeFormat(language==="ar"?"ar":"en-US",{
    dateStyle:"medium",timeStyle:"short",timeZone
   }).format(date)+" ("+timeZone+")";
  }catch{return date.toISOString()+" (UTC)";}
 }
 if(!enabled)return null;
 const base=archive.data?.items||[];
 const items=[...base,...older.filter(x=>!base.some(y=>y.id===x.id))];
 return <View style={S.section}>
  <Text style={[S.headline,{textAlign:align}]}>{t("schoolwork.publishedReports")}</Text>
  {archive.loading?<Text style={[S.muted,{textAlign:align}]}>{t("schoolwork.reportsLoading")}</Text>:null}
  {archive.error?<Text accessibilityRole="alert" style={{color:T.danger,textAlign:align}}>{archive.error}</Text>:null}
  {items.map(r=><Card key={r.id} style={{gap:9}}>
   <Text style={[S.label,{textAlign:align}]}>{r.student.firstName} {r.student.lastName} · {r.classSection.name}</Text>
   <Text selectable style={[S.bodyText,{textAlign:align}]}>{r.summary}</Text>
   <Text style={[S.muted,{textAlign:align}]}>{t("schoolwork.publishedAt")} {displayTime(r.publishedAt)}</Text>
  </Card>)}
  {!archive.loading&&!archive.error&&!items.length?
   <Text style={[S.muted,{textAlign:align}]}>{t("schoolwork.noReports")}</Text>:null}
  {error?<Text accessibilityRole="alert" style={{color:T.danger,textAlign:align}}>{error}</Text>:null}
  {archive.data&&!complete?
   <Action secondary disabled={busy||!cursor}
    loading={busy} label={t(busy?"schoolwork.loadingOlderReports":"schoolwork.loadOlderReports")}
    onPress={()=>void loadMore()}/>:null}
  {archive.data&&complete&&items.length>0?
   <Text style={[S.muted,{textAlign:align}]}>{t("schoolwork.allReportsLoaded")}</Text>:null}
 </View>;
}
