import React from "react";
import {AppState} from "react-native";
import {shouldRefreshVenueOnResume} from "./venue-resume-policy";

/**
 * Refreshes current published mosque information while the screen is mounted
 * and whenever the application resumes after background/inactive state.
 * The API hook owns request-generation guards; this hook never persists
 * emergency instructions or treats an old response as current.
 */
export function useVenueSafetyRefresh(
 enabled: boolean,
 refresh: () => Promise<void>,
) {
 React.useEffect(()=>{
  if(!enabled)return;
  const timer=setInterval(()=>void refresh(),60_000);
  let previous=AppState.currentState;
  const subscription=AppState.addEventListener("change",state=>{
   if(shouldRefreshVenueOnResume(previous,state))void refresh();
   previous=state;
  });
  return ()=>{
   clearInterval(timer);
   subscription.remove();
  };
 },[enabled,refresh]);
}
