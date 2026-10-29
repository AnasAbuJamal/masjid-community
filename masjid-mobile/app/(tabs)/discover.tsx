import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Head,PressRow,Shell,Card} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useLanguage} from "../../src/i18n";
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
 {kind:"articles",title:"Community articles",subtitle:"Thoughtful stories and published updates",icon:"newspaper-variant-outline"},
 {kind:"construction",title:"Construction progress",subtitle:"Updates on community building projects",icon:"hard-hat"},
];
export default function Discover(){
 const {t}=useLanguage();
 return <Shell><Head eyebrow={t("discover.eyebrow")} title={t("discover.title")} subtitle={t("discover.subtitle")}/>
 <Card style={{backgroundColor:T.ice,gap:8}}><Text style={S.overline}>{t("discover.one")}</Text><Text style={S.headline}>{t("discover.good")}</Text><Text style={S.bodyText}>{t("discover.browse")}</Text></Card>
 <View style={S.section}><PressRow icon="magnify" title={t("discover.search")} subtitle={t("discover.searchSubtitle")} onPress={()=>router.push("/search")}/>
 <PressRow icon="account-group-outline" title="Community circles" subtitle="Join moderated groups with host approval" onPress={()=>router.push("/circles")}/>
 <PressRow icon="lightbulb-outline" title={t("discover.proposal")} subtitle={t("discover.proposalSubtitle")} onPress={()=>router.push("/community/proposal")}/>
 <PressRow icon="chart-box-outline" title={t("discover.financial")} subtitle="Published community budget allocations" onPress={()=>router.push("/finance/transparency")}/>
 <PressRow icon="email-outline" title={t("discover.contact")} subtitle="Ask questions and share feedback" onPress={()=>router.push("/contact")}/>
 {categories.map(c=><PressRow key={c.kind} title={c.title} subtitle={c.subtitle} icon={c.icon} onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind:c.kind,id:"all"}})}/>)}</View>
 </Shell>;
}
