import React,{useEffect,useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Field,Feedback,Head,PressRow,Shell} from "../src/ui";
import {useResource} from "../src/useResource";
import {useSession} from "../src/session";
import {useLanguage} from "../src/i18n";
import {S,T} from "../src/theme";
import {
 searchScope,scopedSearchPath,memberSurfaceScope,searchTermProblem,
 type MembershipSearchContext
} from "../src/searchScope";

type Item={kind?:string;id:string;title:string;description:string};
type Results={query?:string;items:Item[];organization?:{id?:string;name:string}};

// Display names are reviewed translations, never server-provided category
// labels. The server remains authoritative on which records are published.
const categoryKeys={
 all:"search.kind.all",events:"search.kind.events",
 articles:"search.kind.articles",announcements:"search.kind.announcements",
 programs:"search.kind.programs",jobs:"search.kind.jobs",
 campaigns:"search.kind.campaigns",volunteers:"search.kind.volunteers",
 construction:"search.kind.construction",rentals:"search.kind.rentals",
 proposals:"search.kind.proposals"
} as const;
type Category=keyof typeof categoryKeys;
const categories=Object.keys(categoryKeys) as Category[];
function supportedKind(kind:string|undefined):kind is Exclude<Category,"all">{
 return !!kind&&kind!=="all"&&Object.prototype.hasOwnProperty.call(categoryKeys,kind);
}

export default function Search(){
 const {t,isRTL}=useLanguage();
 const {user}=useSession();
 const [query,setQuery]=useState("");
 const [term,setTerm]=useState("");
 const [category,setCategory]=useState<Category>("all");

 useEffect(()=>{
  const timer=setTimeout(()=>setTerm(query.trim()),300);
  return ()=>clearTimeout(timer);
 },[query]);

 // Authenticated search must wait for the server-selected membership.
 // It must never fall back to the configured guest/pilot mosque when the
 // selected mosque is loading, revoked or inactive.
 const context=useResource<MembershipSearchContext>(
  user?.isVerified?"organizations/context":null);
 const scope=searchScope(context.data,!!user?.isVerified);
 const inactive=memberSurfaceScope(context.data,!!user?.isVerified)==="inactive";
 const limited=scope==="published_selected";
 const choices:Category[]=limited
  ?["all","events","announcements","articles"]:categories;

 const path=scopedSearchPath(term,category,scope);
 const results=useResource<Results>(path);
 const mismatch=limited&&!!results.data&&
  results.data.organization?.id!==context.data?.selectedOrganizationId;
 // A pending debounce must not leave old query results visible while the user
 // types new text. Also discard malformed/unknown resource kinds entirely.
 const settling=term!==query.trim();
 const items=!mismatch&&!settling
  ?(results.data?.items||[]).filter(
    (x):x is Item & {kind:Exclude<Category,"all">}=>supportedKind(x.kind)
   )
  :[];
 const problem=query.trim().length>=2?searchTermProblem(query):null;
 const align=isRTL?"right":"left";

 return <Shell>
  <Action label={t("search.back")} secondary icon="arrow-left"
   onPress={()=>router.back()}/>
  <Head eyebrow={t("search.eyebrow")} title={t("search.title")}
   subtitle={t(limited?"search.subtitleSelected":"search.subtitlePublic")}/>
  <Card style={{gap:12}}>
   <Field label={t(limited?"search.inputSelected":"search.inputPublic")}
    value={query} onChange={setQuery}/>
   <View style={{flexDirection:isRTL?"row-reverse":"row",flexWrap:"wrap",gap:7}}>
    {choices.map(c=><View key={c} style={{minWidth:85}}>
     <Action secondary={category!==c} label={t(categoryKeys[c])}
      onPress={()=>setCategory(c)}/>
    </View>)}
   </View>
   {limited?<Text style={[S.muted,{textAlign:align}]}>
    {t("search.limited")}
   </Text>:null}
   {problem?<Text accessibilityRole="alert" style={[S.muted,{color:T.danger,textAlign:align}]}>
    {t(problem==="long"?"search.tooLong":"search.invalidCharacters")}
   </Text>:null}
  </Card>
  {scope==="unknown"?<Feedback loading={context.loading}
   error={context.error} empty={false} refresh={context.refresh}/>:null}
  {inactive?<Card style={{gap:8}}>
   <Text style={[S.bodyText,{textAlign:align}]}>{t("search.inactive")}</Text>
   <Action secondary label={t("search.switch")}
    onPress={()=>router.push("/settings")}/>
  </Card>:null}
  {path&&!settling?<><Feedback loading={results.loading}
    error={mismatch?t("search.contextMismatch"):results.error}
    empty={!items.length&&!mismatch} refresh={results.refresh}/>
   {!mismatch?<View style={S.section}>
    {items.map(item=><PressRow key={item.kind+":"+item.id}
     title={item.title}
     subtitle={t(categoryKeys[item.kind])+" · "+item.description}
     icon="magnify"
     onPress={()=>router.push({pathname:"/details/[kind]/[id]",
      params:{kind:item.kind,id:item.id}})}/>)}
   </View>:null}
  </>:!problem?<Card><Text style={[S.bodyText,{textAlign:align}]}>
   {scope==="unknown"
    ?t(inactive?"search.inactive":"search.verifying")
    :t(limited?"search.enterSelected":"search.enterPublic")}
  </Text></Card>:null}
 </Shell>;
}
