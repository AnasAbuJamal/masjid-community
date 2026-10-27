import React from "react";
import {Tabs} from "expo-router";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {T} from "../../src/theme";
import {useLanguage} from "../../src/i18n";
type Icon=React.ComponentProps<typeof MaterialCommunityIcons>["name"];
const tabs:{name:string;title:string;icon:Icon;active:Icon}[]=[
 {name:"index",title:"Home",icon:"home-outline",active:"home"},
 {name:"salah",title:"Salah",icon:"moon-waning-crescent",active:"moon-waning-crescent"},
 {name:"discover",title:"Discover",icon:"compass-outline",active:"compass"},
 {name:"school",title:"School",icon:"school-outline",active:"school"},
 {name:"profile",title:"Profile",icon:"account-circle-outline",active:"account-circle"},
];
export default function Layout(){
 const {t,isRTL}=useLanguage();
 const titles:Record<string,string>={index:t("tabs.home"),salah:t("tabs.salah"),discover:t("tabs.discover"),school:t("tabs.school"),profile:t("tabs.profile")};
 return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:T.deep,tabBarInactiveTintColor:T.muted,
 tabBarStyle:{height:73,paddingTop:9,paddingBottom:10,backgroundColor:"#FFFFFF",borderTopColor:T.line,borderTopWidth:1,direction:isRTL?"rtl":"ltr"},
 tabBarLabelStyle:{fontWeight:"700",fontSize:10}}}>
  {tabs.map(t=><Tabs.Screen key={t.name} name={t.name} options={{title:titles[t.name],tabBarIcon:({color,focused})=><MaterialCommunityIcons name={focused?t.active:t.icon} size={24} color={color}/>}}/>)}
 </Tabs>;
}
