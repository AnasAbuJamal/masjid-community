import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");

test("private inbox pages bind recipient, mosque, cursor and bounded fields",()=>{
 const route=read("staff-web/src/app/api/v1/notifications/route.ts");
 for(const token of [
  "requireMemberContext(req)",
  "userId:user.id,organizationId:org.id",
  "where:{...owner,id:cursor}",
  "CURSOR_UNAVAILABLE",
  "params.getAll(\"cursor\").length>1",
  "PAGE_SIZE=25",
  'orderBy:[{createdAt:"desc"},{id:"desc"}]',
  "select:{id:true,title:true,body:true,createdAt:true,readAt:true}"
 ])assert.ok(route.includes(token),"missing private page rule: "+token);
 assert.ok(!route.includes("db.donation")&&!route.includes("db.student")&&!route.includes("db.guardianLink"));
});
test("native notifications are paginated, context-scoped and read retries are idempotent",()=>{
 const mobile=read("masjid-mobile/app/notifications.tsx");
 const patch=read("staff-web/src/app/api/v1/notifications/[id]/route.ts");
 for(const token of [
  'path=user?.isVerified?"notifications":null',
  "useResource<InboxResponse>(path)",
  "useGatheringPages<Note>(path,contextVersion,data.data)",
  't("inbox.loadMore")','t("inbox.verify")'
 ])assert.ok(mobile.includes(token),"missing inbox screen behavior: "+token);
 assert.ok(!mobile.includes('useResource("me")'));
 assert.ok(patch.includes("readAt:null"));
 assert.ok(patch.includes("findFirst({where:owner"));
 const integ=read("staff-web/scripts/test-notification-scope.mjs");
 assert.ok(integ.includes("older.every(note=>seen.has(note.id))"));
});
