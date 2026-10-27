"use client";
import {useCallback,useEffect,useState} from "react";
type User={id:string;firstName:string;lastName:string;email:string};
type Student={id:string;studentNumber:string;firstName:string;lastName:string;guardians:{guardianId:string;approvedAt:string|null;revokedAt:string|null}[]};
type Invoice={id:string;description:string;amountMinor:number;currency:string;status:string;dueAt:string;student:{firstName:string;lastName:string}};
export default function Invoices(){
 const [users,setUsers]=useState<User[]>([]),[students,setStudents]=useState<Student[]>([]),[invoices,setInvoices]=useState<Invoice[]>([]);
 const [studentId,setStudentId]=useState(""),[guardianId,setGuardianId]=useState(""),[description,setDescription]=useState(""),[amount,setAmount]=useState(""),[dueAt,setDueAt]=useState("");
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  try{const [schoolRes,invoicesRes]=await Promise.all([fetch("/api/v1/admin/school"),fetch("/api/v1/admin/invoices")]);
   const [s,i]=await Promise.all([schoolRes.json(),invoicesRes.json()]);
   if(!schoolRes.ok||!invoicesRes.ok)throw new Error(s.error?.message||i.error?.message||"Access denied.");
   setUsers(s.data.users);setStudents(s.data.students);setInvoices(i.data.invoices);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Cannot load invoice data.");}
 },[]);
 useEffect(()=>{void load()},[load]);
 const selected=students.find(s=>s.id===studentId);
 const guardians=users.filter(u=>selected?.guardians.some(l=>l.guardianId===u.id&&!!l.approvedAt&&!l.revokedAt));
 async function issue(){
  if(busy)return;setBusy(true);setError("");setNotice("");
  const cents=Math.round(Number(amount)*100);
  if(!Number.isFinite(cents)||cents<100){setError("Enter an amount of at least $1.");setBusy(false);return;}
  try{
   const r=await fetch("/api/v1/admin/invoices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentId,payerGuardianId:guardianId,description,amountMinor:cents,dueAt:new Date(dueAt).toISOString()})});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Unable to issue invoice.");
   setNotice("Invoice issued. The designated guardian can now view it.");setDescription("");setAmount("");setDueAt("");await load();
  }catch(e){setError(e instanceof Error?e.message:"Unable to issue invoice.");}
  finally{setBusy(false);}
 }
 async function voidInvoice(id:string){
  if(!window.confirm("Void this pending invoice? This action is audited."))return;
  setBusy(true);setError("");
  try{const r=await fetch("/api/v1/admin/invoices",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Unable to void.");setNotice("Invoice voided.");await load();}
  catch(e){setError(e instanceof Error?e.message:"Unable to void invoice.");}finally{setBusy(false);}
 }
 return <><header className="masthead"><span className="brand"><span className="mark">✧</span>School invoices</span><a href="/admin" className="secondary">Control center</a></header>
 <main className="container"><div className="hero"><p className="eyebrow">TUITION · FINANCIAL PRIVACY</p><h1>Clear and accountable tuition.</h1><p>Invoices are issued to a verified, school-approved guardian. Payment completion is provider-confirmed.</p></div>
 {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}
 <div className="split section"><section className="panel"><h2>Issue an invoice</h2><div className="form">
 <div className="field"><label htmlFor="student">Student</label><select id="student" value={studentId} onChange={e=>{setStudentId(e.target.value);setGuardianId("")}}><option value="">Select student</option>{students.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName} · {s.studentNumber}</option>)}</select></div>
 <div className="field"><label htmlFor="guardian">Designated verified guardian</label><select id="guardian" value={guardianId} onChange={e=>setGuardianId(e.target.value)}><option value="">Select approved guardian</option>{guardians.map(u=><option key={u.id} value={u.id}>{u.firstName} {u.lastName} · {u.email}</option>)}</select></div>
 <div className="field"><label htmlFor="details">Description</label><input id="details" value={description} onChange={e=>setDescription(e.target.value)}/></div>
 <div className="field"><label htmlFor="amount">USD amount</label><input id="amount" type="number" min="1" step=".01" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
 <div className="field"><label htmlFor="due">Due date</label><input id="due" type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/></div>
 <button className="primary" disabled={busy||!studentId||!guardianId||!dueAt||!description||!amount} onClick={()=>void issue()}>{busy?"Saving…":"Issue invoice"}</button>
 </div></section><section className="panel"><h2>Recent invoices</h2><div style={{overflowX:"auto"}}><table className="records"><thead><tr><th>Student</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>{invoices.map(x=><tr key={x.id}><td>{x.student.firstName} {x.student.lastName}</td><td>{x.description}</td><td>{(x.amountMinor/100).toLocaleString("en-US",{style:"currency",currency:x.currency.toUpperCase()})}</td><td>{x.status}</td><td>{x.status==="pending"?<button className="secondary" disabled={busy} onClick={()=>void voidInvoice(x.id)}>Void</button>:"—"}</td></tr>)}</tbody></table></div>{!invoices.length&&<p className="small">No invoices issued yet.</p>}</section></div>
 </main></>;
}
