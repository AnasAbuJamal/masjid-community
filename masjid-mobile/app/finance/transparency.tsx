import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../../src/ui";
import {S} from "../../src/theme";
import {useResource} from "../../src/useResource";
type Budget={id:string;category:string;periodMonth:string;amountMinor:number;currency:string};
export default function Transparency(){
 const {data,loading,error,refresh}=useResource<{organization:{name:string};budgets:Budget[];note:string}>("public/financials");
 return <Shell><Action label="Back to Discover" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="COMMUNITY · FINANCIAL TRANSPARENCY" title="Clarity in every contribution." subtitle="Only allocations intentionally published by mosque leadership are visible here."/>
 <Feedback loading={loading} error={error} empty={!data?.budgets.length} refresh={refresh}/>
 {data?.note?<Card><Text style={S.bodyText}>{data.note}</Text></Card>:null}
 {data?.budgets.map(x=><Card key={x.id} style={{gap:10}}><Text style={S.overline}>{x.periodMonth}</Text><Text style={S.headline}>{x.category}</Text>
 <Text style={S.value}>{(x.amountMinor/100).toLocaleString("en-US",{style:"currency",currency:x.currency.toUpperCase()})}</Text><Text style={S.muted}>Approved for public display · planned allocation</Text></Card>)}
 </Shell>;
}
