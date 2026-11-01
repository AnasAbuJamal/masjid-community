import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const page=readFileSync(new URL("../staff-web/src/app/admin/payouts/page.tsx",import.meta.url),"utf8");

test("private payout register is cleared during access revalidation and on failure",()=>{
 assert.match(page,/const epoch=\+\+reloadEpoch\.current;/);
 assert.match(page,/setData\(null\);setOlder\(\{\}\);setHistoryLoading\(null\);setError\(""\);/);
 assert.match(page,/if\(epoch===reloadEpoch\.current\)\{setData\(v\.data\);setError\(""\);\}/);
 assert.match(page,/catch\(e\)\{if\(epoch===reloadEpoch\.current\)\{/);
 assert.match(page,/setData\(null\);setError\(e instanceof Error/);
});
