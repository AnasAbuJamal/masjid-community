import React from "react";
import {Tabs} from "expo-router";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {T} from "../../src/theme";
import {useLanguage} from "../../src/i18n";
type Icon=React.ComponentProps<typeof MaterialCommunityIcons>["name"];
const tabs:{name:string;title:string;icon:Icon;active:Icon}[]=[
 {name:"index",title:"Today",icon:"home-outline",active:"home"},
 {name:"discover",title:"Gather",icon:"account-group-outline",active:"account-group"},
 {name:"school",title:"Learn",icon:"school-outline",active:"school"},
 {name:"care",title:"Care",icon:"hand-heart-outline",active:"hand-heart"},
 {name:"profile",title:"You",icon:"account-circle-outline",active:"account-circle"},
];
export default function Layout(){
 const {t,isRTL}=useLanguage();
 const titles:Record<string,string>={index:t("tabs.today"),discover:t("tabs.gather"),school:t("tabs.learn"),care:t("tabs.care"),profile:t("tabs.you")};
 return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:T.deep,tabBarInactiveTintColor:T.muted,
 tabBarStyle:{height:73,paddingTop:9,paddingBottom:10,backgroundColor:"#FFFFFF",borderTopColor:T.line,borderTopWidth:1,direction:isRTL?"rtl":"ltr"},
 tabBarLabelStyle:{fontWeight:"700",fontSize:10}}}>
  {tabs.map(tab=><Tabs.Screen key={tab.name} name={tab.name} options={{title:titles[tab.name],tabBarIcon:({color,focused})=><MaterialCommunityIcons name={focused?tab.active:tab.icon} size={24} color={color}/>}}/>)}
  <Tabs.Screen name="salah" options={{href:null}}/>
 </Tabs>;
}
