import React,{useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,PressRow,Shell} from "../../src/ui";
import {useSession} from "../../src/session";
import {useResource} from "../../src/useResource";
import {S,T} from "../../src/theme";
import {api} from "../../src/api";
type Me={bookings:{id:string;status:string;startAt:string;resource:{title:string}}[];volunteerApplications:{id:string;status:string;opportunity:{title:string}}[];jobApplications:{id:string;job:{title:string}}[];donations:{id:string;amountMinor:number;status:string;currency:string;campaign:{title:string}}[];rsvps:{id:string;event:{id:string;title:string;startAt:string}}[];notifications:{id:string;title:string;body:string;readAt:string|null}[]};
export default function Profile(){
 const {user,logout,refresh:refreshUser}=useSession();
 const [error,setError]=useState(""),[busy,setBusy]=useState("");
 async function cancel(eventId:string){setBusy(eventId);setError("");try{await api("events/rsvp",{method:"DELETE",body:JSON.stringify({eventId})});await result.refresh();}catch(e){setError(e instanceof Error?e.message:"Could not cancel RSVP.");}finally{setBusy("");}}
 const result=useResource<Me>(user?"me":"public/announcements");
 return <Shell>
 <Head eyebrow="ACCOUNT · PROFILE" title={user?"Welcome, "+user.firstName+".":"Make yourself at home."} subtitle={user?"Your information, your choices, your community.":"Sign in to save your participation and manage your records."}/>
 {!user?<Card style={{gap:15}}><Text style={S.headline}>Connect with your mosque</Text><Text style={S.bodyText}>Create a member account or sign in to join events, donate, volunteer and view private records.</Text><Action label="Sign in or register" icon="account-circle-outline" onPress={()=>router.push("/auth")}/></Card>:
 <><Card style={{gap:9}}><View style={S.row}><Text style={S.label}>{user.firstName} {user.lastName}</Text><Text style={S.muted}>{user.role}</Text></View><Text style={S.muted}>{user.email}</Text><Text style={{fontWeight:"800",color:user.isVerified?T.success:T.danger}}>{user.isVerified?"Verified account":"Email not yet verified"}</Text>
 {!user.isVerified?<Action secondary label="Refresh verification status" onPress={()=>void refreshUser()}/>:null}</Card>
 <Feedback loading={result.loading} error={result.error} empty={false} refresh={result.refresh}/>
 {result.data?.donations?.length?<View style={S.section}><Text style={S.headline}>Your giving history</Text>{result.data.donations.map(d=><Card key={d.id}><Text style={S.label}>{d.campaign.title}</Text><Text style={S.bodyText}>{(d.amountMinor/100).toLocaleString("en-US",{style:"currency",currency:d.currency.toUpperCase()})} · {d.status}</Text></Card>)}</View>:null}
 {result.data?.rsvps?.length?<View style={S.section}><Text style={S.headline}>Your event registrations</Text>{result.data.rsvps.map(r=><Card key={r.id} style={{gap:10}}><Text style={S.label}>{r.event.title}</Text><Text style={S.muted}>{new Date(r.event.startAt).toLocaleString()}</Text>{new Date(r.event.startAt)>new Date()?<Action label="Cancel my RSVP" secondary disabled={!!busy} onPress={()=>void cancel(r.event.id)}/>:null}</Card>)}</View>:null}
 {result.data?.bookings?.length?<View style={S.section}><Text style={S.headline}>Facility requests</Text>{result.data.bookings.map(b=><Card key={b.id}><Text style={S.label}>{b.resource.title}</Text><Text style={S.muted}>{new Date(b.startAt).toLocaleString()} · {b.status}</Text></Card>)}</View>:null}
 {result.data?.volunteerApplications?.length?<View style={S.section}><Text style={S.headline}>Volunteering</Text>{result.data.volunteerApplications.map(v=><Card key={v.id}><Text style={S.label}>{v.opportunity.title}</Text><Text style={S.muted}>{v.status}</Text></Card>)}</View>:null}
 {result.data?.jobApplications?.length?<View style={S.section}><Text style={S.headline}>Your job applications</Text>{result.data.jobApplications.map(j=><Card key={j.id}><Text style={S.label}>{j.job.title}</Text><Text style={S.muted}>Submitted</Text></Card>)}</View>:null}
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 <View style={S.section}><Text style={S.headline}>Your account</Text><PressRow icon="account-cog-outline" title="Settings & privacy" subtitle="Profile, communications, sessions and data" onPress={()=>router.push("/settings")}/>
 <PressRow icon="lock-reset" title="Account security" subtitle="Reset your password if needed" onPress={()=>router.push("/recover")}/><PressRow icon="lightbulb-outline" title="My community proposals" subtitle="View your submitted ideas" onPress={()=>router.push("/community/proposal")}/>
 <PressRow icon="bell-outline" title="Notifications" subtitle="Your private inbox" onPress={()=>router.push("/notifications")}/><PressRow icon="hand-heart-outline" title="My volunteer shifts" subtitle="Your schedule and attendance status" onPress={()=>router.push("/volunteer/shifts")}/>
 <PressRow icon="school-outline" title="School and family" subtitle="Only verified linked records" onPress={()=>router.push("/school")}/><PressRow icon="heart-outline" title="Explore giving" subtitle="Donate to published campaigns" onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind:"campaigns",id:"all"}})}/><Action label="Sign out securely" secondary icon="logout" onPress={()=>void logout()}/></View>
 </>}
 </Shell>;
}
