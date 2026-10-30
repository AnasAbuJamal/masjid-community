// Search must respect the verified server-side mosque context. A second
// mosque currently supports only its published gathering catalog. Never
// fall back to the home mosque while tenant context is unresolved/revoked.
export type MembershipSearchContext={
 selectedOrganizationId:string;
 selectedActive:boolean;
 organizations:{id:string;memberWorkspace:string}[];
};
export type SearchScope="public"|"gatherings_only"|"unknown";

export function searchScope(context:MembershipSearchContext|null|undefined,verified:boolean):SearchScope{
 if(!verified)return "public";
 if(!context)return "unknown";
 const selected=context.organizations.find(x=>x.id===context.selectedOrganizationId);
 return context.selectedActive&&selected?.memberWorkspace==="pilot"?"public":"gatherings_only";
}

export function scopedSearchPath(term:string,category:string,scope:SearchScope):string|null{
 const text=term.trim();
 if(text.length<2||scope==="unknown")return null;
 return scope==="gatherings_only"
  ?"events/catalog?q="+encodeURIComponent(text)
  :"public/search?q="+encodeURIComponent(text)+"&kind="+encodeURIComponent(category);
}
