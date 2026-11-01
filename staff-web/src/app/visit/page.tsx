import type { Metadata } from "next";
import { db } from "@/lib/db";
import { localDate,HttpError } from "@/lib/http";
import {GATHERING_CATEGORIES,GATHERING_AUDIENCES,GATHERING_ACCESSIBILITY,
 gatheringFilters,publishedGatheringPage} from "@/lib/gathering-filters";
import {civilDayStart,nextCivilDay} from "@/lib/civil-day";
import {currentVenueEmergency} from "@/lib/venue-emergencies";
import {visitLanguage,visitText,visitHref,visitDay,visitDate,visitLocalDay,visitFacet,
 type VisitCopyKey} from "@/lib/visit-i18n";
import "./visit.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({searchParams}:PageProps):Promise<Metadata>{
 const lang=visitLanguage((await searchParams).lang);
 return {title:(lang==="ar"?"زيارة المسجد":"Visit the mosque")+" | SILA",
  description:visitText(lang,"siteDescription"),
  alternates:{languages:{en:"/visit",ar:"/visit?lang=ar"}}};
}

type VisitFilters={lang?:string|string[];venue?:string|string[];gatherVenue?:string|string[];
 category?:string|string[];audience?:string|string[];
 accessibility?:string|string[];gatherQ?:string|string[];
 fromDay?:string|string[];toDay?:string|string[];
 gatherCursor?:string|string[]};
type PageProps = { searchParams: Promise<VisitFilters> };
const prayerRows = [
  ["Fajr", "fajr", "fajrIqamah"],
  ["Sunrise", "sunrise", null],
  ["Dhuhr", "dhuhr", "dhuhrIqamah"],
  ["Asr", "asr", "asrIqamah"],
  ["Maghrib", "maghrib", "maghribIqamah"],
  ["Isha", "isha", "ishaIqamah"],
] as const;

const prayerNames={"Fajr":"fajr","Sunrise":"sunrise","Dhuhr":"dhuhr",
 "Asr":"asr","Maghrib":"maghrib","Isha":"isha"} as const;

export default async function VisitPage({ searchParams }: PageProps) {
  const search=await searchParams;
  const lang=visitLanguage(search.lang);
  const t=(key:VisitCopyKey)=>visitText(lang,key);
  const href=(path:string)=>visitHref(path,lang);
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
  const fromDay=value("fromDay"),toDay=value("toDay");
  const gatherCursor=value("gatherCursor");
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
  const filterZone=venues.find(v=>v.id===gatherVenue)?.timeZone||
   organization?.timeZone||"UTC";
  const fromStart=fromDay?civilDayStart(fromDay,filterZone):null;
  const nextDay=toDay?nextCivilDay(toDay):null;
  const untilStart=nextDay?civilDayStart(nextDay,filterZone):null;
  const invalidDates=(!!fromDay&&!fromStart)||(!!toDay&&!untilStart)||
   (!!fromStart&&!!untilStart&&untilStart<=fromStart);
  const filterInvalid=invalidDates||
    (!!gatherCursor&&!/^[A-Za-z0-9_-]{8,128}$/.test(gatherCursor))||
    (gatherQuery.length===1||gatherQuery.length>80||gatherQuery==="__invalid__")||
    (!!category&&!GATHERING_CATEGORIES.includes(category as typeof GATHERING_CATEGORIES[number]))||
    (!!audience&&!GATHERING_AUDIENCES.includes(audience as typeof GATHERING_AUDIENCES[number]))||
    (!!accessibility&&!GATHERING_ACCESSIBILITY.includes(accessibility as typeof GATHERING_ACCESSIBILITY[number]))||
    (!!gatherVenue&&!venues.some(v=>v.id===gatherVenue));
  // Build canonical, validated query filters for the same shared database
  // keyset boundary as the public and authenticated mobile catalogs.
  // The prayer venue remains separate from the gathering venue filter.
  const gatherParams=new URLSearchParams();
  if(gatherQuery)gatherParams.set("q",gatherQuery);
  if(category)gatherParams.set("category",category);
  if(audience)gatherParams.set("audience",audience);
  if(accessibility)gatherParams.set("accessibility",accessibility);
  if(gatherVenue)gatherParams.set("venueId",gatherVenue);
  if(fromStart)gatherParams.set("from",fromStart.toISOString());
  if(untilStart)gatherParams.set("to",untilStart.toISOString());
  if(gatherCursor)gatherParams.set("cursor",gatherCursor);
  const keptParams=new URLSearchParams();
  if(venue)keptParams.set("venue",venue.id);
  if(lang==="ar")keptParams.set("lang","ar");
  if(gatherQuery)keptParams.set("gatherQ",gatherQuery);
  if(category)keptParams.set("category",category);
  if(audience)keptParams.set("audience",audience);
  if(accessibility)keptParams.set("accessibility",accessibility);
  if(gatherVenue)keptParams.set("gatherVenue",gatherVenue);
  if(fromDay)keptParams.set("fromDay",fromDay);
  if(toDay)keptParams.set("toDay",toDay);
  const firstPageHref="/visit?"+keptParams.toString()+"#gatherings";
  const languageParams=new URLSearchParams(keptParams);
  if(gatherCursor)languageParams.set("gatherCursor",gatherCursor);
  const changeLanguage=(language:"en"|"ar")=>visitHref("/visit?"+
   languageParams.toString(),language);
  let invalidCursor=false;
  async function fetchGatherings(){
   if(!organization||filterInvalid)return {items:[],hasMore:false,nextCursor:null};
   try{
    return await publishedGatheringPage(organization.id,gatheringFilters(gatherParams));
   }catch(error){
    if(error instanceof HttpError&&error.code==="CURSOR_UNAVAILABLE"){
     invalidCursor=true;
     return {items:[],hasMore:false,nextCursor:null};
    }
    throw error;
   }
  }
  const now = new Date();
  const today = venue ? localDate(now, venue.timeZone) : null;
  const [prayer, jummah, announcements, eventPage, faithNotices, programs] = await Promise.all([
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
    fetchGatherings(),
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
  const safeEvents=eventPage.items;
  const nextPageHref=eventPage.hasMore&&eventPage.nextCursor?
   "/visit?"+new URLSearchParams([...keptParams,
     ["gatherCursor",eventPage.nextCursor]]).toString()+"#gatherings":null;
  const emergency=await currentVenueEmergency(venue?.id,now);

  return (
    <main className="visit" lang={lang} dir={lang==="ar"?"rtl":"ltr"}>
      <header className="visit-header">
        <a href={href("/visit")} className="visit-brand" aria-label={t("home")}>
          <span aria-hidden="true" className="visit-symbol">✧</span>
          <span>SILA <span lang="ar" dir="rtl">صِلَة</span><small>{t("siteTagline")}</small></span>
        </a>
        <nav aria-label={t("publicNav")}>
          <a href="#prayers">{t("prayers")}</a>
          <a href="#updates">{t("updates")}</a>
          <a href="#gatherings">{t("gatherings")}</a>
          <a className="visit-staff-link" href="/">{t("staffSignIn")}</a>
          <span className="visit-language" aria-label={t("languageNav")}>
           <a href={changeLanguage("en")} lang="en" dir="ltr"
            aria-current={lang==="en"?"page":undefined}>English</a>
           <a href={changeLanguage("ar")} lang="ar" dir="rtl"
            aria-current={lang==="ar"?"page":undefined}>العربية</a>
          </span>
        </nav>
      </header>

      <div className="visit-container">
        {emergency?<section className="visit-emergency" role="alert" aria-label={t("emergencyLabel")}>
          <strong>{t("venueNotice")} · {emergency.kind.replaceAll("_"," ")} · <bdi dir="auto">{venue?.name}</bdi></strong>
          <h2 dir="auto">{emergency.title}</h2>
          <p dir="auto">{emergency.body}</p><p><strong>{t("emergencyWhatToDo")}</strong> <bdi dir="auto">{emergency.instructions}</bdi></p>
          <p className="visit-footnote">{t("currentRevision")} {emergency.revision}; {t("noticeExpires")} <bdi dir="auto">{visitDate(emergency.expiresAt,venue?.timeZone||timeZone,lang)}</bdi>. {t("verifyEmergency")}</p>
        </section>:null}
        <section className="visit-hero" aria-labelledby="visit-heading">
          <div>
            <span className="visit-kicker">{t("placeToBelong")}</span>
            <h1 id="visit-heading">{t("heroLine1")}<br /><em>{t("heroLine2")}</em></h1>
            <p>{t("heroDescription")}</p>
            <div className="visit-hero-actions">
              <a className="visit-action" href="#prayers">{t("viewPrayer")} <span aria-hidden="true">↗</span></a>
              <a className="visit-action-outline" href="#gatherings">{t("exploreGatherings")}</a>
            </div>
          </div>
          <div className="visit-place" aria-label={t("yourCommunity")}>
            <span className="visit-place-icon" aria-hidden="true">◈</span>
            <span className="visit-kicker">{t("yourCommunity")}</span>
            <h2 dir="auto">{organization?.name ?? t("noCommunity")}</h2>
            <p dir="auto">{venue?.name ?? t("noVenue")}</p>
            {venue?.address || organization?.address ? <address>{venue?.address ?? organization?.address}</address> : null}
            {venues.length > 1 ? (
              <form method="get" action="/visit" className="visit-venue-form">
                {lang==="ar"?<input type="hidden" name="lang" value="ar"/>:null}
                <label htmlFor="visit-venue">{t("chooseVenue")}</label>
                <select id="visit-venue" name="venue" defaultValue={venue?.id}>
                  {venues.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <button type="submit">{t("showVenue")}</button>
              </form>
            ) : null}
            <span className="visit-place-note">{t("allTimesIn")} <bdi dir="ltr">{timeZone}</bdi>.</span>
          </div>
        </section>

        <section className="visit-schedule" id="prayers" aria-labelledby="prayer-heading">
          <div className="visit-section-heading">
            <div><span className="visit-kicker">{t("todayWorship")}</span><h2 id="prayer-heading">{t("prayerTimes")}</h2></div>
            <p>{venue ? visitDay(now,timeZone,lang) : t("venueNotConfigured")}</p>
          </div>
          {prayer ? (
            <>
              <div className="visit-prayer-grid" role="table" aria-label={t("prayerTimes")}>
                <div className="visit-prayer-row visit-prayer-head" role="row"><span role="columnheader">{t("prayer")}</span><span role="columnheader">{t("adhan")}</span><span role="columnheader">{t("iqamah")}</span></div>
                {prayerRows.map(([name, adhan, iqamah]) => (
                  <div className="visit-prayer-row" role="row" key={name}>
                    <strong role="cell">{t(prayerNames[name])}</strong>
                    <span role="cell"><bdi dir="ltr">{prayer[adhan]}</bdi></span>
                    <span role="cell"><bdi dir="ltr">{iqamah ? (prayer[iqamah] ?? t("notProvided")) : "—"}</bdi></span>
                  </div>
                ))}
              </div>
              <p className="visit-footnote">{t("publishedBy")} · {t("source")} <bdi dir="auto">{prayer.source}</bdi> · {t("updated")} <bdi dir="auto">{visitDate(prayer.updatedAt,timeZone,lang)}</bdi> · {t("revision")} {prayer.revision}</p>
            </>
          ) : (
            <div className="visit-empty" role="status">{t("noPrayerSchedule")}</div>
          )}
          {jummah.length > 0 && (
            <div className="visit-jummah">
              <h3>{t("fridaySessions")}</h3>
              <ul>{jummah.map((item) => (
                <li key={item.id}>{t("session")} {item.ordinal}: {t("khutbah")} <bdi dir="ltr">{item.khutbahAt ?? t("notProvided")}</bdi> · {t("iqamah")} <bdi dir="ltr">{item.iqamahAt}</bdi>{item.language ? ` · ${item.language}` : ""}</li>
              ))}</ul>
            </div>
          )}
        </section>

        <div className="visit-columns">
          <section className="visit-panel" id="updates" aria-labelledby="updates-heading">
            <div className="visit-section-heading"><div><span className="visit-kicker">{t("stayInformed")}</span><h2 id="updates-heading">{t("communityUpdates")}</h2></div></div>
            {faithNotices.length > 0 && (
              <div className="visit-faith" aria-label={t("confirmedDates")}>
                <strong>{t("confirmedDates")}</strong>
                {faithNotices.map((item) => <article key={item.id}>
                  <span>{visitLocalDay(item.localDate,lang)}</span><h3><a href={href(`/visit/content/faith/${item.id}`)}><bdi dir="auto">{item.title}</bdi></a></h3><p dir="auto">{item.body}</p>
                </article>)}
              </div>
            )}
            {announcements.length ? (
              <div className="visit-list">{announcements.map((item) => (
                <article key={item.id}><span className="visit-tag">{item.kind}</span><h3><a href={href(`/visit/content/updates/${item.id}`)}><bdi dir="auto">{item.title}</bdi></a></h3><p dir="auto">{item.body}</p></article>
              ))}</div>
            ) : <p className="visit-empty">{t("noAnnouncements")}</p>}
          </section>
          <section className="visit-panel" id="gatherings" aria-labelledby="gather-heading">
            <div className="visit-section-heading"><div><span className="visit-kicker">{t("gatherTogether")}</span><h2 id="gather-heading">{t("upcomingGatherings")}</h2></div></div>
            <form method="get" action="/visit" className="visit-gathering-filters"
             aria-label={t("filterPublished")}>
             {selectedId?<input type="hidden" name="venue" value={selectedId}/>:null}
             {lang==="ar"?<input type="hidden" name="lang" value="ar"/>:null}
             <label>{t("searchLocation")}<input type="search" name="gatherQ"
              defaultValue={gatherQuery==="__invalid__"?"":gatherQuery} minLength={2} maxLength={80}/></label>
             <label>{t("verifiedVenue")}<select name="gatherVenue" defaultValue={gatherVenue}>
              <option value="">{t("anyVenue")}</option>
              {venues.map(v=><option value={v.id} key={v.id}>{v.name}</option>)}
             </select></label>
             <label>{t("category")}<select name="category" defaultValue={category}>
              <option value="">{t("allCategories")}</option>
              {GATHERING_CATEGORIES.map(x=><option key={x} value={x}>{visitFacet(lang,"category",x)}</option>)}
             </select></label>
             <label>{t("intendedAudience")}<select name="audience" defaultValue={audience}>
              <option value="">{t("anyAudience")}</option>
              {GATHERING_AUDIENCES.map(x=><option key={x} value={x}>{visitFacet(lang,"audience",x)}</option>)}
             </select></label>
             <label>{t("confirmedAccess")}<select name="accessibility" defaultValue={accessibility}>
              <option value="">{t("anyUnverified")}</option>
              {GATHERING_ACCESSIBILITY.map(x=><option key={x} value={x}>{visitFacet(lang,"accessibility",x)}</option>)}
             </select></label>
             <label>{t("fromDay")}<input type="date" name="fromDay" defaultValue={fromDay==="__invalid__"?"":fromDay}/></label>
             <label>{t("throughDay")}<input type="date" name="toDay" defaultValue={toDay==="__invalid__"?"":toDay}/></label>
             <p className="visit-filter-timezone">{t("datesUseZone")} <bdi dir="ltr">{filterZone}</bdi>. {t("daylightIncluded")}</p>
             <button type="submit">{t("applyFilters")}</button>
             <a href={href(selectedId?"/visit?venue="+encodeURIComponent(selectedId)+"#gatherings":"/visit#gatherings")}>{t("clearFilters")}</a>
            </form>
            {filterInvalid||invalidCursor?<p role="alert" className="visit-empty">{t("invalidFilters")}</p>:null}
            {safeEvents.length ? (
              <div className="visit-list">{safeEvents.map((item) => (
                <article key={item.id}>
                  <span className="visit-date">{visitDate(item.startAt,item.venue?.timeZone||timeZone,lang)}</span>
                  <h3><a href={href(`/visit/content/gatherings/${item.id}`)}><bdi dir="auto">{item.title}</bdi></a></h3><p dir="auto">{item.description}</p>
                  <p className="visit-event-place" dir="auto">{item.location}</p>
                  {item.venue?<p className="visit-footnote">{t("verifiedVenue")}: <bdi dir="auto">{item.venue.name}</bdi></p>:null}
                  {item.category||item.audience?<p className="visit-footnote">
                   {item.category?t("category")+": "+visitFacet(lang,"category",item.category):""}
                   {item.category&&item.audience?" · ":""}
                   {item.audience?t("audience")+" "+visitFacet(lang,"audience",item.audience):""}
                  </p>:null}
                  {item.accessibilityFeatures.length?<p className="visit-footnote">
                    {t("confirmedAccommodations")} {item.accessibilityFeatures.map(x=>visitFacet(lang,"accessibility",x)).join(", ")}
                  </p>:null}
                </article>
              ))}</div>
            ) : !filterInvalid&&!invalidCursor?<p className="visit-empty">{t("noMatching")}</p>:null}
            {nextPageHref?<nav aria-label={t("gatherings")} className="visit-gathering-pages">
              <a href={nextPageHref}>{t("moreGatherings")}</a>
              <a href={firstPageHref}>{t("restartFirst")}</a>
            </nav>:null}
            {gatherCursor&&(filterInvalid||invalidCursor||!nextPageHref)?<p className="visit-footnote">
              <a href={firstPageHref}>{t("restartFiltered")}</a>
            </p>:null}
          </section>
        </div>

        <section className="visit-learning" aria-labelledby="learning-heading">
          <div className="visit-section-heading"><div><span className="visit-kicker">{t("growPurpose")}</span><h2 id="learning-heading">{t("learningMosque")}</h2></div></div>
          {programs.length ? <div className="visit-learning-grid">{programs.map((item) => (
            <article key={item.id}><h3><a href={href(`/visit/content/learning/${item.id}`)}><bdi dir="auto">{item.title}</bdi></a></h3><p dir="auto">{item.description}</p></article>
          ))}</div> : <p className="visit-empty">{t("noLearning")}</p>}
        </section>
        <footer className="visit-footer">
          <p>{t("footerBrand")}</p>
          <p>{t("onlyPublished")}</p>
          <p>{t("originalContent")}</p>
          <a href="/kiosk">{t("prayerDisplay")}</a>
        </footer>
      </div>
    </main>
  );
}
