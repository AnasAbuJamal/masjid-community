"use client";
import {useCallback,useEffect,useState} from "react";

type Venue={id:string;name:string;timeZone:string};
type Candidate={
 id:string;venueId:string;localDate:string;revision:number;baseRevision:number;status:string;
 authoredById:string;approvedById:string|null;source:string;correctionReason:string|null;
 fajr:string;sunrise:string;dhuhr:string;asr:string;maghrib:string;isha:string;
 fajrIqamah:string|null;dhuhrIqamah:string|null;asrIqamah:string|null;maghribIqamah:string|null;ishaIqamah:string|null;
};
type Published={id:string;localDate:string;revision:number;published:boolean;source:string;updatedAt:string};
type Data={userId:string;venues:Venue[];selectedVenue:Venue|null;revisions:Candidate[];published:Published[];actorNames:Record<string,string>};
const prayerFields=[
 ["fajr","Fajr adhan"],["sunrise","Sunrise"],["dhuhr","Dhuhr adhan"],["asr","Asr adhan"],
 ["maghrib","Maghrib adhan"],["isha","Isha adhan"],["fajrIqamah","Fajr iqamah"],["dhuhrIqamah","Dhuhr iqamah"],
 ["asrIqamah","Asr iqamah"],["maghribIqamah","Maghrib iqamah"],["ishaIqamah","Isha iqamah"]
] as const;
type TimeKey=typeof prayerFields[number][0];
const emptyTimes:Record<TimeKey,string>={fajr:"",sunrise:"",dhuhr:"",asr:"",maghrib:"",isha:"",
 fajrIqamah:"",dhuhrIqamah:"",asrIqamah:"",maghribIqamah:"",ishaIqamah:""};

export default function PrayerPublishing(){
 const [data,setData]=useState<Data|null>(null);
 const [venueId,setVenueId]=useState("");
 const [date,setDate]=useState("");
 const [times,setTimes]=useState({...emptyTimes});
 const [source,setSource]=useState("");
 const [reason,setReason]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const refresh=useCallback(async(id:string)=>{
  try{
   const r=await fetch("/api/v1/admin/prayer-revisions"+(id?"?venueId="+encodeURIComponent(id):""),{cache:"no-store"});
   const payload=await r.json();
   if(!r.ok)throw new Error(payload.error?.message||"Could not load the schedule review queue.");
   const info=payload.data as Data;
   setData(info);setVenueId(info.selectedVenue?.id||"");
   setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load the review queue.");}
 },[]);
 useEffect(()=>{void refresh("");},[refresh]);
 function setTime(field:TimeKey,value:string){setTimes(current=>({...current,[field]:value}));}
 async function send(action:"create"|"submit"|"approve"|"publish"|"withdraw",id?:string){
  setBusy(true);setError("");setNotice("");
  try{
   const command=action==="create"
    ? {action,venueId,localDate:date,source,correctionReason:reason||undefined,...times}
    : {action,id};
   const r=await fetch("/api/v1/admin/prayer-revisions",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(command)
   });
   const payload=await r.json();
   if(!r.ok)throw new Error(payload.error?.message||"The change could not be completed.");
   setNotice(action==="create"?"Saved privately as a draft. Submit it for a different authorized reviewer."
    :action==="submit"?"Submitted for independent review. The public schedule is unchanged."
    :action==="approve"?"Approved. An authorized publisher must still publish it."
    :action==="publish"?"Verified revision published to the public worship schedule."
    :"Draft withdrawn. The public schedule has not been changed.");
   await refresh(venueId);
  }catch(e){setError(e instanceof Error?e.message:"Unable to save the revision.");}
  finally{setBusy(false);}
 }
 const required=prayerFields.slice(0,6).every(([k])=>!!times[k]);
 return <>
  <header className="masthead"><div className="brand"><span className="mark" aria-hidden="true">✧</span>Prayer schedule review</div>
   <a href="/admin/worship" className="secondary">Worship console</a></header>
  <main className="container">
   <div className="hero">
    <p className="eyebrow">WORSHIP · VERIFIED PUBLICATIONS</p>
    <h1>Prepare. Review. Publish.</h1>
    <p>Draft changes stay private until a different authorized staff member approves them.
    Publishing updates the public schedule as a recorded revision. Never enter estimated times as confirmed.</p>
   </div>
   {error?<p className="error" role="alert">{error}</p>:null}
   {notice?<p className="notice" role="status">{notice}</p>:null}
   <div className="split section">
    <section className="panel">
     <h2>Create private prayer draft</h2>
     <div className="form">
      <div className="field"><label htmlFor="venue">Mosque venue</label>
       <select id="venue" value={venueId} onChange={e=>{setVenueId(e.target.value);void refresh(e.target.value);}}>
        {data?.venues.map(venue=><option key={venue.id} value={venue.id}>{venue.name} · {venue.timeZone}</option>)}
       </select>
      </div>
      <div className="field"><label htmlFor="local-date">Mosque-local date</label>
       <input type="date" id="local-date" value={date} onChange={e=>setDate(e.target.value)}/></div>
      <div className="field"><label htmlFor="source">Confirmed source or calculation policy</label>
       <input id="source" placeholder="Verified mosque schedule / authorized source" value={source} maxLength={120}
        onChange={e=>setSource(e.target.value)}/></div>
      <div className="grid-2">
       {prayerFields.map(([name,label])=><div className="field" key={name}>
        <label htmlFor={name}>{label}</label>
        <input type="time" id={name} value={times[name]} onChange={e=>setTime(name,e.target.value)}/>
       </div>)}
      </div>
      <div className="field"><label htmlFor="reason">Correction reason (required when replacing an existing schedule or correcting a past date)</label>
       <textarea id="reason" maxLength={500} value={reason}
        onChange={e=>setReason(e.target.value)} placeholder="Explain the authoritative correction to the previous published record."/></div>
      <button className="primary" disabled={busy||!venueId||!date||source.trim().length<3||!required}
       onClick={()=>void send("create")}>{busy?"Saving…":"Save private draft"}</button>
      <p className="small">All times are HH:MM on the venue's own calendar date. The schedule remains private until published.</p>
     </div>
    </section>
    <section className="panel">
     <h2>Review and publication queue</h2>
     {!data?<p className="small">Loading authorized records…</p>:null}
     {data&&data.revisions.length===0?<p className="small">No pending or historical prayer revisions for this venue.</p>:null}
     {data?.revisions.map(item=>{
      const mine=item.authoredById===data.userId;
      return <article className="tile section" key={item.id}>
       <h3>{item.localDate} · Revision {item.revision}</h3>
       <p className="small">Status: <strong>{item.status}</strong> · Source: {item.source} · Base revision: {item.baseRevision}</p>
       <p className="small">Prepared by {data.actorNames[item.authoredById]||"authorized editor"}
       {item.approvedById?" · Reviewed by "+(data.actorNames[item.approvedById]||"authorized reviewer"):" · Awaiting independent review"}</p>
       <p className="small">Fajr {item.fajr} · Dhuhr {item.dhuhr} · Asr {item.asr} · Maghrib {item.maghrib} · Isha {item.isha}</p>
       {item.correctionReason?<p className="small">Correction reason: {item.correctionReason}</p>:null}
       {item.status==="draft"&&mine?<button disabled={busy} className="primary" onClick={()=>void send("submit",item.id)}>Submit for independent approval</button>:null}
       {["draft","pending"].includes(item.status)&&mine?<button disabled={busy} className="secondary" onClick={()=>void send("withdraw",item.id)}>Withdraw draft</button>:null}
       {item.status==="pending"&&!mine?<button disabled={busy} className="primary" onClick={()=>void send("approve",item.id)}>Approve schedule as reviewer</button>:null}
       {item.status==="approved"?<button disabled={busy} className="primary" onClick={()=>void send("publish",item.id)}>Publish approved revision</button>:null}
      </article>;
     })}
     <h2 className="section">Current published calendar</h2>
     {!data?.published?.length?<p className="small">No upcoming prayer-day records for this venue.</p>:null}
     {data?.published.map(item=><p className="small" key={item.id}>{item.localDate} · Revision {item.revision} ·
      {item.published?" Published":" Unpublished legacy record"} · {item.source}</p>)}
    </section>
   </div>
  </main>
 </>;
}
