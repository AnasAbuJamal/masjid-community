import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,PressRow,Shell} from "../../src/ui";
import {useSession} from "../../src/session";
import {useResource} from "../../src/useResource";
import {S,T} from "../../src/theme";
type Me={donations:{id:string;amountMinor:number;status:string;currency:string;campaign:{title:string}}[];rsvps:{id:string;event:{title:string;startAt:string}}[];notifications:{id:string;title:string;body:string;readAt:string|null}[]};
export default function Profile(){
 const {user,logout}=useSession();
 const result=useResource<Me>(user?"me":"public/announcements");
 return <Shell>
 <Head eyebrow="ACCOUNT · PROFILE" title={user?"Welcome, "+user.firstName+".":"Make yourself at home."} subtitle={user?"Your information, your choices, your community.":"Sign in to save your participation and manage your records."}/>
 {!user?<Card style={{gap:15}}><Text style={S.headline}>Connect with your mosque</Text><Text style={S.bodyText}>Create a member account or sign in to join events, donate, volunteer and view private records.</Text><Action label="Sign in or register" icon="account-circle-outline" onPress={()=>router.push("/auth")}/></Card>:
 <><Card style={{gap:9}}><View style={S.row}><Text style={S.label}>{user.firstName} {user.lastName}</Text><Text style={S.muted}>{user.role}</Text></View><Text style={S.muted}>{user.email}</Text><Text style={{fontWeight:"800",color:user.isVerified?T.success:T.danger}}>{user.isVerified?"Verified account":"Email not yet verified"}</Text>
 {!user.isVerified?<Action secondary label="Refresh verification status" onPress={()=>void result.refresh()}/>:null}</Card>
 <Feedback loading={result.loading} error={result.error} empty={false} refresh={result.refresh}/>
 {result.data?.donations?.length?<View style={S.section}><Text style={S.headline}>Your giving history</Text>{result.data.donations.map(d=><Card key={d.id}><Text style={S.label}>{d.campaign.title}</Text><Text style={S.bodyText}>{(d.amountMinor/100).toLocaleString("en-US",{style:"currency",currency:d.currency.toUpperCase()})} · {d.status}</Text></Card>)}</View>:null}
 {result.data?.rsvps?.length?<View style={S.section}><Text style={S.headline}>Your event registrations</Text>{result.data.rsvps.map(r=><Card key={r.id}><Text style={S.label}>{r.event.title}</Text><Text style={S.muted}>{new Date(r.event.startAt).toLocaleString()}</Text></Card>)}</View>:null}
 <View style={S.section}><Text style={S.headline}>Your account</Text><PressRow icon="school-outline" title="School and family" subtitle="Only verified linked records" onPress={()=>router.push("/school")}/><PressRow icon="heart-outline" title="Explore giving" subtitle="Donate to published campaigns" onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind:"campaigns",id:"all"}})}/><Action label="Sign out securely" secondary icon="logout" onPress={()=>void logout()}/></View>
 </>}
 </Shell>;
}
