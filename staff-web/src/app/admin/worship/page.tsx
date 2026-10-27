"use client";
import {useCallback,useEffect,useState} from "react";
type Session={id:string;localDate:string;ordinal:number;khutbahAt:string|null;iqamahAt:string;language:string|null};
type Venue={id:string;name:string;timeZone:string;jummahSessions:Session[]};
type Notice={id:string;kind:string;localDate:string;title:string;body:string;status:string;revision:number};
type Data={venues:Venue[];notices:Notice[]};
type Kind="ramadan_start"|"eid_al_fitr"|"eid_al_adha"|"moon_sighting"|"other";
const noticeKinds:[Kind,string][]=[["ramadan_start","Ramadan begins"],["eid_al_fitr","Eid al-Fitr"],["eid_al_adha","Eid al-Adha"],["moon_sighting","Moon sighting"],["other","Mosque notice"]];
export default function WorshipEditor(){
 const [data,setData]=useState<Data|null>(null),[mode,setMode]=useState<"jummah"|"faith">("jummah"),[busy,setBusy]=useState(false);
 const [venueId,setVenueId]=useState(""),[date,setDate]=useState(""),[ordinal,setOrdinal]=useState("1"),[khutbah,setKhutbah]=useState(""),[iqamah,setIqamah]=useState(""),[language,setLanguage]=useState("en");
 const [faithKind,setFaithKind]=useState<Kind>("ramadan_start"),[title,setTitle]=useState(""),[body,setBody]=useState(""),[published,setPublished]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const refresh=useCallback(async()=>{
  try{const r=await fetch("/api/v1/admin/worship",{cache:"no-store"});const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"Administrative access required.");
   setData(j.data);setVenueId(old=>old||j.data.venues[0]?.id||"");setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load worship editor.");}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 async function send(payload:Record<string,unknown>,method:"POST"|"DELETE"="POST"){
  setBusy(true);setError("");setNotice("");
  try{const res=await fetch("/api/v1/admin/worship",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const j=await res.json();if(!res.ok)throw new Error(j.error?.message||"Unable to save.");
   setNotice(method==="DELETE"?"The published item has been removed.":"The worship announcement has been saved.");await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save.");}finally{setBusy(false);}
 }
 async function save(){
  if(mode==="jummah"){
   await send({kind:"jummah",venueId,localDate:date,ordinal:Number(ordinal),khutbahAt:khutbah||undefined,iqamahAt:iqamah,language});return;
  }
  await send({kind:"faith",faithKind,localDate:date,title,body,published});
 }
 function remove(kind:"faith"|"jummah",id:string,title:string){
  if(window.confirm("Remove "+title+" from public display? This action is audited."))
   void send({kind,id},"DELETE");
 }
 return <><header className="masthead"><div className="brand"><span className="mark">✧</span>Worship publishing</div><a href="/admin" className="secondary">Control center</a></header>
 <main className="container"><div className="section"><a className="primary" href="/admin/prayer-revisions">Manage prayer times · independent approval</a></div><div className="hero"><p className="eyebrow">WORSHIP · MOSQUE CONFIRMED</p><h1>Clarity for every gathering.</h1>
 <p>Publish verified Jummah sessions and manually confirmed Ramadan/Eid dates. No automatic lunar-date guesses are presented as announcements.</p></div>
 {error?<p className="error" role="alert">{error}</p>:null}{notice?<p className="notice" role="status">{notice}</p>:null}
 <div className="split section"><section className="panel"><div className="tabs"><button className={mode==="jummah"?"primary":"secondary"} onClick={()=>setMode("jummah")}>Jummah sessions</button>
 <button className={mode==="faith"?"primary":"secondary"} onClick={()=>setMode("faith")}>Ramadan / Eid announcements</button></div>
 <div className="form">
 {mode==="jummah"?<><div className="field"><label htmlFor="venue">Venue</label><select id="venue" value={venueId} onChange={e=>setVenueId(e.target.value)}>
 {data?.venues.map(v=><option key={v.id} value={v.id}>{v.name} · {v.timeZone}</option>)}</select></div>
 <div className="field"><label htmlFor="ordinal">Session number</label><select id="ordinal" value={ordinal} onChange={e=>setOrdinal(e.target.value)}>
 {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
 <div className="field"><label htmlFor="khutbah">Khutbah begins (optional)</label><input id="khutbah" type="time" value={khutbah} onChange={e=>setKhutbah(e.target.value)}/></div>
 <div className="field"><label htmlFor="iqamah">Jummah iqamah</label><input id="iqamah" required type="time" value={iqamah} onChange={e=>setIqamah(e.target.value)}/></div>
 <div className="field"><label htmlFor="language">Khutbah language</label><input id="language" value={language} onChange={e=>setLanguage(e.target.value)}/></div>
 </>:<><div className="field"><label htmlFor="kind">Mosque-confirmed occasion</label><select id="kind" value={faithKind} onChange={e=>setFaithKind(e.target.value as Kind)}>
 {noticeKinds.map(([kind,name])=><option value={kind} key={kind}>{name}</option>)}</select></div>
 <div className="field"><label htmlFor="title">Announcement title</label><input id="title" value={title} onChange={e=>setTitle(e.target.value)}/></div>
 <div className="field"><label htmlFor="body">Confirmation and details</label><textarea id="body" value={body} onChange={e=>setBody(e.target.value)}/></div>
 <label><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/> This date has been officially confirmed by the mosque; publish it</label></>}
 <div className="field"><label htmlFor="date">Local date {mode==="jummah"?"(must be a Friday)":""}</label><input id="date" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
 <button className="primary" disabled={busy||!date||(mode==="jummah"?(!venueId||!iqamah):(!title||body.length<10))}
 onClick={()=>void save()}>{busy?"Saving…":mode==="jummah"?"Publish Jummah session":"Save mosque announcement"}</button>
 </div></section>
 <section className="panel"><h2>Upcoming Jummah sessions</h2>
 {data?.venues.map(v=><div key={v.id} className="section"><h3>{v.name}</h3>
 {v.jummahSessions.length?v.jummahSessions.map(s=><div key={s.id} className="tile section"><strong style={{fontSize:16}}>{s.localDate} · Session {s.ordinal}</strong>
 <p className="small">Iqamah {s.iqamahAt} · Khutbah {s.khutbahAt||"Not specified"} · {s.language||"No language specified"}</p>
 <button className="secondary" disabled={busy} onClick={()=>remove("jummah",s.id,"Jummah session "+s.ordinal+" on "+s.localDate)}>Remove session</button></div>):<p className="small">No scheduled Jummah sessions.</p>}</div>)}
 <h2 className="section">Moon-sighting and Eid notices</h2>
 {data?.notices.map(n=><div className="tile section" key={n.id}><strong style={{fontSize:16}}>{n.title}</strong>
 <p className="small">{n.kind} · {n.localDate} · {n.status} · revision {n.revision}</p><p>{n.body}</p>
 {n.status!=="archived"?<button className="secondary" disabled={busy} onClick={()=>remove("faith",n.id,n.title)}>Archive announcement</button>:null}</div>)}
 </section></div></main></>;
}
