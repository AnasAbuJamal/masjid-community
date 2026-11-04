import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {scheduleRevisionTime} from "../masjid-mobile/src/schedule-revision-time.ts";
const read=path=>readFileSync(path,"utf8");

// Removing translation wiring or replacing explicit UTC with device-local time
// must fail even when the server's English messages remain available.
test("native identity, recovery, MFA and receipt surfaces have bilingual copy and RTL wiring",async()=>{
 const dictionaryPath="masjid-mobile/src/i18n-account.ts";
 let dictionary="";try{dictionary=read(dictionaryPath);}catch{}
 const screens=["auth.tsx","recover.tsx","mfa.tsx","receipt/[id].tsx"];
 for(const screen of screens){
  const ui=read("masjid-mobile/app/"+screen);
  assert.ok(ui.includes("useLanguage()"),screen+" must use current language");
  assert.ok(ui.includes('textAlign:align'),screen+" must align text for Arabic");
  assert.ok(ui.includes('isRTL?"arrow-right":"arrow-left"'),screen+" back action must follow direction");
  for(const [,key] of ui.matchAll(/t\("(account\.[^"]+)"\)/g)){
   assert.ok(dictionary.includes('"'+key+'":{en:'),"missing bilingual key "+key);
  }
  assert.ok(!ui.includes('e instanceof Error?e.message'),screen+" must localize failures without raw server copy");
 }
 const {accountWords}=await import("../masjid-mobile/src/i18n-account.ts");
 for(const [key,copy] of Object.entries(accountWords)){
  assert.ok(copy.en.trim(),key+" needs English copy");
  assert.match(copy.ar,/[\u0600-\u06ff]/,key+" needs Arabic copy");
 }
 assert.ok(read("masjid-mobile/src/i18n.tsx").includes("...accountWords"));
});

test("receipt timestamp uses the verified owning mosque timezone with explicit UTC fallback",()=>{
 const ui=read("masjid-mobile/app/receipt/[id].tsx");
 assert.ok(ui.includes('scheduleRevisionTime(data.issuedAt,data.organization?.timeZone,language)'));
 assert.ok(ui.includes('scheduleRevisionTime(data.issuedAt,"UTC",language)'));
 assert.ok(ui.includes('t("account.receiptUtc")'));
 assert.ok(ui.includes('t("account.dateUnavailable")'));
 assert.ok(!ui.includes('new Date(data.issuedAt).toLocaleString()'));
 const instant="2026-11-02T23:30:00.000Z";
 for(const language of ["en","ar"]){
  assert.equal(scheduleRevisionTime(instant,"UTC",language),new Intl.DateTimeFormat(language==="ar"?"ar-EG-u-ca-gregory":"en-US",{timeZone:"UTC",dateStyle:"medium",timeStyle:"short"}).format(new Date(instant)));
 }
 assert.equal(scheduleRevisionTime("invalid","UTC","ar"),null);
 assert.equal(scheduleRevisionTime(instant,"Invalid/Mosque","en"),null);
 assert.equal(scheduleRevisionTime(instant,undefined,"ar"),null);
 assert.notEqual(scheduleRevisionTime(instant,"America/New_York","en"),scheduleRevisionTime(instant,"UTC","en"));
});

test("unrecognized receipt status never claims paid or refunded",async()=>{
 let statusKey;try{({receiptStatusKey:statusKey}=await import("../masjid-mobile/src/i18n-account.ts"));}catch{}
 assert.equal(typeof statusKey,"function","explicit receipt state mapper is required");
 assert.equal(statusKey("paid"),"account.receiptPaid");
 assert.equal(statusKey("refunded"),"account.receiptRefunded");
 for(const value of ["pending","PAID",undefined,null,""])assert.equal(statusKey(value),"account.receiptUnknown");
 const ui=read("masjid-mobile/app/receipt/[id].tsx");
 assert.ok(ui.includes("receiptStatusKey(data.status)"));
 assert.ok(ui.includes('{data.description}'),"server receipt description remains unchanged");
 assert.ok(ui.includes("data.amountMinor/100"),"server financial amount remains unchanged");
});
