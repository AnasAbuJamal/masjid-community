import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../../src/ui";
import {S} from "../../src/theme";
import {useResource} from "../../src/useResource";
import {usePilotSurface} from "../../src/usePilotSurface";
import {MemberScopeNotice} from "../../src/MemberScopeNotice";
type Budget={id:string;category:string;periodMonth:string;amountMinor:number;currency:string};
export default function Transparency(){
 const surface=usePilotSurface();
 const enabled=surface.allowed||surface.scope==="limited";
 const selected=surface.scope==="pilot"||surface.scope==="limited";
 const path=enabled?(selected?"organizations/view?resource=financials":"public/financials"):null;
 const {data,loading,error,refresh}=useResource<{organization:{name:string};budgets:Budget[];note:string}>(path);
 return <Shell><Action label="Back to Discover" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="COMMUNITY · FINANCIAL TRANSPARENCY" title="Clarity in every contribution." subtitle={data?.organization?.name||"Only allocations intentionally published by mosque leadership are visible here."}/>
 {!enabled?<MemberScopeNotice {...surface}/>:null}
 {enabled?<Feedback loading={loading} error={error} empty={!data?.budgets.length} refresh={refresh}/>:null}
 {data?.note?<Card><Text style={S.bodyText}>{data.note}</Text></Card>:null}
 {data?.budgets.map(x=><Card key={x.id} style={{gap:10}}><Text style={S.overline}>{x.periodMonth}</Text><Text style={S.headline}>{x.category}</Text>
 <Text style={S.value}>{(x.amountMinor/100).toLocaleString("en-US",{style:"currency",currency:x.currency.toUpperCase()})}</Text><Text style={S.muted}>Approved for public display · planned allocation</Text></Card>)}
 </Shell>;
}
