import {useSession} from "./session";
import {useResource} from "./useResource";
import {memberSurfaceScope,allowPilotContent,type MembershipSearchContext} from "./searchScope";

// A presentation guard, NOT server-side authorization. Verified session
// membership is rechecked by APIs; do not use a persisted client tenant ID.
export function usePilotSurface(){
 const {user,contextVersion}=useSession();
 const context=useResource<MembershipSearchContext>(user?.isVerified?"organizations/context":null);
 const scope=memberSurfaceScope(context.data,!!user?.isVerified);
 return {
  allowed:allowPilotContent(scope),scope,contextVersion,
  loading:context.loading,error:context.error,refresh:context.refresh
 };
}
