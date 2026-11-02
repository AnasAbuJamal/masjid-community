import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const screen=readFileSync("masjid-mobile/app/settings.tsx","utf8");
const locales=readFileSync("masjid-mobile/src/i18n.tsx","utf8");

test("native account titles and destructive sign-out confirmation have reviewed Arabic copy",()=>{
 const keys=[
  "settings.back","settings.eyebrow","settings.pageTitle",
  "settings.pageSubtitle","settings.languageNotice","settings.profileTitle",
  "settings.firstName","settings.lastName",
  "settings.logoutEverywhere","settings.logoutTitle",
  "settings.logoutBody","settings.logoutConfirm",
  "settings.requestSubmitFailed","settings.cancel"
 ];
 for(const key of keys){
  assert.match(locales,new RegExp('"'+key.replaceAll(".","\\.")+'":\\{en:".+",ar:".+"\\}'),key);
  assert.ok(screen.includes('t("'+key+'")'),"screen must use "+key);
 }
 assert.doesNotMatch(screen,/label="Back to profile"/);
 assert.doesNotMatch(screen,/label="First name"/);
 assert.doesNotMatch(screen,/label="Last name"/);
 assert.doesNotMatch(screen,/label="Sign out on all devices"/);
 assert.doesNotMatch(screen,/Alert\.alert\("Sign out all sessions\?"/);
});

test("Arabic switches respect RTL and session dates retain an explicit Gregorian calendar",()=>{
 assert.match(screen,/const \{language,setLanguage,t,isRTL\}=useLanguage\(\)/);
 assert.match(screen,/flexDirection:isRTL\?"row-reverse":"row"/);
 assert.match(screen,/textAlign:isRTL\?"right":"left"/);
 const dates=screen.match(/ar-EG-u-ca-gregory/g)||[];
 assert.ok(dates.length>=2,"both session date labels must use the Gregorian calendar");
});

test("incomplete mosque preference data never renders the previous mosque's toggles",()=>{
 assert.match(screen,/delivery\.data\?<\>/);
 assert.match(screen,/const deliveryScope=\[contextVersion,user\?\.id\|\|"guest"/);
 assert.match(screen,/contextChanging\?"switching":"stable"/);
 assert.match(screen,/deliveryGate\.current\.invalidate\(\)/);
 assert.match(screen,/disabled=\{busy\|\|contextChanging\|\|!delivery\.data\}/);
});
