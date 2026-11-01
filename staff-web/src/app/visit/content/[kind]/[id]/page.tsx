import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { publicIndexOrigin,publicIndexPath } from "@/lib/public-indexing";
import {visitLanguage,visitText,visitHref,visitDate,visitLocalDay,visitFacet,
 type VisitCopyKey} from "@/lib/visit-i18n";
import "../../../visit.css";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ kind: string; id: string }>;
 searchParams:Promise<{lang?:string|string[]}> };
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{
 const lang=visitLanguage((await searchParams).lang);
 const {kind,id}=await params;
 const path=publicIndexPath(kind,id);
 const origin=publicIndexOrigin(process.env.SILA_PUBLIC_INDEXING_ENABLED,
   process.env.SILA_PUBLIC_SITE_URL);
 return {title:visitText(lang,"publicInformation")+" | SILA",
  description:visitText(lang,"publishedInformation"),
  ...(path&&origin?{alternates:{
   canonical:origin+path+(lang==="ar"?"?lang=ar":""),
   languages:{en:origin+path,ar:origin+path+"?lang=ar"}
  }}:{robots:{index:false,follow:false}})
 };
}

export default async function PublicDetail({ params,searchParams }: Props) {
  const { kind, id } = await params;
  const lang=visitLanguage((await searchParams).lang);
  const t=(key:VisitCopyKey)=>visitText(lang,key);
  const href=(path:string)=>visitHref(path,lang);
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
    title = item.title; body = item.description; label = t("detailPublicGathering");
    const trustedVenue=item.venue?.organizationId===organizationId?item.venue:null;
    const format = (date:Date)=>visitDate(date,trustedVenue?.timeZone||organization.timeZone,lang);
    facts = [format(item.startAt),t("detailEnds")+" "+format(item.endAt),item.location,
      ...(trustedVenue?[t("detailConfirmedVenue")+" "+trustedVenue.name]:[]),
      ...(item.category?[t("category")+": "+visitFacet(lang,"category",item.category)]:[]),
      ...(item.audience?[t("intendedAudience")+": "+visitFacet(lang,"audience",item.audience)]:[]),
      ...(item.accessibilityFeatures.length?[t("confirmedAccommodations")+" "+
        item.accessibilityFeatures.map(x=>visitFacet(lang,"accessibility",x)).join(", ")]:[]),
      ...(item.accessibilityNotes?[t("confirmedAccommodations")+" "+item.accessibilityNotes]:[]),
      t("detailRsvpCloses")+" "+format(item.rsvpDeadlineAt ?? item.startAt),
      t("detailCancelCloses")+" "+format(item.cancellationDeadlineAt ?? item.startAt),
      ...(item.cancellationTerms?[t("detailCancellationTerms")+" "+item.cancellationTerms]:[]),
      ...(item.capacity===null?[]:[
        String(item.rsvpCount)+" "+t("detailCapacityOf")+" "+String(item.capacity)+" "+t("detailPlacesConfirmed"),
        t(item.waitlistEnabled?"detailWaitlist":"detailNoWaitlist")
      ])];
  } else if (kind === "updates") {
    const item = await db.announcement.findFirst({
      where: { id, organizationId, status: "published", publishedAt: { lte: now } },
      select: { title: true, body: true, kind: true },
    });
    if (!item) notFound();
    title = item.title; body = item.body; label = t("detailOfficialNotice")+
    (lang==="en"?" · "+item.kind.toUpperCase():"");
  } else if (kind === "learning") {
    const item = await db.schoolProgram.findFirst({
      where: { id, organizationId, published: true },
      select: { title: true, description: true },
    });
    if (!item) notFound();
    title = item.title; body = item.description; label = t("detailLearning");
  } else if (kind === "faith") {
    const item = await db.faithNotice.findFirst({
      where: {
        id, organizationId, status: "published",
        approvedById: { not: null }, publishedAt: { lte: now },
      },
      select: { title: true, body: true, localDate: true },
    });
    if (!item) notFound();
    title = item.title; body = item.body; label = t("detailFaith");
    facts = [visitLocalDay(item.localDate,lang)];
  } else {
    notFound();
  }

  return <main className="visit" lang={lang} dir={lang==="ar"?"rtl":"ltr"}>
    <header className="visit-header">
     <a className="visit-brand" href={href("/visit")}><span className="visit-symbol" aria-hidden="true">✧</span><span>SILA <span lang="ar" dir="rtl">صِلَة</span><small>{t("siteTagline")}</small></span></a>
     <nav aria-label={t("publicNav")}>
      <a href={href("/visit")}>{t("backToPublic")}</a>
      <span className="visit-language" aria-label={t("languageNav")}>
       <a href={visitHref(`/visit/content/${kind}/${id}`,"en")} lang="en" dir="ltr"
        aria-current={lang==="en"?"page":undefined}>English</a>
       <a href={visitHref(`/visit/content/${kind}/${id}`,"ar")} lang="ar" dir="rtl"
        aria-current={lang==="ar"?"page":undefined}>العربية</a>
      </span>
     </nav>
    </header>
    <div className="visit-container">
      <article className="visit-detail">
        <a className="visit-back" href={href("/visit")}>{t("detailBack")}</a>
        <span className="visit-kicker">{label}</span>
        <h1 dir="auto">{title}</h1>
        {facts.length > 0 ? <ul className="visit-detail-facts">{facts.map((fact, index) => <li key={index}><bdi dir="auto">{fact}</bdi></li>)}</ul> : null}
        <div className="visit-detail-body" dir="auto">{body}</div>
        {kind==="gatherings"?<p className="section"><a className="visit-action" href={`/api/v1/events/${id}/calendar`}>
          {t("detailCalendarSave")}</a></p>:null}
        {kind==="gatherings"?<p className="visit-footnote">{t("detailCalendarWarn")}</p>:null}
        <p className="visit-footnote">{t("detailPublisher")} <bdi dir="auto">{organization.name}</bdi>. {t("detailContact")}</p>
        <p className="visit-footnote">{t("originalContent")}</p>
      </article>
      <footer className="visit-footer"><p>{t("footerBrand")}</p><a href={href("/visit#updates")}>{t("communityUpdates")}</a></footer>
    </div>
  </main>;
}
