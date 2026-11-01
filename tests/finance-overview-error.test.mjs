import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const page=readFileSync(new URL("../staff-web/src/app/admin/finance/page.tsx",import.meta.url),"utf8");

test("finance overview hides loading after protected request failure",()=>{
 assert.match(page,/if\(active\)\{setData\(null\);setError\(String\(e\.message\|\|e\)\)\}/);
 assert.match(page,/!data\?\(error\?null:<div className="panel" role="status">Loading protected donation information/);
 assert.match(page,/\{error\?<p className="error" role="alert">\{error\}<\/p>:null\}/);
});

test("finance overview clears errors on successful authorized load",()=>{
 assert.match(page,/if\(active\)\{setError\(""\);setData\(j\.data\)\}/);
 assert.match(page,/if\(!r\.ok\)throw new Error/);
});
