import React from "react";
import {Text,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useResource} from "../../src/useResource";
import {useLanguage} from "../../src/i18n";
import {receiptStatusKey} from "../../src/i18n-account";
import {scheduleRevisionTime} from "../../src/schedule-revision-time";
type Receipt={id:string;receiptNumber:string;issuedAt:string;amountMinor:number;currency:string;sourceType:string;status:string;description:string;organization?:{id:string;name:string;timeZone:string}};
export default function ReceiptScreen(){
 const {t,language,isRTL}=useLanguage();const align=isRTL?"right":"left";
 const {id}=useLocalSearchParams<{id:string}>();
 const {data,loading,error,refresh}=useResource<Receipt>("receipts/"+id);
 // Only the receipt's owning mosque can establish its local time. Legacy
 // responses lack that metadata; label UTC explicitly instead of using the phone.
 const mosqueIssuedAt=data?scheduleRevisionTime(data.issuedAt,data.organization?.timeZone,language):null;
 const issuedAt=mosqueIssuedAt||(data?scheduleRevisionTime(data.issuedAt,"UTC",language):null);
 return <Shell><Action label={t("common.back")} secondary icon={isRTL?"arrow-right":"arrow-left"} onPress={()=>router.back()}/>
 <Head eyebrow={t("account.receiptEyebrow")} title={t("account.receiptTitle")} subtitle={t("account.receiptSubtitle")}/>
 <Feedback loading={loading} error={error?t("account.receiptFailed"):""} empty={!data} refresh={refresh}/>
 {data?<Card style={{gap:14}}><Text style={[S.overline,{textAlign:align}]}>{t("account.receiptBrand")}</Text>
 <Text selectable style={[S.headline,{textAlign:align}]}>{data.receiptNumber}</Text>
 <Text style={[S.bodyText,{textAlign:align}]}>{data.description}</Text>
 <Text style={[S.value,{textAlign:align}]}>{(data.amountMinor/100).toLocaleString(language==="ar"?"ar-EG":"en-US",{style:"currency",currency:data.currency.toUpperCase()})}</Text>
 <View style={[S.row,{flexDirection:isRTL?"row-reverse":"row",flexWrap:"wrap",gap:8}]}><Text style={[S.label,{textAlign:align}]}>{t("account.receiptStatus")}</Text><Text style={{fontWeight:"800",color:data.status==="paid"?T.success:data.status==="refunded"?T.danger:T.muted,textAlign:align,flexShrink:1}}>{t(receiptStatusKey(data.status))}</Text></View>
 <View style={[S.row,{flexDirection:isRTL?"row-reverse":"row",flexWrap:"wrap",gap:8}]}><Text style={[S.label,{textAlign:align}]}>{t("account.receiptIssued")}</Text><Text style={[S.muted,{textAlign:align,flexShrink:1}]}>{issuedAt||t("account.dateUnavailable")}</Text></View>
 {issuedAt?<Text style={[S.muted,{textAlign:align}]}>{mosqueIssuedAt?t("account.receiptMosqueTime")+": "+data.organization?.timeZone:t("account.receiptUtc")}</Text>:null}
 <Text style={[S.muted,{textAlign:align}]}>{t("account.receiptNote")}</Text>
 </Card>:null}</Shell>;
}
