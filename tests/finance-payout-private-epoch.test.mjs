import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync("staff-web/src/app/admin/payouts/page.tsx","utf8");
const route=readFileSync("staff-web/src/app/api/v1/admin/payouts/route.ts","utf8");
function section(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,start+" section present");
 return source.slice(a,b);
}

test("refresh and unmount invalidate previous private payout-page responses",()=>{
 const reload=section(" const reload=useCallback(async()=>{"," async function note(");
 assert.match(reload,/const epoch=\+\+reloadEpoch\.current/);
 assert.match(reload,/setData\(null\);setOlder\(\{\}\);setHistoryLoading\(null\);setError\(""\)/);
 assert.match(reload,/setRegisterLoading\(false\);setBusy\(false\);setDrafts\(\{\}\)/);
 assert.match(reload,/if\(epoch===reloadEpoch\.current\)\{setData\(v\.data\)/);
 assert.match(reload,/if\(epoch===reloadEpoch\.current\)\{[\s\S]*setData\(null\);setError/);
 assert.match(reload,/document\.addEventListener\("visibilitychange",onVisibility\)/);
 assert.match(reload,/document\.removeEventListener\("visibilitychange",onVisibility\)/);
 assert.match(reload,/if\(document\.visibilityState==="hidden"\)/);
 assert.match(reload,/reloadEpoch\.current\+\+;/);
 assert.match(reload,/setData\(null\);setOlder\(\{\}\);setDrafts\(\{\}\);setNotice\(" "\);setError\(" "\)/.source.replaceAll(" ",""));
});

test("historical investigation notes cannot arrive after a later permission refresh",()=>{
 const load=section(" async function loadOlder("," async function loadMorePayouts(");
 assert.match(load,/!data\|\|!data\.payouts\.some\(x=>x\.id===p\.id\)/);
 assert.match(load,/const epoch=reloadEpoch\.current/);
 assert.match(load,/const j=await r\.json\(\);\s*if\(epoch!==reloadEpoch\.current\)return/);
 assert.match(load,/if\(page\.payoutId!==p\.id\|\|page\.reconciliationReady!==false\)/);
 assert.match(load,/if\(epoch===reloadEpoch\.current\)[\s\S]*setError/);
 assert.match(load,/setOlder\(old=>epoch===reloadEpoch\.current\?/);
 assert.match(load,/if\(epoch===reloadEpoch\.current\)setHistoryLoading\(null\)/);
});

test("older payout pages cannot repopulate a reauthorized register",()=>{
 const load=section(" async function loadMorePayouts("," const money=");
 assert.match(load,/const epoch=reloadEpoch\.current/);
 assert.match(load,/const j=await r\.json\(\);\s*if\(epoch!==reloadEpoch\.current\)return/);
 assert.match(load,/page\.reconciliationReady!==false/);
 assert.match(load,/page\.organization\.name!==data\.organization\.name/);
 assert.match(load,/setData\(old=>epoch===reloadEpoch\.current&&old\?/);
 assert.match(load,/if\(epoch===reloadEpoch\.current\)setRegisterLoading\(false\)/);
});

test("finance notes require a verified exception receipt; do not certify bank settlement",()=>{
 const note=section(" async function note("," async function loadOlder(");
 assert.match(note,/const epoch=reloadEpoch\.current/);
 assert.match(note,/if\(epoch!==reloadEpoch\.current\)return/);
 assert.match(note,/v\.data\?\.settlementCertified!==false/);
 assert.match(note,/v\.data\?\.reasonCode!==reasonCode/);
 assert.match(note,/typeof v\.data\?\.noteId!=="string"/);
 assert.match(note,/if\(epoch===reloadEpoch\.current\)setBusy\(false\)/);
 assert.match(source,/Reconciliation: <strong>NOT MATCHED<\/strong>/);
 assert.match(source,/reconciliationReady:false/);
 assert.match(route,/requireVerified\(req,\["admin","finance"\]\)/);
 assert.match(route,/organizationId:org\.id/);
 assert.match(route,/settlementCertified:false/);
 assert.match(route,/new HttpError\(409,"EXCEPTION_ALREADY_RECORDED"/);
});
