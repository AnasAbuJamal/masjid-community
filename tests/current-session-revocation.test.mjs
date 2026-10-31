import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");

test("account reports only current active session and revocation audits atomically",()=>{
 const account=read("staff-web/src/app/api/v1/account/route.ts");
 const revoke=read("staff-web/src/app/api/v1/account/sessions/[id]/route.ts");
 for(const token of ["select:{id:true,userId:true,selectedOrganizationId:true}",
  "SESSION_EXPIRED","currentSessionId:session.id"]){
  assert.ok(account.includes(token),token);
 }
 for(const token of ["userId:user.id,revokedAt:null","db.$transaction",
  "account.session.revoke","tx.auditEvent.create"]){
  assert.ok(revoke.includes(token),token);
 }
 assert.ok(!revoke.includes("tokenHash:"),"audit must not include bearer token hashes");
});
test("self-revocation purges native credentials and private screen context",()=>{
 const screen=read("masjid-mobile/app/settings.tsx");
 const session=read("masjid-mobile/src/session.tsx");
 for(const token of ["id===result.data?.currentSessionId","await logout()",
  'router.replace("/(tabs)/profile")',"settings.selfRevokeTitle","settings.currentDevice"]){
  assert.ok(screen.includes(token),token);
 }
 for(const token of ["await clearToken()","setUser(null)","setContextVersion(v=>v+1)"]){
  assert.ok(session.includes(token),token);
 }
 assert.ok(read("staff-web/scripts/test-auth.mjs").includes("revokedAudit.length,2"));
});
