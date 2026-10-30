import type { Metadata } from "next";
import { db } from "@/lib/db";
import { localDate } from "@/lib/http";
import {GATHERING_CATEGORIES,GATHERING_AUDIENCES,GATHERING_ACCESSIBILITY,
 publicGatheringItems} from "@/lib/gathering-filters";
import "./visit.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Visit the mosque | SILA",
  description: "Published prayer times, Friday prayer, official notices, and gatherings from your mosque.",
};

type VisitFilters={venue?:string|string[];gatherVenue?:string|string[];
 category?:string|string[];audience?:string|string[];
 accessibility?:string|string[];gatherQ?:string|string[]};
type PageProps = { searchParams: Promise<VisitFilters> };
const prayerRows = [
  ["Fajr", "fajr", "fajrIqamah"],
  ["Sunrise", "sunrise", null],
  ["Dhuhr", "dhuhr", "dhuhrIqamah"],
  ["Asr", "asr", "asrIqamah"],
  ["Maghrib", "maghrib", "maghribIqamah"],
  ["Isha", "isha", "ishaIqamah"],
] as const;

function dateLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full", timeZone,
  }).format(date);
}
function eventTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone, timeZoneName: "short",
  }).format(date);
}
function localClockLabel(date: string) {
  const parsed = new Date(date + "T12:00:00Z");
  return Number.isFinite(parsed.valueOf())
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(parsed)
    : date;
}

export default async function VisitPage({ searchParams }: PageProps) {
  const search=await searchParams;
  const {venue:requested}=search;
  const selectedId=typeof requested==="string"?requested:"";
  // All form values are treated as UNTRUSTED filters, never an organization
  // selector. Unknown/duplicate values fail closed rather than broadening.
  const value=(key:keyof VisitFilters)=>{
   const raw=search[key];
   return raw===undefined?"":typeof raw==="string"?raw.trim():"__invalid__";
  };
  const gatherQuery=value("gatherQ");
  const category=value("category");
  const audience=value("audience");
  const accessibility=value("accessibility");
  const gatherVenue=value("gatherVenue");
  const organization = await db.organization.findFirst({ orderBy: { createdAt: "asc" } });
  const venues = organization
    ? await db.venue.findMany({
        where: { organizationId: organization.id },
        orderBy: { id: "asc" },
        take: 50,
        select: { id: true, name: true, address: true, timeZone: true },
      })
    : [];
  // Never accept a venue from another mosque or display an old venue's data.
  const venue = venues.find((item) => item.id === selectedId) ?? venues[0] ?? null;
  const filterInvalid=
    (gatherQuery.length===1||gatherQuery.length>80||gatherQuery==="__invalid__")||
    (!!category&&!GATHERING_CATEGORIES.includes(category as typeof GATHERING_CATEGORIES[number]))||
    (!!audience&&!GATHERING_AUDIENCES.includes(audience as typeof GATHERING_AUDIENCES[number]))||
    (!!accessibility&&!GATHERING_ACCESSIBILITY.includes(accessibility as typeof GATHERING_ACCESSIBILITY[number]))||
    (!!gatherVenue&&!venues.some(v=>v.id===gatherVenue));
  const now = new Date();
  const today = venue ? localDate(now, venue.timeZone) : null;
  const [prayer, jummah, announcements, events, faithNotices, programs] = await Promise.all([
    venue && today
      ? db.prayerDay.findFirst({
          where: { venueId: venue.id, localDate: today, published: true },
        })
      : null,
    venue && today
      ? db.jummahSession.findMany({
          where: { venueId: venue.id, localDate: today },
          orderBy: { ordinal: "asc" },
          take: 5,
        })
      : [],
    organization
      ? db.announcement.findMany({
          where: { organizationId: organization.id, status: "published", publishedAt: { lte: now } },
          orderBy: { publishedAt: "desc" },
          take: 4,
          select: { id: true, title: true, body: true, kind: true },
        })
      : [],
    organization&&!filterInvalid
      ? db.event.findMany({
          where: {organizationId:organization.id,status:"published",startAt:{gte:now},
            ...(gatherQuery?{OR:[
              {title:{contains:gatherQuery,mode:"insensitive" as const}},
              {description:{contains:gatherQuery,mode:"insensitive" as const}},
              {location:{contains:gatherQuery,mode:"insensitive" as const}}
            ]}:{}),
            ...(category?{category}:{}),...(audience?{audience}:{}),
            ...(accessibility?{accessibilityFeatures:{has:accessibility}}:{}),
            ...(gatherVenue?{venueId:gatherVenue}:{})
          },
          orderBy:[{startAt:"asc"},{id:"asc"}],take:20,
          select:{id:true,title:true,description:true,location:true,startAt:true,
            category:true,audience:true,accessibilityFeatures:true,
            venue:{select:{id:true,name:true,timeZone:true,organizationId:true}}}
        })
      : [],
    organization && today
      ? db.faithNotice.findMany({
          where: {
            organizationId: organization.id, status: "published",
            approvedById: { not: null }, publishedAt: { lte: now },
            localDate: { gte: today },
          },
          orderBy: { localDate: "asc" },
          take: 3,
          select: { id: true, title: true, body: true, localDate: true },
        })
      : [],
    organization
      ? db.schoolProgram.findMany({
          where: { organizationId: organization.id, published: true },
          take: 4,
          select: { id: true, title: true, description: true },
        })
      : [],
  ]);
  const timeZone = venue?.timeZone ?? organization?.timeZone ?? "UTC";
  const safeEvents=publicGatheringItems(events,organization?.id||"");

  return (
    <main className="visit">
      <header className="visit-header">
        <a href="/visit" className="visit-brand" aria-label="SILA home">
          <span aria-hidden="true" className="visit-symbol">✧</span>
          <span>SILA <span lang="ar" dir="rtl">صِلَة</span><small>COMMUNITY &amp; CONNECTION</small></span>
        </a>
        <nav aria-label="Public navigation">
          <a href="#prayers">Prayers</a>
          <a href="#updates">Updates</a>
          <a href="#gatherings">Gatherings</a>
          <a className="visit-staff-link" href="/">Staff sign in</a>
        </nav>
      </header>

      <div className="visit-container">
        <section className="visit-hero" aria-labelledby="visit-heading">
          <div>
            <span className="visit-kicker">A PLACE TO BELONG</span>
            <h1 id="visit-heading">Peace begins<br />with <em>connection.</em></h1>
            <p>Discover public worship times, announcements, and community gatherings. Everyone is welcome to view this information without signing in.</p>
            <div className="visit-hero-actions">
              <a className="visit-action" href="#prayers">View prayer times <span aria-hidden="true">↗</span></a>
              <a className="visit-action-outline" href="#gatherings">Explore gatherings</a>
            </div>
          </div>
          <div className="visit-place" aria-label="Selected mosque and venue">
            <span className="visit-place-icon" aria-hidden="true">◈</span>
            <span className="visit-kicker">YOUR COMMUNITY</span>
            <h2>{organization?.name ?? "Community not yet configured"}</h2>
            <p>{venue?.name ?? "No prayer venue has been added"}</p>
            {venue?.address || organization?.address ? <address>{venue?.address ?? organization?.address}</address> : null}
            {venues.length > 1 ? (
              <form method="get" action="/visit" className="visit-venue-form">
                <label htmlFor="visit-venue">Choose a venue</label>
                <select id="visit-venue" name="venue" defaultValue={venue?.id}>
                  {venues.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <button type="submit">Show venue</button>
              </form>
            ) : null}
            <span className="visit-place-note">All times shown in {timeZone}.</span>
          </div>
        </section>

        <section className="visit-schedule" id="prayers" aria-labelledby="prayer-heading">
          <div className="visit-section-heading">
            <div><span className="visit-kicker">TODAY · WORSHIP</span><h2 id="prayer-heading">Prayer times</h2></div>
            <p>{venue ? dateLabel(now, timeZone) : "Venue not configured"}</p>
          </div>
          {prayer ? (
            <>
              <div className="visit-prayer-grid" role="table" aria-label="Published prayer times">
                <div className="visit-prayer-row visit-prayer-head" role="row"><span role="columnheader">Prayer</span><span role="columnheader">Adhan</span><span role="columnheader">Iqamah</span></div>
                {prayerRows.map(([name, adhan, iqamah]) => (
                  <div className="visit-prayer-row" role="row" key={name}>
                    <strong role="cell">{name}</strong>
                    <span role="cell">{prayer[adhan]}</span>
                    <span role="cell">{iqamah ? (prayer[iqamah] ?? "Not provided") : "—"}</span>
                  </div>
                ))}
              </div>
              <p className="visit-footnote">Published by the mosque · Source: {prayer.source} · Updated {eventTime(prayer.updatedAt, timeZone)} · Revision {prayer.revision}</p>
            </>
          ) : (
            <div className="visit-empty" role="status">No prayer schedule has been published for this venue today. Please contact the mosque to confirm times.</div>
          )}
          {jummah.length > 0 && (
            <div className="visit-jummah">
              <h3>Friday prayer sessions</h3>
              <ul>{jummah.map((item) => (
                <li key={item.id}>Session {item.ordinal}: Khutbah {item.khutbahAt ?? "Not provided"} · Iqamah {item.iqamahAt}{item.language ? ` · ${item.language}` : ""}</li>
              ))}</ul>
            </div>
          )}
        </section>

        <div className="visit-columns">
          <section className="visit-panel" id="updates" aria-labelledby="updates-heading">
            <div className="visit-section-heading"><div><span className="visit-kicker">STAY INFORMED</span><h2 id="updates-heading">Community updates</h2></div></div>
            {faithNotices.length > 0 && (
              <div className="visit-faith" aria-label="Mosque-confirmed dates">
                <strong>Mosque-confirmed dates</strong>
                {faithNotices.map((item) => <article key={item.id}>
                  <span>{localClockLabel(item.localDate)}</span><h3><a href={`/visit/content/faith/${item.id}`}>{item.title}</a></h3><p>{item.body}</p>
                </article>)}
              </div>
            )}
            {announcements.length ? (
              <div className="visit-list">{announcements.map((item) => (
                <article key={item.id}><span className="visit-tag">{item.kind}</span><h3><a href={`/visit/content/updates/${item.id}`}>{item.title}</a></h3><p>{item.body}</p></article>
              ))}</div>
            ) : <p className="visit-empty">No official announcements have been published.</p>}
          </section>
          <section className="visit-panel" id="gatherings" aria-labelledby="gather-heading">
            <div className="visit-section-heading"><div><span className="visit-kicker">GATHER TOGETHER</span><h2 id="gather-heading">Upcoming gatherings</h2></div></div>
            <form method="get" action="/visit" className="visit-gathering-filters"
             aria-label="Filter published gatherings">
             {selectedId?<input type="hidden" name="venue" value={selectedId}/>:null}
             <label>Search name or location<input type="search" name="gatherQ"
              defaultValue={gatherQuery==="__invalid__"?"":gatherQuery} minLength={2} maxLength={80}/></label>
             <label>Verified venue<select name="gatherVenue" defaultValue={gatherVenue}>
              <option value="">Any venue</option>
              {venues.map(v=><option value={v.id} key={v.id}>{v.name}</option>)}
             </select></label>
             <label>Category<select name="category" defaultValue={category}>
              <option value="">All categories</option>
              {GATHERING_CATEGORIES.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}
             </select></label>
             <label>Intended audience<select name="audience" defaultValue={audience}>
              <option value="">Any audience</option>
              {GATHERING_AUDIENCES.map(x=><option key={x} value={x}>{x}</option>)}
             </select></label>
             <label>Confirmed accessibility<select name="accessibility" defaultValue={accessibility}>
              <option value="">Any (including unverified)</option>
              {GATHERING_ACCESSIBILITY.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}
             </select></label>
             <button type="submit">Apply filters</button>
             <a href={selectedId?"/visit?venue="+encodeURIComponent(selectedId)+"#gatherings":"/visit#gatherings"}>Clear filters</a>
            </form>
            {filterInvalid?<p role="alert" className="visit-empty">A gathering filter was invalid or does not belong to this mosque. Clear filters and try again.</p>:null}
            {safeEvents.length ? (
              <div className="visit-list">{safeEvents.map((item) => (
                <article key={item.id}>
                  <span className="visit-date">{eventTime(item.startAt,item.venue?.timeZone||timeZone)}</span>
                  <h3><a href={`/visit/content/gatherings/${item.id}`}>{item.title}</a></h3><p>{item.description}</p>
                  <p className="visit-event-place">{item.location}</p>
                  {item.venue?<p className="visit-footnote">Verified venue: {item.venue.name}</p>:null}
                  {item.category||item.audience?<p className="visit-footnote">
                   {item.category?"Category: "+item.category.replaceAll("_"," "):""}
                   {item.category&&item.audience?" · ":""}
                   {item.audience?"Audience: "+item.audience:""}
                  </p>:null}
                  {item.accessibilityFeatures.length?<p className="visit-footnote">
                    Confirmed accommodations: {item.accessibilityFeatures.map(x=>x.replaceAll("_"," ")).join(", ")}
                  </p>:null}
                </article>
              ))}</div>
            ) : !filterInvalid?<p className="visit-empty">No upcoming published gatherings match these filters.</p>:null}
          </section>
        </div>

        <section className="visit-learning" aria-labelledby="learning-heading">
          <div className="visit-section-heading"><div><span className="visit-kicker">GROW WITH PURPOSE</span><h2 id="learning-heading">Learning at the mosque</h2></div></div>
          {programs.length ? <div className="visit-learning-grid">{programs.map((item) => (
            <article key={item.id}><h3><a href={`/visit/content/learning/${item.id}`}>{item.title}</a></h3><p>{item.description}</p></article>
          ))}</div> : <p className="visit-empty">Learning programs will appear here after the mosque publishes them.</p>}
        </section>
        <footer className="visit-footer">
          <p>SILA · Community and connection</p>
          <p>Only mosque-published information is displayed. Contact the mosque for urgent schedule changes.</p>
          <a href="/kiosk">Prayer display</a>
        </footer>
      </div>
    </main>
  );
}
