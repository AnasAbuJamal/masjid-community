// Safe presentation policy only. All private authorization remains enforced
// by the API's current verified session and active organization membership.
export type MembershipSearchContext={
 selectedOrganizationId:string;
 selectedActive:boolean;
 organizations:{id:string;memberWorkspace:string}[];
};
export type MemberSurfaceScope="guest"|"pilot"|"limited"|"loading"|"inactive";
export type SearchScope="public"|"gatherings_only"|"unknown";

export function memberSurfaceScope(
 context:MembershipSearchContext|null|undefined,verified:boolean
):MemberSurfaceScope{
 if(!verified)return "guest";
 if(!context)return "loading";
 if(!context.selectedActive)return "inactive";
 const selected=context.organizations.find(x=>x.id===context.selectedOrganizationId);
 if(!selected)return "inactive";
 return selected.memberWorkspace==="pilot"?"pilot":"limited";
}

export function allowPilotContent(scope:MemberSurfaceScope):boolean{
 return scope==="guest"||scope==="pilot";
}

export function searchScope(
 context:MembershipSearchContext|null|undefined,verified:boolean
):SearchScope{
 const scope=memberSurfaceScope(context,verified);
 if(scope==="guest"||scope==="pilot")return "public";
 return scope==="limited"?"gatherings_only":"unknown";
}

export function scopedSearchPath(term:string,category:string,scope:SearchScope):string|null{
 const text=term.trim();
 if(text.length<2||scope==="unknown")return null;
 return scope==="gatherings_only"
  ?"events/catalog?q="+encodeURIComponent(text)
  :"public/search?q="+encodeURIComponent(text)+"&kind="+encodeURIComponent(category);
}
