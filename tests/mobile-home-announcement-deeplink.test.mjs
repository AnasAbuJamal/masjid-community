import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("Today mosque announcements open the complete published detail view",()=>{
 const today=readFileSync("masjid-mobile/app/(tabs)/index.tsx","utf8");
 const details=readFileSync("masjid-mobile/app/details/[kind]/[id].tsx","utf8");
 assert.match(today,/data\.announcements\.map\(a=><Card key=\{a\.id\}>/);
 assert.match(today,/<PressRow icon="bullhorn-outline" title=\{a\.title\} subtitle=\{a\.body\}/);
 assert.match(today,/params:\{kind:"announcements",id:a\.id\}/);
 assert.doesNotMatch(today,/numberOfLines=\{3\}>\{a\.body\}/);
 assert.match(details,/\(kind==="announcements"\|\|kind==="articles"\)&&id!=="all"/);
 assert.match(details,/\?itemId="\+encodeURIComponent\(id\)/);
 assert.match(details,/\{item\.description\|\|item\.body\|\|item\.purpose\|\|""\}/);
});

test("guest published content lookup is current-release and tenant scoped",()=>{
 const source=readFileSync("staff-web/src/app/api/v1/public/[resource]/route.ts","utf8");
 const ci=readFileSync("staff-web/scripts/test-public-content-deeplinks.mjs","utf8");
 const workflow=readFileSync(".github/workflows/verify.yml","utf8");
 assert.match(source,/const detailResource=resource==="announcements"\|\|resource==="articles"/);
 assert.match(source,/req\.nextUrl\.searchParams\.getAll\("itemId"\)\.length>1/);
 assert.match(source,/\.\.\.\(itemId\?\{id:itemId\}:\{\}\)/);
 assert.match(source,/if\(itemId&&!data\.length\)throw new HttpError\(404/);
 assert.match(source,/status:"published",publishedAt:\{lte:new Date\(\)\}/);
 assert.match(ci,/for\(const resource of \["announcements","articles"\]\)/);
 assert.match(ci,/draft\.id,scheduled\.id,other\.id/);
 assert.match(ci,/response\.status,404/);
 assert.ok(workflow.includes("node scripts/test-public-content-deeplinks.mjs"));
});
