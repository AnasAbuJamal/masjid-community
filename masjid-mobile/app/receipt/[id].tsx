import React from "react";
import {Text,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useResource} from "../../src/useResource";
type Receipt={id:string;receiptNumber:string;issuedAt:string;amountMinor:number;currency:string;sourceType:string;status:"paid"|"refunded";description:string};
export default function ReceiptScreen(){
 const {id}=useLocalSearchParams<{id:string}>();
 const {data,loading,error,refresh}=useResource<Receipt>("receipts/"+id);
 return <Shell><Action label="Back" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="GIVING · PROVIDER VERIFIED" title="Your receipt." subtitle="A private record issued only after verified payment processing."/>
 <Feedback loading={loading} error={error} empty={!data} refresh={refresh}/>
 {data?<Card style={{gap:14}}><Text style={S.overline}>MASJID COMMUNITY · RECEIPT</Text>
 <Text style={S.headline}>{data.receiptNumber}</Text>
 <Text style={S.bodyText}>{data.description}</Text>
 <Text style={S.value}>{(data.amountMinor/100).toLocaleString("en-US",{style:"currency",currency:data.currency.toUpperCase()})}</Text>
 <View style={S.row}><Text style={S.label}>Status</Text><Text style={{fontWeight:"800",color:data.status==="paid"?T.success:T.danger}}>{data.status.toUpperCase()}</Text></View>
 <View style={S.row}><Text style={S.label}>Verified on</Text><Text style={S.muted}>{new Date(data.issuedAt).toLocaleString()}</Text></View>
 <Text style={S.muted}>Payment confirmation is derived from the processor-signed webhook. A refunded receipt remains visible for audit purposes.</Text>
 </Card>:null}</Shell>;
}
