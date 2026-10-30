import React,{useEffect,useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Field,Feedback,Head,PressRow,Shell} from "../src/ui";
import {useResource} from "../src/useResource";
import {useSession} from "../src/session";
import {useLanguage} from "../src/i18n";
import {S} from "../src/theme";
import {searchScope,scopedSearchPath,memberSurfaceScope,type MembershipSearchContext} from "../src/searchScope";

type Item={kind?:string;id:string;title:string;description:string};
type Results={query?:string;items:Item[];organization?:{name:string}};
const categories=["all","events","articles","announcements","programs","jobs","campaigns","volunteers","construction","rentals","proposals"];
export default function Search(){
 const {language}=useLanguage();
 const {user}=useSession();
 const [query,setQuery]=useState(""),[term,setTerm]=useState(""),[category,setCategory]=useState("all");
 useEffect(()=>{const timer=setTimeout(()=>setTerm(query.trim()),300);return()=>clearTimeout(timer)},[query]);
 // A verified account must not receive home-mosque search results while its
 // server-selected membership context is still loading or was revoked.
 const context=useResource<MembershipSearchContext>(user?.isVerified?"organizations/context":null);
 const scope=searchScope(context.data,!!user?.isVerified);
 const inactive=memberSurfaceScope(context.data,!!user?.isVerified)==="inactive";
 const results=useResource<Results>(scopedSearchPath(term,category,scope));
 const limited=scope==="published_selected";
 const items=(results.data?.items||[]).map(item=>({
  ...item,kind:item.kind||"events"
 }));
 const choices=limited?["all","events","announcements","articles"]:categories;
 return <Shell><Action label="Back to Discover" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="DISCOVER · SEARCH" title="Find your community."
  subtitle={limited
   ?(language==="ar"?"ابحث في التجمعات والأخبار والمقالات المنشورة في المسجد المحدد.":"Search published gatherings, announcements and articles at your selected mosque.")
   :"Search only publicly approved community information."}/>
 <Card style={{gap:12}}><Field label={limited?"Search published mosque content":"Search the mosque"} value={query} onChange={setQuery}/>
 <View style={{flexDirection:"row",flexWrap:"wrap",gap:7}}>{choices.map(c=><View key={c} style={{minWidth:85}}><Action secondary={category!==c} label={c==="all"?"All":c} onPress={()=>setCategory(c)}/></View>)}</View>
 {limited?<Text style={S.muted}>{language==="ar"
  ?"الفئات الأخرى غير متاحة للمسجد المحدد حاليًا."
  :"Other categories remain unavailable for this mosque."}</Text>:null}</Card>
 {scope==="unknown"?<Feedback loading={context.loading} error={context.error} empty={false} refresh={context.refresh}/>:null}
 {inactive?<Card style={{gap:8}}><Text style={S.bodyText}>Your selected mosque membership is inactive. Switch to an active mosque before searching.</Text>
  <Action secondary label="Change mosque" onPress={()=>router.push("/settings")}/></Card>:null}
 {term.length>=2&&scope!=="unknown"?<><Feedback loading={results.loading} error={results.error} empty={!items.length} refresh={results.refresh}/>
 <View style={S.section}>{items.map(item=><PressRow key={item.kind+":"+item.id} title={item.title} subtitle={item.kind+" · "+item.description}
 icon="magnify" onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind:item.kind||"events",id:item.id}})}/>)}</View></>:
 <Card><Text style={S.bodyText}>{scope==="unknown"
  ?(inactive?"Selected mosque membership is inactive.":"Verifying which mosque you selected before searching.")
  :limited?"Enter at least two characters to search published gatherings, notices and articles."
  :"Enter at least two letters to search upcoming events, published stories, programs and community opportunities."}</Text></Card>}
 </Shell>;
}
