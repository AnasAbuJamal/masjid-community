// Public, reviewed filter choices. No inference about missing accessibility
// details and no private identity data in event discovery URLs.
export const CATEGORIES=[
 ["","All categories"],["lecture","Lecture"],["workshop","Workshop"],
 ["community_meal","Community meal"],["youth","Youth"],["service","Service"],["other","Other"]
] as const;
export const AUDIENCES=[
 ["","Any audience"],["everyone","Everyone"],["adults","Adults"],
 ["families","Families"],["youth","Youth"],["children","Children"],
 ["women","Women"],["men","Men"]
] as const;
export const ACCESSIBILITY=[
 ["","Any accessibility"],["step_free","Step-free access"],
 ["hearing_support","Hearing support"],["quiet_space","Quiet space"]
] as const;
export type GatheringFilters={
 query:string;fromDay:string;toDay:string;venueId:string;
 category:string;audience:string;accessibility:string;
};
function civilDate(value:string):Date|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const [year,month,day]=value.split("-").map(Number);
 if(year<2000||year>2100)return null;
 const date=new Date(year,month-1,day);
 return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
}
export function gatheringFilterError(f:GatheringFilters):string|null{
 if(f.query.trim().length>80)return "Search is limited to 80 characters.";
 if(f.fromDay&&!civilDate(f.fromDay))return "Use YYYY-MM-DD for the start date.";
 if(f.toDay&&!civilDate(f.toDay))return "Use YYYY-MM-DD for the end date.";
 if(f.fromDay&&f.toDay&&civilDate(f.toDay)!.getTime()<civilDate(f.fromDay)!.getTime())
  return "End date must be on or after start date.";
 return null;
}
export function gatheringCatalogPath(base:string,f:GatheringFilters):string|null{
 if(gatheringFilterError(f))return null;
 const params=new URLSearchParams();
 if(f.query.trim().length>=2)params.set("q",f.query.trim());
 if(f.fromDay)params.set("from",civilDate(f.fromDay)!.toISOString());
 if(f.toDay){
  const exclusive=civilDate(f.toDay)!;
  exclusive.setDate(exclusive.getDate()+1);
  params.set("to",exclusive.toISOString());
 }
 for(const key of ["venueId","category","audience","accessibility"] as const)
  if(f[key])params.set(key,f[key]);
 const encoded=params.toString();
 return base+(encoded?"?"+encoded:"");
}
