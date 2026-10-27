import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Head,PressRow,Shell,Card} from "../../src/ui";
import {S,T} from "../../src/theme";
type Tile={kind:string;title:string;subtitle:string;icon:React.ComponentProps<typeof import("@expo/vector-icons").MaterialCommunityIcons>["name"]};
const categories:Tile[]=[
 {kind:"events",title:"Events & gatherings",subtitle:"Meet, learn and celebrate together",icon:"calendar-heart"},
 {kind:"announcements",title:"Mosque announcements",subtitle:"News and urgent community updates",icon:"bullhorn-outline"},
 {kind:"campaigns",title:"Donations & giving",subtitle:"Support verified causes",icon:"heart-outline"},
 {kind:"volunteers",title:"Volunteer",subtitle:"Offer your time and skills",icon:"hand-heart-outline"},
 {kind:"programs",title:"Classes & learning",subtitle:"Explore local education programs",icon:"school-outline"},
 {kind:"jobs",title:"Jobs & opportunities",subtitle:"Connect with local work",icon:"briefcase-outline"},
 {kind:"proposals",title:"Community proposals",subtitle:"Help shape upcoming projects",icon:"lightbulb-on-outline"},
 {kind:"rentals",title:"Facilities & rentals",subtitle:"Request spaces and resources",icon:"office-building-outline"},
];
export default function Discover(){
 return <Shell><Head eyebrow="COMMUNITY · DISCOVER" title="Belong. Contribute. Grow." subtitle="All the ways your community comes together, in one thoughtful place."/>
 <Card style={{backgroundColor:T.ice,gap:8}}><Text style={S.overline}>ONE COMMUNITY</Text><Text style={S.headline}>Good things happen together.</Text><Text style={S.bodyText}>Browse the mosque's published events, programs and opportunities.</Text></Card>
 <View style={S.section}><PressRow icon="lightbulb-outline" title="Submit a community proposal" subtitle="Share an idea for moderator review" onPress={()=>router.push("/community/proposal")}/>
 <PressRow icon="email-outline" title="Contact mosque staff" subtitle="Ask questions and share feedback" onPress={()=>router.push("/contact")}/>
 {categories.map(c=><PressRow key={c.kind} title={c.title} subtitle={c.subtitle} icon={c.icon} onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind:c.kind,id:"all"}})}/>)}</View>
 </Shell>;
}
