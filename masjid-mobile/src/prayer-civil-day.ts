/**
 * Localize a day that the mosque has ALREADY selected and published.
 *
 * A YYYY-MM-DD is a civil day, not an instant. Converting it with the phone's
 * local timezone can shift the displayed date by one day. Format the exact
 * validated civil date with UTC as an inert rendering anchor. This does not
 * change the mosque's independently approved day or prayer source.
 */
export function publishedPrayerDayLabel(
  localDate:string|null|undefined,
  language:"en"|"ar",
):string|null{
  if(!localDate||!/^\d{4}-\d{2}-\d{2}$/.test(localDate))return null;
  const anchor=new Date(localDate+"T12:00:00.000Z");
  if(!Number.isFinite(anchor.getTime())||
     anchor.toISOString().slice(0,10)!==localDate)return null;
  try{
    return new Intl.DateTimeFormat(
      language==="ar"?"ar-EG-u-ca-gregory":"en-US",
      {timeZone:"UTC",weekday:"long",year:"numeric",month:"long",day:"numeric"}
    ).format(anchor);
  }catch{
    return null;
  }
}
