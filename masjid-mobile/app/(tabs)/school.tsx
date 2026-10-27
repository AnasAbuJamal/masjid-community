import React from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {Action,Card,Feedback,Head,PressRow,Shell} from "../../src/ui";
import {S} from "../../src/theme";
import {useLanguage} from "../../src/i18n";
import {useResource} from "../../src/useResource";
import {useSession} from "../../src/session";
type Program={id:string;title:string;description:string;classes:{id:string;name:string;schedule:string}[]};
type Public={items:Program[]};
type Private={children:{id:string;firstName:string;lastName:string;enrollments:{classSection:{name:string;schedule:string}}[];attendance:{id:string;status:string;session:{startsAt:string;classSection:{name:string}}}[]}[];student?:{id:string;firstName:string;lastName:string}|null;teaching:{id:string;name:string;schedule:string}[]};
export default function School(){
 const {t}=useLanguage();
 const {user}=useSession();
 const catalog=useResource<Public>("public/programs");
 const privateData=useResource<Private>(user?.isVerified?"students":"public/programs");
 return <Shell><Head eyebrow={t("school.eyebrow")} title={t("school.title")} subtitle={t("school.subtitle")}/>
 {!user?<Card style={{gap:14}}><Text style={S.headline}>{t("school.family")}</Text><Text style={S.bodyText}>Sign in to view your own linked children, classes and teacher assignments.</Text><Action label={t("school.signin")} onPress={()=>router.push("/auth")}/></Card>:null}
 {user&&!user.isVerified?<Card><Text style={S.bodyText}>Verify your email and complete any required school linking with the school office to view private records.</Text></Card>:null}
 {user?.isVerified&&["teacher","admin"].includes(user.role)?<Card style={{gap:12}}><Text style={S.headline}>Teacher workspace</Text><Text style={S.muted}>Manage attendance only for assigned classes.</Text><Action label="Open your classroom" onPress={()=>router.push("/school/teacher")}/></Card>:null}
 {user?.isVerified?<><Feedback loading={privateData.loading} error={privateData.error} empty={false} refresh={privateData.refresh}/>
 {privateData.data?.children?.length?<View style={S.section}><Text style={S.headline}>{t("school.linked")}</Text>{privateData.data.children.map(child=><Card key={child.id}><Text style={S.label}>{child.firstName} {child.lastName}</Text><Text style={S.muted}>{child.enrollments.length} current classes</Text>{child.enrollments.map((entry,i)=><Text key={i} style={S.bodyText}>{entry.classSection.name} · {entry.classSection.schedule}</Text>)}{child.attendance.slice(0,5).map(a=><Text key={a.id} style={S.muted}>{a.session.classSection.name} · {new Date(a.session.startsAt).toLocaleDateString()} · {a.status}</Text>)}</Card>)}</View>:null}
 {privateData.data?.teaching?.length?<View style={S.section}><Text style={S.headline}>{t("school.teaching")}</Text>{privateData.data.teaching.map(c=><Card key={c.id}><Text style={S.label}>{c.name}</Text><Text style={S.muted}>{c.schedule}</Text></Card>)}</View>:null}
 </>:null}
 {user?.isVerified?<Card style={{gap:11}}><Text style={S.headline}>Assignments & progress</Text><Text style={S.muted}>See published assignments and reports only for your authorized classes or linked children.</Text><Action label="Open learning center" secondary icon="book-open-page-variant-outline" onPress={()=>router.push("/school/work")}/></Card>:null}
 {user?.isVerified?<Card style={{gap:11}}><Text style={S.headline}>Family tuition</Text><Text style={S.muted}>Review invoices issued to your approved guardian account.</Text><Action label="View my invoices" secondary icon="receipt-text-outline" onPress={()=>router.push("/school/invoices")}/></Card>:null}
 <View style={S.section}><Text style={S.headline}>{t("school.explore")}</Text><Feedback loading={catalog.loading} error={catalog.error} empty={!catalog.data?.items?.length} refresh={catalog.refresh}/>
 {catalog.data?.items?.map(p=><Card key={p.id}><Text style={S.label}>{p.title}</Text><Text style={[S.bodyText,{marginTop:8}]}>{p.description}</Text>{p.classes.map(c=><Text style={[S.muted,{marginTop:6}]} key={c.id}>{c.name} · {c.schedule}</Text>)}
 <View style={{marginTop:13}}><Action label="Apply for this program" secondary icon="application-edit-outline" onPress={()=>router.push({pathname:"/school/apply/[programId]",params:{programId:p.id}})}/></View></Card>)}</View>
 </Shell>;
}
