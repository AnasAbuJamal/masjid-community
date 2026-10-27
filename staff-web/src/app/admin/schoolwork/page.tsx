"use client";
import {useCallback,useEffect,useState} from "react";
type Enrolled={student:{id:string;firstName:string;lastName:string}};
type ClassItem={id:string;name:string;enrollments:Enrolled[];assignments:{id:string;title:string;dueAt:string;published:boolean;submissions:{studentId:string;body:string;submittedAt:string;student:{firstName:string;lastName:string}}[]}[]};
export default function Schoolwork(){
 const [classes,setClasses]=useState<ClassItem[]>([]),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const [kind,setKind]=useState<"assignment"|"report">("assignment"),[classId,setClassId]=useState(""),[studentId,setStudentId]=useState("");
 const [title,setTitle]=useState(""),[instructions,setInstructions]=useState(""),[dueAt,setDueAt]=useState(""),[published,setPublished]=useState(false);
 const refresh=useCallback(async()=>{
  try{const res=await fetch("/api/v1/schoolwork",{cache:"no-store"});const j=await res.json();if(!res.ok)throw new Error(j.error?.message||"Teacher access required.");if(j.data.mode!=="teacher")throw new Error("You are not assigned as a teacher.");setClasses(j.data.classes);setError("");}
  catch(e){setError(e instanceof Error?e.message:"Unable to load assigned classes.");}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 const chosen=classes.find(c=>c.id===classId);
 async function save(){
  if(busy)return;setBusy(true);setError("");setNotice("");
  try{
   const payload=kind==="assignment"?{kind,classId,title,instructions,dueAt:new Date(dueAt).toISOString(),published}
    :{kind,classId,studentId,summary:instructions,published};
   const r=await fetch("/api/v1/schoolwork",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Unable to save.");
   setNotice("School "+kind+" saved "+(published?"and published.":"as a draft."));setTitle("");setInstructions("");setStudentId("");setPublished(false);await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save.");}
  finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand"><span className="mark">✧</span>Teaching workspace</span><a href="/admin" className="secondary">Control center</a></header>
 <main className="container"><div className="hero"><p className="eyebrow">EDUCATION · CLASSROOM</p><h1>Guide every learner.</h1><p>Publish class assignments and progress reports only for students you are permitted to teach.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}{notice?<p className="notice" role="status">{notice}</p>:null}
 <div className="split section"><section className="panel"><div className="tabs"><button className={kind==="assignment"?"primary":"secondary"} onClick={()=>setKind("assignment")}>Class assignment</button><button className={kind==="report"?"primary":"secondary"} onClick={()=>setKind("report")}>Student report</button></div>
 <div className="form"><div className="field"><label htmlFor="class">Assigned class</label><select id="class" value={classId} onChange={e=>{setClassId(e.target.value);setStudentId("")}}><option value="">Select class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
 {kind==="assignment"?<><div className="field"><label htmlFor="title">Assignment title</label><input id="title" value={title} onChange={e=>setTitle(e.target.value)}/></div>
 <div className="field"><label htmlFor="due">Due date and time</label><input id="due" type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/></div></>:
 <div className="field"><label htmlFor="student">Enrolled student</label><select id="student" value={studentId} onChange={e=>setStudentId(e.target.value)}><option value="">Select student</option>{chosen?.enrollments.map(e=><option key={e.student.id} value={e.student.id}>{e.student.firstName} {e.student.lastName}</option>)}</select></div>}
 <div className="field"><label htmlFor="details">{kind==="assignment"?"Instructions":"Student progress report"}</label><textarea id="details" value={instructions} onChange={e=>setInstructions(e.target.value)}/></div>
 <label className="field"><span>Publish for students and approved guardians</span><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/></label>
 <button className="primary" disabled={busy||!classId||instructions.trim().length<10||(kind==="assignment"?(!title||!dueAt):!studentId)} onClick={()=>void save()}>{busy?"Saving…":"Save "+kind}</button></div></section>
 <section className="panel"><h2>Assigned teaching</h2>{classes.length?classes.map(c=><div className="section" key={c.id}><h3>{c.name}</h3><p className="small">{c.enrollments.length} enrolled students · {c.assignments.length} assignments</p>
 {c.assignments.map(a=><div key={a.id} className="tile section"><strong style={{fontSize:16}}>{a.title}</strong><p className="small">Due {new Date(a.dueAt).toLocaleString()} · {a.published?"Published":"Draft"} · {a.submissions.length} submissions</p>
 {a.submissions.map((s,i)=><p className="small" key={i}>{s.student.firstName} {s.student.lastName}: {s.body}</p>)}</div>)}</div>):<p className="small">No classes assigned. Ask the school administrator to assign you to a class.</p>}</section></div>
 </main></>;
}
