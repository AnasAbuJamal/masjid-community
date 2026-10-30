import React,{useState} from "react";
import {Switch,Text,View} from "react-native";
import {router} from "expo-router";
import {apiPost} from "../../src/api";
import {useLanguage} from "../../src/i18n";
import {useSession} from "../../src/session";
import {useResource} from "../../src/useResource";
import {Action,Card,Feedback,Field,Head,Shell} from "../../src/ui";
import {S,T} from "../../src/theme";
import {usePilotSurface} from "../../src/usePilotSurface";
import {MemberScopeNotice} from "../../src/MemberScopeNotice";
type Policy={enabled:boolean;hours:string;response:string;limits:string;emergency:string;message:string;consentVersion:string};
type Request={reference:string;status:string;createdAt:string;closedAt:string|null};
export default function CareRequest(){
 const {user}=useSession();
 const surface=usePilotSurface();
 const {allowed,contextVersion}=surface;
 const {language}=useLanguage();const ar=language==="ar";
 const L=(en:string,arabic:string)=>ar?arabic:en;
 const policy=useResource<Policy>(allowed?"care":null);
 const mine=useResource<{requests:Request[]}>(allowed&&user?.isVerified?"care/mine":null);
 const [message,setMessage]=useState(""),[consent,setConsent]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 React.useEffect(()=>{
  // Never carry a sensitive unsubmitted care narrative into another mosque.
  setMessage("");setConsent(false);setNotice("");setError("");
 },[contextVersion]);
 async function submit(){
  if(!allowed){setError("Care intake is unavailable at your selected mosque.");return;}
  if(!user){router.push("/auth");return;}
  if(!user.isVerified){setError(L("Verify your account before requesting private assistance.","يرجى توثيق الحساب قبل إرسال طلب المساعدة."));return;}
  if(!policy.data?.enabled||!consent||message.trim().length<20)return;
  setBusy(true);setError("");setNotice("");
  try{
   const r=await apiPost<{reference:string;status:string;message:string}>("care",{
    message:message.trim(),consent:true,consentVersion:policy.data.consentVersion
   });
   setNotice(L("Private reference: ","مرجع الطلب الخاص: ")+r.reference+
    L(". Save this number. No emergency response has been started.",". احتفظ بهذا الرقم. لم تُفعّل خدمة طوارئ."));
   setMessage("");setConsent(false);await mine.refresh();
  }catch(e){setError(e instanceof Error?e.message:L("The request was not recorded. Contact the mosque directly.","لم يُسجّل الطلب. تواصل مع المسجد مباشرة."));}
  finally{setBusy(false);}
 }
 return <Shell>
 <Action label={L("Back to Care","العودة إلى العطاء")} secondary icon="arrow-left" onPress={()=>router.back()}/>
 <Head eyebrow={L("CARE · CONFIDENTIAL REQUEST","العطاء · طلب سري")}
  title={L("Ask for a private conversation.","اطلب تواصلاً خاصاً.")}
  subtitle={L("A trained human coordinator will review requests only when the mosque has enabled this service.",
   "يراجع منسق مؤهل الطلبات فقط عند تفعيل المسجد لهذه الخدمة.")}/>
 {!allowed?<MemberScopeNotice {...surface}/>:null}
 {allowed?<><Feedback loading={policy.loading} error={policy.error} empty={false} refresh={policy.refresh}/>
 {!policy.loading&&!policy.data?.enabled?<Card>
  <Text style={S.bodyText}>{L("Online care intake has not been enabled. Use the mosque's published contact methods. In an emergency, contact local emergency services.",
   "لم تُفعّل خدمة الطلبات السرية. استخدم طرق التواصل الرسمية للمسجد. في حالات الطوارئ اتصل بخدمات الطوارئ المحلية.")}</Text>
  <Action label={L("Contact the mosque","تواصل مع المسجد")} secondary onPress={()=>router.push("/contact")}/>
 </Card>:null}
 {policy.data?.enabled?<Card style={{gap:14}}>
  <Text style={S.label}>{L("Available hours","ساعات الاستقبال")}</Text><Text style={S.bodyText}>{policy.data.hours}</Text>
  <Text style={S.label}>{L("Expected response","الوقت المتوقع للرد")}</Text><Text style={S.bodyText}>{policy.data.response}</Text>
  <Text style={S.label}>{L("Limits of confidentiality","حدود السرية")}</Text><Text style={S.bodyText}>{policy.data.limits}</Text>
  <Text style={S.label}>{L("Urgent help","المساعدة العاجلة")}</Text>
  <Text style={[S.bodyText,{color:T.danger}]}>{policy.data.emergency}</Text>
  {!user?<Action label={L("Sign in to continue","سجّل الدخول للمتابعة")} onPress={()=>router.push("/auth")}/>:null}
  {user?.isVerified?<><Field label={L("What kind of conversation would help? (20–650 characters; avoid unnecessary details)",
   "كيف يمكننا مساعدتك؟ (٢٠–٦٥٠ حرفاً؛ تجنب التفاصيل غير اللازمة)")} value={message} onChange={setMessage} multiline/>
  <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
   <Switch accessibilityLabel={L("Consent to restricted processing","الموافقة على المعالجة المقيّدة")}
    value={consent} onValueChange={setConsent}/>
   <Text style={[S.bodyText,{flex:1}]}>{L("I agree that this mosque's specifically authorized case team may handle my request under the stated confidentiality limits. This is not an emergency service.",
    "أوافق على معالجة طلبي من قبل فريق مختص ومصرّح له من المسجد ضمن حدود السرية المذكورة. هذه ليست خدمة طوارئ.")}</Text>
  </View>
  <Action label={L("Submit private request","إرسال طلب خاص")} loading={busy}
   disabled={!consent||message.trim().length<20||message.trim().length>650||busy}
   onPress={()=>void submit()}/></>:null}
  {user&&!user.isVerified?<Text style={S.muted}>{L("Verify your email before submitting.","وثّق بريدك الإلكتروني قبل الإرسال.")}</Text>:null}
 </Card>:null}
 {error?<Text accessibilityRole="alert" style={{color:T.danger}}>{error}</Text>:null}
 {notice?<Text accessibilityRole="text" style={{color:T.success}}>{notice}</Text>:null}
 {user?.isVerified?<View style={S.section}>
  <Text style={S.headline}>{L("Your private references","مراجع طلباتك الخاصة")}</Text>
  <Feedback loading={mine.loading} error={mine.error} empty={!mine.data?.requests.length} refresh={mine.refresh}/>
  {mine.data?.requests.map(r=><Card key={r.reference} style={{gap:6}}>
   <Text style={S.label}>{r.reference}</Text><Text style={S.muted}>{L("Status: ","الحالة: ")}{r.status}</Text>
   <Text style={S.muted}>{new Date(r.createdAt).toLocaleDateString()}</Text>
  </Card>)}
  <Text style={S.muted}>{L("Your detailed message is intentionally not shown in ordinary account activity.",
   "لا تُعرض تفاصيل رسالتك في نشاط الحساب المعتاد حفاظاً على الخصوصية.")}</Text>
 </View>:null}</>:null}
 </Shell>;
}
