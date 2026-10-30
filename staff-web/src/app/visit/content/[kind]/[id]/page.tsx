import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import "../../../visit.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Community information | SILA",
  description: "Published information from the mosque.",
};
type Props = { params: Promise<{ kind: string; id: string }> };

export default async function PublicDetail({ params }: Props) {
  const { kind, id } = await params;
  // A guessed record ID is not authorization. Every detail lookup must be public
  // AND belong to the currently configured mosque.
  const organization = await db.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!organization) notFound();
  const organizationId = organization.id;
  const now = new Date();
  let title: string;
  let body: string;
  let label: string;
  let facts: string[] = [];
  if (kind === "gatherings") {
    const item = await db.event.findFirst({
      where: { id, organizationId, status: "published" },
      select: { title: true, description: true, location: true, startAt: true, endAt: true,
        capacity: true, rsvpCount: true, waitlistEnabled: true, rsvpDeadlineAt: true,
        cancellationDeadlineAt: true, cancellationTerms: true, category:true,audience:true,
        accessibilityFeatures:true,accessibilityNotes:true,
        venue:{select:{name:true,timeZone:true,organizationId:true}} },
    });
    if (!item) notFound();
    title = item.title; body = item.description; label = "PUBLIC GATHERING";
    const trustedVenue=item.venue?.organizationId===organizationId?item.venue:null;
    const format = (date: Date) => new Intl.DateTimeFormat("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
      timeZone: trustedVenue?.timeZone||organization.timeZone,timeZoneName: "short",
    }).format(date);
    facts = [format(item.startAt), "Ends " + format(item.endAt), item.location,
      ...(trustedVenue?["Confirmed venue: "+trustedVenue.name]:[]),
      ...(item.category?["Category: "+item.category.replaceAll("_"," ")]:[]),
      ...(item.audience?["Intended audience: "+item.audience]:[]),
      ...(item.accessibilityFeatures.length?["Confirmed accessibility features: "+item.accessibilityFeatures.map(x=>x.replaceAll("_"," ")).join(", ")]:[]),
      ...(item.accessibilityNotes?["Accommodations: "+item.accessibilityNotes]:[]),
      "RSVP closes " + format(item.rsvpDeadlineAt ?? item.startAt),
      "Cancellation closes " + format(item.cancellationDeadlineAt ?? item.startAt),
      ...(item.cancellationTerms?["Cancellation terms: " + item.cancellationTerms]:[]),
      ...(item.capacity===null?[]:[
        String(item.rsvpCount)+" of "+String(item.capacity)+" places confirmed",
        item.waitlistEnabled?"Waitlist available if full":"No waitlist for this gathering"
      ])];
  } else if (kind === "updates") {
    const item = await db.announcement.findFirst({
      where: { id, organizationId, status: "published", publishedAt: { lte: now } },
      select: { title: true, body: true, kind: true },
    });
    if (!item) notFound();
    title = item.title; body = item.body; label = "OFFICIAL " + item.kind.toUpperCase() + " NOTICE";
  } else if (kind === "learning") {
    const item = await db.schoolProgram.findFirst({
      where: { id, organizationId, published: true },
      select: { title: true, description: true },
    });
    if (!item) notFound();
    title = item.title; body = item.description; label = "PUBLISHED LEARNING PROGRAM";
  } else if (kind === "faith") {
    const item = await db.faithNotice.findFirst({
      where: {
        id, organizationId, status: "published",
        approvedById: { not: null }, publishedAt: { lte: now },
      },
      select: { title: true, body: true, localDate: true },
    });
    if (!item) notFound();
    title = item.title; body = item.body; label = "MOSQUE-CONFIRMED FAITH NOTICE";
    const date = new Date(item.localDate + "T12:00:00Z");
    facts = [new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(date)];
  } else {
    notFound();
  }

  return <main className="visit">
    <header className="visit-header"><a className="visit-brand" href="/visit"><span className="visit-symbol" aria-hidden="true">✧</span><span>SILA <span lang="ar" dir="rtl">صِلَة</span><small>COMMUNITY &amp; CONNECTION</small></span></a><nav aria-label="Navigation"><a href="/visit">Back to public website</a></nav></header>
    <div className="visit-container">
      <article className="visit-detail">
        <a className="visit-back" href="/visit">← Back to the mosque</a>
        <span className="visit-kicker">{label}</span>
        <h1>{title}</h1>
        {facts.length > 0 ? <ul className="visit-detail-facts">{facts.map((fact, index) => <li key={index}>{fact}</li>)}</ul> : null}
        <div className="visit-detail-body">{body}</div>
        {kind==="gatherings"?<p className="section"><a className="visit-action" href={`/api/v1/events/${id}/calendar`}>
          Save this gathering to my calendar</a></p>:null}
        {kind==="gatherings"?<p className="visit-footnote">Calendar download is informational only and does not reserve a place.</p>:null}
        <p className="visit-footnote">Official content published by {organization.name}. For changes or questions, contact the mosque.</p>
      </article>
      <footer className="visit-footer"><p>SILA · Community and connection</p><a href="/visit#updates">Community updates</a></footer>
    </div>
  </main>;
}
