import React,{useState} from "react";
import {Text,View} from "react-native";
import * as Location from "expo-location";
import {router} from "expo-router";
import {Action,Card,Head,Shell} from "../src/ui";
import {bearingToKaaba} from "../src/qibla";
import {S,T} from "../src/theme";
export default function Qibla(){
 const [bearing,setBearing]=useState<number|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function determine(){
  setBusy(true);setError("");
  try{
   const permission=await Location.requestForegroundPermissionsAsync();
   if(permission.status!=="granted"){setError("Location was not permitted. You can use an external map or try again.");return;}
   const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
   setBearing(bearingToKaaba(position.coords.latitude,position.coords.longitude));
  }catch(e){setError(e instanceof Error?e.message:"Could not determine your location.");}
  finally{setBusy(false);}
 }
 return <Shell><Action label="Back to Salah" icon="arrow-left" secondary onPress={()=>router.back()}/>
 <Head eyebrow="SALAH · DIRECTION" title="Towards the Kaaba." subtitle="Location is used on your device to calculate a true-north bearing. It is not sent to the mosque server."/>
 <Card style={{alignItems:"center",gap:14,paddingVertical:40}}>
  <Text style={S.overline}>QIBLA BEARING</Text><Text style={{fontSize:64,fontWeight:"800",color:T.deep,letterSpacing:-2}}>{bearing===null?"—":Math.round(bearing)+"°"}</Text>
  <Text style={[S.bodyText,{textAlign:"center"}]}>Clockwise from true north, not a live phone compass heading.</Text>
 </Card>
 {error?<Card><Text style={{color:T.danger}}>{error}</Text></Card>:null}
 <Action label="Calculate from my location" icon="crosshairs-gps" loading={busy} onPress={()=>void determine()}/>
 <Text style={S.muted}>For a practical direction, use a calibrated compass and account for magnetic declination. Indoor sensors may be inaccurate.</Text>
 </Shell>;
}
