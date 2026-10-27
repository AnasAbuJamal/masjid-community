import type { Metadata } from "next";
import { db } from "@/lib/db";
import { localDate } from "@/lib/http";
import "./visit.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Visit the mosque | SILA",
  description: "Published prayer times, Friday prayer, official notices, and gatherings from your mosque.",
};

type PageProps = { searchParams: Promise<{ venue?: string | string[] }> };
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
    dateStyle: "medium", timeStyle: "short", timeZone, timeZoneName: "short",
  }).format(date);
}
function localClockLabel(date: string) {
  const parsed = new Date(date + "T12:00:00Z");
  return Number.isFinite(parsed.valueOf())
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(parsed)
    : date;
}

export default async function VisitPage({ searchParams }: PageProps) {
  const { venue: requested } = await searchParams;
  const selectedId = typeof requested === "string" ? requested : "";
  const organization = await db.organization.findFirst({ orderBy: { createdAt: "asc" } });
  const venues = organization
    ? await db.venue.findMany({
        where: { organizationId: organization.id },
        orderBy: { name: "asc" },
        take: 50,
        select: { id: true, name: true, address: true, timeZone: true },
      })
    : [];
  // Never accept a venue from another mosque or display an old venue's data.
  const venue = venues.find((item) => item.id === selectedId) ?? venues[0] ?? null;
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
    organization
      ? db.event.findMany({
          where: { organizationId: organization.id, status: "published", startAt: { gte: now } },
          orderBy: { startAt: "asc" },
          take: 6,
          select: { id: true, title: true, description: true, location: true, startAt: true },
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
            {events.length ? (
              <div className="visit-list">{events.map((item) => (
                <article key={item.id}>
                  <span className="visit-date">{eventTime(item.startAt, timeZone)}</span>
                  <h3><a href={`/visit/content/gatherings/${item.id}`}>{item.title}</a></h3><p>{item.description}</p>
                  <p className="visit-event-place">{item.location}</p>
                </article>
              ))}</div>
            ) : <p className="visit-empty">No upcoming public gatherings have been published.</p>}
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
