import React,{useState} from "react";
import {Text,View} from "react-native";
import {Action,Card,PressRow} from "./ui";
import {S} from "./theme";
import {useLanguage} from "./i18n";
import {useVenue} from "./venue";

// No location permission, user tracking or guessed coordinates are required.
export function VenuePicker(){
 const {t,isRTL}=useLanguage();
 const {venue,venues,ready,error,refresh,selectVenue}=useVenue();
 const [expanded,setExpanded]=useState(false);
 if(!ready)return null;
 if(error)return <Card style={{gap:10}}>
  <Text accessibilityRole="alert" style={[S.muted,{textAlign:isRTL?"right":"left"}]}>{t("venue.missing")}</Text>
  <Action label={t("feedback.retry")} icon="refresh" secondary onPress={()=>void refresh()}/>
 </Card>;
 if(venues.length<2)return null;
 return <Card style={{gap:9}}>
  <Text style={[S.overline,{textAlign:isRTL?"right":"left"}]}>{t("venue.current")}</Text>
  <Text style={[S.label,{textAlign:isRTL?"right":"left"}]}>{venue?.name}</Text>
  <Action label={t("venue.choose")} icon="map-marker-outline" secondary onPress={()=>setExpanded(!expanded)}/>
  {expanded?<View style={{gap:7}}>
   {venues.map(option=><PressRow key={option.id} icon={option.id===venue?.id?"check-circle-outline":"map-marker-outline"}
    title={option.name} subtitle={option.address||option.timeZone}
    onPress={()=>{void selectVenue(option.id);setExpanded(false)}}/>)}
  </View>:null}
 </Card>;
}
