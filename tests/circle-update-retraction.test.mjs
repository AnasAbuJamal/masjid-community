import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("private Circle update retraction is scoped, audited, and body-free",()=>{
 const route=read("staff-web/src/app/api/v1/circles/host/route.ts");
 assert.match(route,/export async function DELETE\(req:NextRequest\)/);
 assert.match(route,/assertSameOrigin\(req\)/);
 assert.match(route,/retract\.parse\(await jsonBody\(req\)\)/);
 assert.match(route,/id:input\.circleId,hostId:actor\.id,organizationId:org\.id,status:"published"/);
 assert.match(route,/id:input\.updateId,circleId:circle\.id/);
 assert.match(route,/action:"circle\.update\.retract"/);
 assert.match(route,/TransactionIsolationLevel\.Serializable/);
 const integration=read("staff-web/scripts/test-circles.mjs");
 assert.match(integration,/forbiddenRetract\.status,404/);
 assert.match(integration,/retracted\.data\.retracted,true/);
 assert.match(integration,/retraction audit must never copy private message body/);
});
test("host UI warns that retraction cannot recall already delivered copies",()=>{
 const ui=read("staff-web/src/app/host/circles/page.tsx");
 assert.match(ui,/window\.confirm\(/);
 assert.match(ui,/Previously delivered copies cannot be recalled/);
 assert.match(ui,/Retract update/);
 assert.match(ui,/method:"DELETE"/);
});
