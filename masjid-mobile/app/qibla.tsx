import React,{useEffect,useRef,useState} from "react";
import {Text,TextInput,View} from "react-native";
import * as Location from "expo-location";
import {router} from "expo-router";
import {Action,Card,Head,Shell} from "../src/ui";
import {bearingToKaaba} from "../src/qibla";
import {parseQiblaCoordinates} from "../src/qibla-input";
import {useLanguage} from "../src/i18n";
import {S,T} from "../src/theme";

type BearingResult={degrees:number;source:"device"|"manual"};

export default function Qibla(){
 const {t,isRTL}=useLanguage();
 const [result,setResult]=useState<BearingResult|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [latitude,setLatitude]=useState("");
 const [longitude,setLongitude]=useState("");

 // A location permission prompt or GPS request may settle after a manual
 // calculation or after this screen unmounts. Its result must not overwrite
 // the user's later intention or update a now-unmounted screen.
 const attempt=useRef(0);
 useEffect(()=>()=>{attempt.current++},[]);

 const resetForInput=(value:string,field:"latitude"|"longitude")=>{
  attempt.current++;
  setBusy(false);
  setError("");
  setResult(null);
  if(field==="latitude")setLatitude(value);
  else setLongitude(value);
 };

 async function determine(){
  const mine=++attempt.current;
  setBusy(true);
  setError("");
  setResult(null);
  try{
   const permission=await Location.requestForegroundPermissionsAsync();
   if(mine!==attempt.current)return;
   if(permission.status!=="granted"){
    setError(t("qibla.permissionDenied"));
    return;
   }
   const position=await Location.getCurrentPositionAsync({
    accuracy:Location.Accuracy.Balanced
   });
   if(mine!==attempt.current)return;
   const degrees=bearingToKaaba(position.coords.latitude,position.coords.longitude);
   setResult({degrees,source:"device"});
  }catch{
   if(mine===attempt.current)setError(t("qibla.locationError"));
  }finally{
   if(mine===attempt.current)setBusy(false);
  }
 }

 function calculateManually(){
  ++attempt.current;
  setBusy(false);
  setError("");
  setResult(null);
  const position=parseQiblaCoordinates(latitude,longitude);
  if(!position){
   setError(t("qibla.invalidCoordinates"));
   return;
  }
  try{
   const degrees=bearingToKaaba(position.latitude,position.longitude);
   setResult({degrees,source:"manual"});
  }catch{
   setError(t("qibla.undefinedBearing"));
  }
 }

 const align=isRTL?"right":"left";
 const bearingLabel=result
  ?Math.round(result.degrees)+" "+t("qibla.accessibleDegrees")
  :t("qibla.notCalculated");

 return <Shell>
  <Action label={t("qibla.back")} icon="arrow-left" secondary
   onPress={()=>router.back()}/>
  <Head eyebrow={t("qibla.eyebrow")} title={t("qibla.title")}
   subtitle={t("qibla.subtitle")}/>
  <Card style={{alignItems:"center",gap:14,paddingVertical:36}}>
   <Text style={S.overline}>{t("qibla.bearing")}</Text>
   <View accessible accessibilityLabel={bearingLabel}
    accessibilityLiveRegion="polite" style={{alignItems:"center",gap:8}}>
    <Text style={{fontSize:64,fontWeight:"800",color:T.deep,letterSpacing:-2,
     writingDirection:"ltr"}}>
     {result?Math.round(result.degrees)+"°":"—"}
    </Text>
    <Text style={[S.muted,{textAlign:"center"}]}>
     {result?t(result.source==="device"?"qibla.sourceDevice":"qibla.sourceManual"):
      t("qibla.notCalculated")}
    </Text>
   </View>
   <Text style={[S.bodyText,{textAlign:"center"}]}>
    {t("qibla.bearingDescription")}
   </Text>
  </Card>
  {error?<Card><Text accessibilityRole="alert"
   style={{color:T.danger,textAlign:align}}>{error}</Text></Card>:null}
  <Action label={t("qibla.useLocation")} icon="crosshairs-gps"
   loading={busy} onPress={()=>void determine()}/>
  <Card style={{gap:13}}>
   <Text style={[S.headline,{textAlign:align}]}>{t("qibla.manualHeading")}</Text>
   <Text style={[S.bodyText,{textAlign:align}]}>{t("qibla.manualHelp")}</Text>
   <View style={{gap:6}}>
    <Text style={[S.label,{textAlign:align}]}>{t("qibla.latitude")}</Text>
    <TextInput accessibilityLabel={t("qibla.latitude")}
     placeholder="42.3601" placeholderTextColor={T.muted}
     value={latitude} onChangeText={value=>resetForInput(value,"latitude")}
     maxLength={18} keyboardType="numbers-and-punctuation"
     autoCapitalize="none" autoCorrect={false}
     style={[S.input,{textAlign:"left",writingDirection:"ltr"}]}/>
   </View>
   <View style={{gap:6}}>
    <Text style={[S.label,{textAlign:align}]}>{t("qibla.longitude")}</Text>
    <TextInput accessibilityLabel={t("qibla.longitude")}
     placeholder="-71.0589" placeholderTextColor={T.muted}
     value={longitude} onChangeText={value=>resetForInput(value,"longitude")}
     maxLength={18} keyboardType="numbers-and-punctuation"
     autoCapitalize="none" autoCorrect={false}
     style={[S.input,{textAlign:"left",writingDirection:"ltr"}]}/>
   </View>
   <Action label={t("qibla.manualAction")} secondary
    disabled={busy} icon="compass-outline" onPress={calculateManually}/>
  </Card>
  <Text style={[S.muted,{textAlign:align}]}>{t("qibla.caution")}</Text>
 </Shell>;
}
