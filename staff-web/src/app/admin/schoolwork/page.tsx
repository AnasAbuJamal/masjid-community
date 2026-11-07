"use client";
import {useCallback,useEffect,useRef,useState} from "react";
type Enrolled={student:{id:string;firstName:string;lastName:string}};
type ClassItem={id:string;name:string;enrollments:Enrolled[];assignments:{id:string;title:string;dueAt:string;published:boolean;submissions:{studentId:string;body:string;submittedAt:string;student:{firstName:string;lastName:string}}[]}[]};
type ReviewItem={id:string;teacherId:string;summary:string;createdAt:string;selfAuthored:boolean;classSection:{id:string;name:string};student:{firstName:string;lastName:string};teacher:{firstName:string;lastName:string}};
type PublishedItem=Omit<ReviewItem,"createdAt">&{publishedAt:string|null};
type ReviewStatus="draft"|"published";
type ReportPage<T>={status:ReviewStatus;items:T[];complete:boolean;nextCursor:string|null;pageSize:number};
type WithdrawalReason="incorrect-content"|"privacy-concern"|"safeguarding-review";
const withdrawalReasons:{value:WithdrawalReason;label:string}[]=[
 {value:"incorrect-content",label:"Incorrect content"},
 {value:"privacy-concern",label:"Child privacy concern"},
 {value:"safeguarding-review",label:"Safeguarding concern"}
];
async function reportPage<T>(status:ReviewStatus,cursor?:string,signal?:AbortSignal):Promise<ReportPage<T>>{
 const qs=new URLSearchParams({status,...(cursor?{cursor}:{})});
 const r=await fetch("/api/v1/admin/school-reports?"+qs.toString(),{cache:"no-store",signal});
 const value=await r.json();
 if(!r.ok)throw new Error(value.error?.message||"The private report archive could not be loaded.");
 const result=value.data as ReportPage<T>;
 if(result.status!==status||!Array.isArray(result.items))
  throw new Error("Unexpected private report archive response.");
 return result;
}
export default function Schoolwork(){
 const [classes,setClasses]=useState<ClassItem[]>([]),[organization,setOrganization]=useState<{name:string;timeZone:string}|null>(null),[pendingReports,setPendingReports]=useState<ReviewItem[]>([]),[publishedReports,setPublishedReports]=useState<PublishedItem[]>([]),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const [kind,setKind]=useState<"assignment"|"report">("assignment"),[classId,setClassId]=useState(""),[studentId,setStudentId]=useState("");
 const [pendingComplete,setPendingComplete]=useState(true),[publishedComplete,setPublishedComplete]=useState(true);
 const [pendingCursor,setPendingCursor]=useState<string|null>(null),[publishedCursor,setPublishedCursor]=useState<string|null>(null);
 const [pageLoading,setPageLoading]=useState<ReviewStatus|null>(null);
 // Invalidate older private report pages whenever a new authorization read
 // begins. A late page must not repopulate records after a failed refresh.
 const reviewEpoch=useRef(0);
 const reviewController=useRef<AbortController|null>(null);
 const [withdrawalSelection,setWithdrawalSelection]=useState<Record<string,WithdrawalReason|"" >>({});
 const [title,setTitle]=useState(""),[instructions,setInstructions]=useState(""),[dueAt,setDueAt]=useState(""),[published,setPublished]=useState(false);
 const refresh=useCallback(async()=>{
  const epoch=++reviewEpoch.current;
  reviewController.current?.abort();
  const controller=new AbortController();
  reviewController.current=controller;
  // Hide previously authorized child records before any new access check.
  setClasses([]);setOrganization(null);
  setPendingReports([]);setPublishedReports([]);
  setPendingComplete(true);setPublishedComplete(true);
  setPendingCursor(null);setPublishedCursor(null);
  setPageLoading(null);
  try{
   const res=await fetch("/api/v1/schoolwork",{cache:"no-store",signal:controller.signal});
   const j=await res.json();
   if(!res.ok)throw new Error(j.error?.message||"Teacher access required.");
   if(j.data.mode!=="teacher"||!j.data.organization?.timeZone)
    throw new Error("Assigned class and mosque timezone are required.");
   // The main teaching response is limited for backwards compatibility.
   // Staff use the separate MFA-gated history endpoint for every private page.
   const [pending,published]=j.data.canReviewReports?await Promise.all([
    reportPage<ReviewItem>("draft",undefined,controller.signal),reportPage<PublishedItem>("published",undefined,controller.signal)
   ]):[null,null];
   if(epoch!==reviewEpoch.current||controller.signal.aborted)return;
   setClasses(j.data.classes);setOrganization(j.data.organization);
   setPendingReports(pending?.items||[]);setPublishedReports(published?.items||[]);
   setPendingComplete(pending?.complete??true);setPublishedComplete(published?.complete??true);
   setPendingCursor(pending?.nextCursor??null);setPublishedCursor(published?.nextCursor??null);
   setWithdrawalSelection({});setError("");
  }catch(e){
   if(epoch!==reviewEpoch.current||controller.signal.aborted)return;
   setClasses([]);setOrganization(null);
   setPendingReports([]);setPublishedReports([]);
   setPendingComplete(true);setPublishedComplete(true);
   setPendingCursor(null);setPublishedCursor(null);
   setError(e instanceof Error?e.message:"Unable to load assigned classes.");
  }
 },[]);
 useEffect(()=>{
  void refresh();
  return ()=>{reviewEpoch.current++;reviewController.current?.abort();reviewController.current=null};
 },[refresh]);
 const chosen=classes.find(c=>c.id===classId);
 async function loadMore(status:ReviewStatus){
  if(busy||pageLoading)return;
  const cursor=status==="draft"?pendingCursor:publishedCursor;
  if(!cursor)return;
  const epoch=reviewEpoch.current;
  const controller=reviewController.current;
  if(!controller||controller.signal.aborted)return;
  setPageLoading(status);setError("");
  try{
   if(status==="draft"){
    const page=await reportPage<ReviewItem>("draft",cursor,controller.signal);
    if(epoch!==reviewEpoch.current||controller.signal.aborted)return;
    setPendingReports(current=>[...current,...page.items.filter(x=>!current.some(y=>y.id===x.id))]);
    setPendingComplete(page.complete);setPendingCursor(page.nextCursor);
   }else{
    const page=await reportPage<PublishedItem>("published",cursor,controller.signal);
    if(epoch!==reviewEpoch.current||controller.signal.aborted)return;
    setPublishedReports(current=>[...current,...page.items.filter(x=>!current.some(y=>y.id===x.id))]);
    setPublishedComplete(page.complete);setPublishedCursor(page.nextCursor);
   }
  }catch(e){
   if(epoch===reviewEpoch.current&&!controller.signal.aborted)
    setError(e instanceof Error?e.message:"Unable to read older private reports. Refresh and retry.");
  }finally{if(epoch===reviewEpoch.current&&!controller.signal.aborted)setPageLoading(null);}
 }
 async function reviewReport(item:ReviewItem,action:"publish-report"|"reject-report"){
  if(busy||item.selfAuthored)return;
  const phrase=action==="publish-report"?"publish the student's private progress report":"reject this draft and keep it private";
  if(!window.confirm("Are you authorized to "+phrase+"? Confirm you independently reviewed the child's record."))return;
  setBusy(true);setError("");setNotice("");
  try{
   const res=await fetch("/api/v1/schoolwork",{method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,reportId:item.id,reason:action==="publish-report"?"verified-content":"needs-correction"})});
   const j=await res.json();
   if(!res.ok)throw new Error(j.error?.message||"Report review failed.");
   setNotice(action==="publish-report"?"Approved progress report published.":"Draft rejected and kept private.");
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to review the report.");}
  finally{setBusy(false);}
 }
 async function retractReport(item:PublishedItem){
  if(busy||item.selfAuthored)return;
  const reason=withdrawalSelection[item.id];
  if(!reason)return;
  if(!window.confirm("Withdraw this published student report now? It will disappear from family views. Generic private notices will be queued. This action cannot be undone."))return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/v1/schoolwork",{method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"retract-report",reportId:item.id,reason})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error?.message||"Unable to withdraw this report.");
   setNotice("Report withdrawn and audited. Generic private notices queued: "+result.data.notificationsQueued);
   await refresh();
  }catch(error){setError(error instanceof Error?error.message:"Unable to withdraw this report.");}
  finally{setBusy(false);}
 }
 function displayDue(value:string){
  if(!organization?.timeZone)return "Time unavailable";
  try{return new Intl.DateTimeFormat("en-US",{
   timeZone:organization.timeZone,
   year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",
   timeZoneName:"short"
  }).format(new Date(value));}
  catch{return "Time unavailable";}
 }
 async function save(){
  if(busy)return;setBusy(true);setError("");setNotice("");
  try{
   if(kind==="assignment"&&!organization?.timeZone)throw new Error("Refresh the mosque timezone before publishing.");
   const payload=kind==="assignment"?{kind:"assignment-local",classId,title,instructions,dueLocal:dueAt,published}
    :{kind,classId,studentId,summary:instructions,published:false};
   const r=await fetch("/api/v1/schoolwork",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Unable to save.");
   setNotice(kind==="report"?"Student report saved privately as a draft for independent review.":
    "School assignment saved "+(published?"and published.":"as a draft."));setTitle("");setInstructions("");setStudentId("");setPublished(false);await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save.");}
  finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand"><span className="mark">✧</span>Teaching workspace</span><a href="/admin" className="secondary">Control center</a></header>
 <main className="container"><div className="hero"><p className="eyebrow">EDUCATION · CLASSROOM</p><h1>Guide every learner.</h1><p>Publish class assignments and progress reports only for students you are permitted to teach.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}{notice?<p className="notice" role="status">{notice}</p>:null}
 <div className="split section"><section className="panel"><div className="tabs"><button className={kind==="assignment"?"primary":"secondary"} onClick={()=>setKind("assignment")}>Class assignment</button><button className={kind==="report"?"primary":"secondary"} onClick={()=>setKind("report")}>Student report</button></div>
 <div className="form"><div className="field"><label htmlFor="class">Assigned class</label><select id="class" value={classId} onChange={e=>{setClassId(e.target.value);setStudentId("")}}><option value="">Select class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
 {kind==="assignment"?<><div className="field"><label htmlFor="title">Assignment title</label><input id="title" value={title} onChange={e=>setTitle(e.target.value)}/></div>
 <div className="field"><label htmlFor="due">Due date and time (mosque-local)</label><input id="due" type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/></div>
 <p className="small" role="note">{organization?
  "Use "+organization.name+" time ("+organization.timeZone+"), not your device timezone. Skipped or repeated daylight-saving times cannot be used.":
  "Mosque timezone unavailable. Creating deadlines is disabled."}</p></>:
 <div className="field"><label htmlFor="student">Enrolled student</label><select id="student" value={studentId} onChange={e=>setStudentId(e.target.value)}><option value="">Select student</option>{chosen?.enrollments.map(e=><option key={e.student.id} value={e.student.id}>{e.student.firstName} {e.student.lastName}</option>)}</select></div>}
 <div className="field"><label htmlFor="details">{kind==="assignment"?"Instructions":"Student progress report"}</label><textarea id="details" value={instructions} onChange={e=>setInstructions(e.target.value)}/></div>
 {kind==="assignment"?<label className="field"><span>Publish assignment for students and guardians</span><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/></label>:
 <p className="notice" role="note">Student reports are private drafts until a different, authorized administrator reviews them. Authors cannot publish their own reports.</p>}
 <button className="primary" disabled={busy||!classId||instructions.trim().length<10||(kind==="assignment"?(!title||!dueAt||!organization?.timeZone):!studentId)} onClick={()=>void save()}>{busy?"Saving…":"Save "+kind}</button></div></section>
 <section className="panel"><h2>Assigned teaching</h2>{classes.length?classes.map(c=><div className="section" key={c.id}><h3>{c.name}</h3><p className="small">{c.enrollments.length} enrolled students · {c.assignments.length} assignments</p>
 {c.assignments.map(a=><div key={a.id} className="tile section"><strong style={{fontSize:16}}>{a.title}</strong><p className="small">Due {displayDue(a.dueAt)} · {a.published?"Published":"Draft"} · {a.submissions.length} submissions</p>
 {a.submissions.map((s,i)=><p className="small" key={i}>{s.student.firstName} {s.student.lastName}: {s.body}</p>)}</div>)}</div>):<p className="small">No classes assigned. Ask the school administrator to assign you to a class.</p>}</section></div>
 {(pendingReports.length||!pendingComplete)?<section className="panel section">
  <h2>Private student progress report review</h2>
  <p className="small">Authorized administrator only. Verify the current enrollment, author, and content. Never export or share unapproved child records.</p>
  {pendingReports.map(item=><div key={item.id} className="tile section">
   <p className="small">{item.classSection.name} · {item.student.firstName} {item.student.lastName} · authored by {item.teacher.firstName} {item.teacher.lastName}</p>
   <p>{item.summary}</p>
   {item.selfAuthored?<p className="small">You wrote this report; a different authorized reviewer is required.</p>:
    <div className="actions">
     <button className="primary" disabled={busy} onClick={()=>void reviewReport(item,"publish-report")}>Publish verified report</button>
     <button className="secondary" disabled={busy} onClick={()=>void reviewReport(item,"reject-report")}>Reject for correction</button>
    </div>}
  </div>)}
  {!pendingComplete?<button className="secondary" disabled={busy||pageLoading!==null||!pendingCursor}
    onClick={()=>void loadMore("draft")}>
    {pageLoading==="draft"?"Loading older draft reports…":"Load 50 more private draft reports"}
  </button>:<p className="small" role="status">All currently available draft reports loaded.</p>}
 </section>:null}
 {(publishedReports.length||!publishedComplete)?<section className="panel section">
  <h2>Published progress reports · withdrawal review</h2>
  <p className="small">Private administrator list. Approved reports that are incorrect or unsafe can be withdrawn without deleting their history.</p>
  {publishedReports.map(item=><div key={item.id} className="tile section">
   <p className="small">{item.classSection.name} · {item.student.firstName} {item.student.lastName} · published {item.publishedAt?new Date(item.publishedAt).toLocaleDateString():"Publication date unavailable"}</p>
   <p>{item.summary}</p>
   {item.selfAuthored?<p className="small">Another administrator must review withdrawal of your own report.</p>:
    <div className="form">
     <div className="field">
      <label htmlFor={"withdraw-reason-"+item.id}>Reason for withdrawing this report</label>
      <select id={"withdraw-reason-"+item.id}
       value={withdrawalSelection[item.id]||""}
       onChange={e=>setWithdrawalSelection(old=>({...old,
        [item.id]:e.target.value as WithdrawalReason|""}))}>
       <option value="">Select a review reason</option>
       {withdrawalReasons.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
     </div>
     <button className="secondary" disabled={busy||!withdrawalSelection[item.id]}
      onClick={()=>void retractReport(item)}>Withdraw published report</button>
    </div>}
  </div>)}
  {!publishedComplete?<button className="secondary" disabled={busy||pageLoading!==null||!publishedCursor}
   onClick={()=>void loadMore("published")}>
   {pageLoading==="published"?"Loading older published reports…":"Load 50 more published reports"}
  </button>:<p className="small" role="status">All currently available published reports loaded.</p>}
 </section>:null}
 </main></>;
}
