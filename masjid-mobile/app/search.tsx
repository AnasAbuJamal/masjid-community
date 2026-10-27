import React,{useEffect,useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Field,Feedback,Head,PressRow,Shell} from "../src/ui";
import {useResource} from "../src/useResource";
import {S,T} from "../src/theme";
type Item={kind:string;id:string;title:string;description:string};
type Results={query:string;items:Item[]};
const categories=["all","events","articles","announcements","programs","jobs","campaigns","volunteers","construction","rentals","proposals"];
export default function Search(){
 const [query,setQuery]=useState(""),[term,setTerm]=useState(""),[category,setCategory]=useState("all");
 useEffect(()=>{const timer=setTimeout(()=>setTerm(query.trim()),300);return()=>clearTimeout(timer)},[query]);
 const results=useResource<Results>("public/search?q="+encodeURIComponent(term)+"&kind="+category);
 return <Shell><Action label="Back to Discover" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="DISCOVER · SEARCH" title="Find your community." subtitle="Search only publicly approved community information."/>
 <Card style={{gap:12}}><Field label="Search the mosque" value={query} onChange={setQuery}/>
 <View style={{flexDirection:"row",flexWrap:"wrap",gap:7}}>{categories.map(c=><View key={c} style={{minWidth:85}}><Action secondary={category!==c} label={c==="all"?"All":c} onPress={()=>setCategory(c)}/></View>)}</View></Card>
 {term.length>=2?<><Feedback loading={results.loading} error={results.error} empty={!results.data?.items.length} refresh={results.refresh}/>
 <View style={S.section}>{results.data?.items.map(item=><PressRow key={item.kind+":"+item.id} title={item.title} subtitle={item.kind+" · "+item.description}
 icon="magnify" onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind:item.kind,id:item.id}})}/>)}</View></>:
 <Card><Text style={S.bodyText}>Enter at least two letters to search upcoming events, published stories, programs and community opportunities.</Text></Card>}
 </Shell>;
}
