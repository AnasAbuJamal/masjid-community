import type {TranslationKey} from "./i18n";

/** The backend uses stable machine codes, never translated filter values.
 * Unknown or removed codes are labeled "Other" without claiming an
 * accommodation was verified by the mosque.
 */
type Group="category"|"audience"|"accessibility";
const labelKeys:Record<Group,Record<string,TranslationKey>>={
 category:{
  "":"detail.filter.category.",lecture:"detail.filter.category.lecture",
  workshop:"detail.filter.category.workshop",
  community_meal:"detail.filter.category.community_meal",
  youth:"detail.filter.category.youth",service:"detail.filter.category.service",
  other:"detail.filter.category.other"
 },
 audience:{
  "":"detail.filter.audience.",everyone:"detail.filter.audience.everyone",
  adults:"detail.filter.audience.adults",families:"detail.filter.audience.families",
  youth:"detail.filter.audience.youth",children:"detail.filter.audience.children",
  women:"detail.filter.audience.women",men:"detail.filter.audience.men"
 },
 accessibility:{
  "":"detail.filter.accessibility.",
  step_free:"detail.filter.accessibility.step_free",
  hearing_support:"detail.filter.accessibility.hearing_support",
  quiet_space:"detail.filter.accessibility.quiet_space"
 }
};
export function gatheringFilterLabelKey(group:Group,value:string):TranslationKey{
 return labelKeys[group][value]||"detail.filterUnknown";
}

const contentCategories:Record<string,TranslationKey>={
 events:"detail.kind.events",
 announcements:"detail.kind.announcements",
 campaigns:"detail.kind.campaigns",
 volunteers:"detail.kind.volunteers",
 programs:"detail.kind.programs",
 jobs:"detail.kind.jobs",
 proposals:"detail.kind.proposals",
 rentals:"detail.kind.rentals",
 articles:"detail.kind.articles",
 construction:"detail.kind.construction"
};
const contentSubtitles:Record<string,TranslationKey>={
 events:"detail.subtitle.events",
 announcements:"detail.subtitle.announcements",
 campaigns:"detail.subtitle.campaigns",
 volunteers:"detail.subtitle.volunteers",
 programs:"detail.subtitle.programs",
 jobs:"detail.subtitle.jobs",
 proposals:"detail.subtitle.proposals",
 rentals:"detail.subtitle.rentals",
 articles:"detail.subtitle.articles",
 construction:"detail.subtitle.construction"
};
export function gatheringContentLabelKey(kind:string):TranslationKey{
 return contentCategories[kind]||"detail.titleDefault";
}
export function gatheringContentSubtitleKey(kind:string):TranslationKey{
 return contentSubtitles[kind]||"detail.published";
}
