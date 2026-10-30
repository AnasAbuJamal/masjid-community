import React,{useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,PressRow,Shell} from "../../src/ui";
import {useSession} from "../../src/session";
import {useResource} from "../../src/useResource";
import {S,T} from "../../src/theme";
import {useLanguage} from "../../src/i18n";
import {api} from "../../src/api";
type Me={organization?:{name:string};bookings:{id:string;status:string;startAt:string;resource:{title:string}}[];volunteerApplications:{id:string;status:string;opportunity:{title:string}}[];jobApplications:{id:string;status:string;job:{title:string}}[];donations:{id:string;amountMinor:number;status:string;currency:string;campaign:{title:string};receipt:{id:string;receiptNumber:string}|null}[];rsvps:{id:string;status:string;checkedInAt:string|null;event:{id:string;title:string;startAt:string}}[];notifications:{id:string;title:string;body:string;readAt:string|null}[]};
export default function Profile(){
 const {t,language}=useLanguage();
 const {user,logout,refresh:refreshUser}=useSession();
 const [error,setError]=useState(""),[busy,setBusy]=useState("");
 async function cancel(eventId:string){setBusy(eventId);setError("");try{await api("events/rsvp",{method:"DELETE",body:JSON.stringify({eventId})});await result.refresh();}catch(e){setError(e instanceof Error?e.message:"Could not cancel RSVP.");}finally{setBusy("");}}
 const result=useResource<Me>(user?"me":"public/announcements");
 return <Shell>
 <Head eyebrow={t("profile.eyebrow")} title={user?(language==="ar"?"مرحبًا، "+user.firstName:"Welcome, "+user.firstName+"."):t("profile.guest")} subtitle={user?t("profile.member"):t("profile.subtitle")}/>
 {!user?<Card style={{gap:15}}><Text style={S.headline}>{t("profile.connect")}</Text><Text style={S.bodyText}>Create a member account or sign in to join events, donate, volunteer and view private records.</Text><Action label={t("profile.login")} icon="account-circle-outline" onPress={()=>router.push("/auth")}/></Card>:
 <><Card style={{gap:9}}><View style={S.row}><Text style={S.label}>{user.firstName} {user.lastName}</Text><Text style={S.muted}>{user.role}</Text></View><Text style={S.muted}>{user.email}</Text><Text style={{fontWeight:"800",color:user.isVerified?T.success:T.danger}}>{user.isVerified?t("common.verified"):t("common.unverified")}</Text>
 {!user.isVerified?<Action secondary label="Refresh verification status" onPress={()=>void refreshUser()}/>:null}</Card>
 {result.data?.organization?.name?<Text style={S.muted}>{result.data.organization.name}</Text>:null}
 <Feedback loading={result.loading} error={result.error} empty={false} refresh={result.refresh}/>
 {result.data?.donations?.length?<View style={S.section}><Text style={S.headline}>{t("profile.giving")}</Text>{result.data.donations.map(d=><Card key={d.id}><Text style={S.label}>{d.campaign.title}</Text><Text style={S.bodyText}>{(d.amountMinor/100).toLocaleString("en-US",{style:"currency",currency:d.currency.toUpperCase()})} · {d.status}</Text>
 {d.receipt?<Action label={"Receipt "+d.receipt.receiptNumber} secondary onPress={()=>router.push({pathname:"/receipt/[id]",params:{id:d.receipt!.id}})}/>:null}</Card>)}</View>:null}
 {result.data?.rsvps?.length?<View style={S.section}><Text style={S.headline}>{t("profile.events")}</Text>{result.data.rsvps.map(r=><Card key={r.id} style={{gap:10}}><Text style={S.label}>{r.event.title}</Text><Text style={S.muted}>{new Date(r.event.startAt).toLocaleString()} · {r.status==="waitlisted"?"Waitlisted — not confirmed":r.checkedInAt?"Checked in — arrival confirmed":"Confirmed reservation"}</Text>{new Date(r.event.startAt)>new Date()&&!r.checkedInAt?<Action label={r.status==="waitlisted"?"Leave waitlist":"Cancel my RSVP"} secondary disabled={!!busy} onPress={()=>void cancel(r.event.id)}/>:null}</Card>)}</View>:null}
 {result.data?.bookings?.length?<View style={S.section}><Text style={S.headline}>{t("profile.bookings")}</Text>{result.data.bookings.map(b=><Card key={b.id}><Text style={S.label}>{b.resource.title}</Text><Text style={S.muted}>{new Date(b.startAt).toLocaleString()} · {b.status}</Text></Card>)}</View>:null}
 {result.data?.volunteerApplications?.length?<View style={S.section}><Text style={S.headline}>{t("profile.volunteer")}</Text>{result.data.volunteerApplications.map(v=><Card key={v.id}><Text style={S.label}>{v.opportunity.title}</Text><Text style={S.muted}>{v.status}</Text></Card>)}</View>:null}
 {result.data?.jobApplications?.length?<View style={S.section}><Text style={S.headline}>{t("profile.jobs")}</Text>{result.data.jobApplications.map(j=><Card key={j.id}><Text style={S.label}>{j.job.title}</Text><Text style={S.muted}>{j.status}</Text></Card>)}</View>:null}
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 <View style={S.section}><Text style={S.headline}>{t("profile.account")}</Text>{user.mfaRequired?<PressRow icon="shield-key-outline" title="Complete administrator MFA" subtitle="Required to access privileged actions" onPress={()=>router.push("/mfa")}/>:null}
 <PressRow icon="account-cog-outline" title="Settings & privacy" subtitle="Profile, communications, sessions and data" onPress={()=>router.push("/settings")}/>
 <PressRow icon="lock-reset" title="Account security" subtitle="Reset your password if needed" onPress={()=>router.push("/recover")}/><PressRow icon="account-group-outline" title={language==="ar"?"حلقاتي المجتمعية":"My community circles"} subtitle={language==="ar"?"طلباتك والحلقات المعتمدة والتحديثات الخاصة":"Your requests, approved groups and private updates"} onPress={()=>router.push("/circles")}/>
 <PressRow icon="lightbulb-outline" title="My community proposals" subtitle="View your submitted ideas" onPress={()=>router.push("/community/proposal")}/>
 <PressRow icon="bell-outline" title="Notifications" subtitle="Your private inbox" onPress={()=>router.push("/notifications")}/><PressRow icon="hand-heart-outline" title="My volunteer shifts" subtitle="Your schedule and attendance status" onPress={()=>router.push("/volunteer/shifts")}/>
 <PressRow icon="school-outline" title="School and family" subtitle="Only verified linked records" onPress={()=>router.push("/school")}/><PressRow icon="heart-outline" title="Explore giving" subtitle="Donate to published campaigns" onPress={()=>router.push({pathname:"/details/[kind]/[id]",params:{kind:"campaigns",id:"all"}})}/><Action label={t("profile.signout")} secondary icon="logout" onPress={()=>void logout()}/></View>
 </>}
 </Shell>;
}
