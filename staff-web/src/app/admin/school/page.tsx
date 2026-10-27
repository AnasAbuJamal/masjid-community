"use client";
import {useCallback,useEffect,useState} from "react";
type User={id:string;firstName:string;lastName:string;role:string;email:string;verifiedAt:string|null};
type Student={id:string;studentNumber:string;firstName:string;lastName:string;enrollments:{classSection:{name:string}}[]};
type Program={id:string;title:string;classes:{id:string;name:string;schedule:string;enrollments:{id:string}[]}[]};
type Data={users:User[];students:Student[];programs:Program[];sessions:{id:string;startsAt:string;classSection:{name:string}}[]};
type Kind="class"|"student"|"guardian-link"|"teacher-assignment"|"enrollment"|"class-session";
const types:Kind[]=["class","student","guardian-link","teacher-assignment","enrollment","class-session"];
const titles:Record<Kind,string>={class:"Create class",student:"Register student","guardian-link":"Approve guardian link","teacher-assignment":"Assign teacher",enrollment:"Enroll student","class-session":"Schedule class session"};
export default function SchoolAdmin(){
 const [data,setData]=useState<Data|null>(null),[kind,setKind]=useState<Kind>("class"),[form,setForm]=useState<Record<string,string>>({}),[notice,setNotice]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{
  try{const res=await fetch("/api/v1/admin/school",{cache:"no-store"});const json=await res.json();if(!res.ok)throw new Error(json.error?.message||"Access denied.");setData(json.data);setError("");}
  catch(e){setError(e instanceof Error?e.message:"Unable to load school data.");}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 const field=(key:string,label:string,options?:{id:string;title:string}[],type="text")=><div key={key} className="field"><label htmlFor={key}>{label}</label>{options?<select id={key} value={form[key]||""} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}><option value="">Select…</option>{options.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select>:<input id={key} type={type} value={form[key]||""} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/>}</div>;
 const classes=data?.programs.flatMap(p=>p.classes.map(c=>({id:c.id,title:p.title+" / "+c.name})))||[];
 const users=data?.users.map(u=>({id:u.id,title:u.firstName+" "+u.lastName+" · "+u.role}))||[];
 const students=data?.students.map(s=>({id:s.id,title:s.firstName+" "+s.lastName+" ("+s.studentNumber+")"}))||[];
 async function submit(){
  if(!data||busy)return;
  setBusy(true);setError("");setNotice("");
  const payload:Record<string,unknown>={kind,...form};
  if(payload.capacity)payload.capacity=Number(payload.capacity);
  if(payload.startsAt)payload.startsAt=new Date(String(payload.startsAt)).toISOString();
  try{
   const res=await fetch("/api/v1/admin/school",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const json=await res.json();if(!res.ok)throw new Error(json.error?.message||"Unable to save.");
   setNotice(titles[kind]+" completed.");setForm({});await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Save failed.");}
  finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand"><span className="mark">✧</span>School operations</span><div className="actions"><a className="secondary" href="/admin/enrollment">Review applications</a><a className="secondary" href="/admin/schoolwork">Teaching workspace</a><a className="secondary" href="/admin/invoices">School invoices</a><a className="secondary" href="/admin">Control center</a></div></header>
 <main className="container"><div className="hero"><p className="eyebrow">EDUCATION · PROTECTED RECORDS</p><h1>Every learner matters.</h1><p>Verified relationships, assigned teachers, and explicit class enrollment.</p></div>
 {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}
 <div className="split section"><section className="panel"><h2>School operations</h2>
 <div className="tabs">{types.map(t=><button key={t} className={t===kind?"primary":"secondary"} onClick={()=>{setKind(t);setForm({})}}>{titles[t]}</button>)}</div>
 <div className="form">
 {kind==="class"?<>{field("programId","Program",data?.programs.map(x=>({id:x.id,title:x.title})))}{field("name","Class name")}{field("schedule","Schedule")}{field("capacity","Class capacity",undefined,"number")}</>:null}
 {kind==="student"?<>{field("studentNumber","School student number")}{field("firstName","First name")}{field("lastName","Last name")}</>:null}
 {kind==="guardian-link"?<><p className="notice">School administrators must verify the guardian's legal relationship before approving this link.</p>{field("studentId","Student",students)}{field("guardianId","Verified guardian account",users.filter(x=>data?.users.find(u=>u.id===x.id)?.verifiedAt))}</>:null}
 {kind==="teacher-assignment"?<>{field("classId","Class",classes)}{field("teacherId","Verified teacher",users.filter(x=>data?.users.find(u=>u.id===x.id)?.role==="teacher"))}</>:null}
 {kind==="enrollment"?<>{field("classId","Class",classes)}{field("studentId","Student",students)}</>:null}
 {kind==="class-session"?<>{field("classId","Class",classes)}{field("startsAt","Session start",undefined,"datetime-local")}</>:null}
 <button className="primary" disabled={!data||busy} onClick={()=>void submit()}>{busy?"Saving…":titles[kind]}</button>
 </div></section><section className="panel"><h2>School overview</h2>
 <p className="small">Use the main admin screen to publish a school program before creating classes.</p>
 <h3>Programs</h3>{data?.programs.length?data.programs.map(p=><div className="section" key={p.id}><strong>{p.title}</strong>{p.classes.map(c=><p className="small" key={c.id}>{c.name} · {c.schedule} · {c.enrollments.length} enrollments</p>)}</div>):<p className="small">No programs yet.</p>}
 <h3>Students</h3>{data?.students.length?data.students.map(s=><p className="small" key={s.id}>{s.firstName} {s.lastName} · {s.studentNumber}</p>):<p className="small">No students yet.</p>}
 <h3>Class sessions</h3>{data?.sessions.slice(0,8).map(s=><p className="small" key={s.id}>{s.classSection.name} · {new Date(s.startsAt).toLocaleString()}</p>)}
 </section></div><footer className="footer">Never link a parent to a child using email alone. Confirm identity and school records before changes.</footer></main></>;
}
