import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../src/ui";
import {S,T} from "../src/theme";
import {useResource} from "../src/useResource";
type Notice={id:string;kind:string;localDate:string;title:string;body:string;publishedAt:string;revision:number};
type Data={organization:{name:string;timeZone:string}|null;notices:Notice[];policy:string};
export default function FaithCalendar(){
 const result=useResource<Data>("public/faith");
 return <Shell><Action label="Back to Salah" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="WORSHIP · MOON SIGHTING" title="Ramadan & Eid." subtitle="Dates and occasions are displayed only when confirmed by mosque leadership."/>
 <Feedback loading={result.loading} error={result.error} empty={!result.data?.notices?.length} refresh={result.refresh}/>
 {result.data?.policy?<Card style={{backgroundColor:T.ice}}><Text style={S.bodyText}>{result.data.policy}</Text></Card>:null}
 {result.data?.notices?.map(n=><Card key={n.id} style={{gap:11}}><Text style={S.overline}>{n.kind.replaceAll("_"," ").toUpperCase()}</Text>
 <Text style={S.headline}>{n.title}</Text><Text style={S.value}>{n.localDate}</Text>
 <Text style={S.bodyText}>{n.body}</Text><Text style={S.muted}>Confirmed notice · Updated {new Date(n.publishedAt).toLocaleDateString()}</Text>
 </Card>)}
 </Shell>;
}
