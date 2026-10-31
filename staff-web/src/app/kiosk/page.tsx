import {db} from "@/lib/db";
import {localDate} from "@/lib/http";
import {currentVenueEmergency} from "@/lib/venue-emergencies";
export const dynamic="force-dynamic";
export const metadata={title:"Masjid Community · Prayer Display",description:"Published mosque prayer and community notices."};
const rows=[["Fajr","fajr","fajrIqamah"],["Sunrise","sunrise",null],["Dhuhr","dhuhr","dhuhrIqamah"],["Asr","asr","asrIqamah"],["Maghrib","maghrib","maghribIqamah"],["Isha","isha","ishaIqamah"]] as const;
export default async function Kiosk(){
 const org=await db.organization.findFirst();
 const venue=org?await db.venue.findFirst({where:{organizationId:org.id}}):null;
 const today=venue?localDate(new Date(),venue.timeZone):null;
 const [prayer,announcements,events,emergency]=await Promise.all([
  venue&&today?db.prayerDay.findFirst({where:{venueId:venue.id,localDate:today,published:true}}):null,
  org?db.announcement.findMany({where:{organizationId:org.id,status:"published",publishedAt:{lte:new Date()}},take:4,orderBy:{publishedAt:"desc"},
   select:{id:true,title:true,body:true}}):[],
  org?db.event.findMany({where:{organizationId:org.id,status:"published",startAt:{gt:new Date()}},take:3,orderBy:{startAt:"asc"},
   select:{id:true,title:true,startAt:true}}):[],
  currentVenueEmergency(venue?.id)
 ]);
 return <main className="kiosk-shell"><header className="masthead"><div className="brand"><span className="mark">✧</span>{org?.name||"Masjid Community"}</div><div className="eyebrow">PUBLIC · WORSHIP DISPLAY</div></header>
 <div className="container">
 {emergency?<section className="panel" role="alert" aria-label="Current venue emergency notice"
   style={{border:"3px solid #9b3d28",background:"#fff2ec",color:"#5f2215",marginTop:20}}>
   <strong>VENUE EMERGENCY · {venue?.name}</strong>
   <h2>{emergency.title}</h2><p>{emergency.body}</p>
   <p><strong>What to do:</strong> {emergency.instructions}</p>
   <p>Revision {emergency.revision} · Expires {emergency.expiresAt.toLocaleString("en-US",{timeZone:venue?.timeZone||"UTC"})}</p>
 </section>:null}
 <div className="hero"><p className="eyebrow">{venue?.name||"Community"} · {today||"Schedule not yet configured"}</p>
 <h1>Welcome to the masjid.</h1><p>Published times and notices. For the latest changes, ask the mosque office.</p></div>
 <div className="split"><section className="panel"><h2>Today's prayer times</h2>{prayer?<><div className="records"><div className="kiosk-row"><strong>Prayer</strong><strong>Adhan</strong><strong>Iqamah</strong></div>{rows.map(([name,key,iq])=><div className="kiosk-row" key={key}><strong>{name}</strong><span>{prayer[key]}</span><span>{iq?prayer[iq]||"Not provided":"—"}</span></div>)}</div><p className="small">Source: {prayer.source} · Last updated {prayer.updatedAt.toLocaleString("en-US",{timeZone:venue?.timeZone})}</p></>:<p className="notice">No prayer schedule has been published for today.</p>}</section>
 <section className="panel"><h2>Community updates</h2>{announcements.length?announcements.map(a=><div className="section" key={a.id}><h3>{a.title}</h3><p>{a.body}</p></div>):<p className="small">There are no published announcements.</p>}
 <h2>Upcoming events</h2>{events.length?events.map(e=><p className="section" key={e.id}><strong>{e.title}</strong><br/>{e.startAt.toLocaleString("en-US",{timeZone:venue?.timeZone})}</p>):<p className="small">No upcoming published events.</p>}</section>
 </div><footer className="footer">This display contains only public, published community information.</footer></div></main>;
}
