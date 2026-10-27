import React from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {useResource} from "../../src/useResource";
type Shift={id:string;startAt:string;endAt:string;checkedInAt:string|null;status:string;opportunity:{title:string}};
export default function MyShifts(){
 const {data,loading,error,refresh}=useResource<{shifts:Shift[]}>("shifts");
 return <Shell><Action label="Back to profile" secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow="VOLUNTEERING · MY SHIFTS" title="Show up for good." subtitle="Only your scheduled volunteer shifts appear here. Staff record attendance."/>
 <Feedback loading={loading} error={error} empty={!data?.shifts.length} refresh={refresh}/>
 {data?.shifts.map(s=><Card key={s.id} style={{gap:8}}><Text style={S.headline}>{s.opportunity.title}</Text>
 <Text style={S.bodyText}>{new Date(s.startAt).toLocaleString()} – {new Date(s.endAt).toLocaleString()}</Text>
 <Text style={{fontWeight:"700",color:s.status==="completed"?T.success:T.deep}}>{s.status}</Text>
 <Text style={S.muted}>{s.checkedInAt?"Checked in · "+new Date(s.checkedInAt).toLocaleTimeString():"Not checked in"}</Text></Card>)}
 </Shell>;
}
