// Real HTTP security smoke against ephemeral CI Postgres and a local-only web server.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHmac} from "node:crypto";
if(process.env.NODE_ENV==="production"||!process.env.DATABASE_URL?.includes("masjid_ci"))
 throw Error("Refusing auth integration test outside isolated CI database.");
const {adminEmail,memberEmail,password}=JSON.parse(readFileSync("/tmp/masjid-ci-accounts.json","utf8"));
const host="http://127.0.0.1:3000/api/v1/";
async function request(path,method="GET",body,token){
 const response=await fetch(host+path,{method,headers:{...(token?{Authorization:"Bearer "+token}:{}),...(body?{"Content-Type":"application/json"}:{})},
  body:body?JSON.stringify(body):undefined});
 const value=await response.json().catch(()=>({}));
 return {status:response.status,...value};
}
function totp(secret,step=Math.floor(Date.now()/30000)){
 const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
 let value=0,bits=0;const bytes=[];
 for(const c of secret){const n=chars.indexOf(c);assert.ok(n>=0);value=(value<<5)|n;bits+=5;if(bits>=8){bits-=8;bytes.push((value>>>bits)&255);}}
 const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(step));
 const h=createHmac("sha1",Buffer.from(bytes)).update(counter).digest(),off=h[19]&15;
 return ((h.readUInt32BE(off)&0x7fffffff)%1_000_000).toString().padStart(6,"0");
}
const admin=await request("auth/login","POST",{email:adminEmail,password});
assert.equal(admin.status,200,"admin can sign in with credentials");
assert.equal(admin.data.user.mfaRequired,true,"admin must satisfy MFA");
assert.equal(admin.data.user.mfaSetupRequired,true,"new admin must enroll");
const blocked=await request("admin","GET",null,admin.data.token);
assert.equal(blocked.status,403,"no privileged data before MFA");
assert.equal(blocked.error.code,"MFA_REQUIRED");
const weak=await request("auth/mfa-setup","POST",{password:"incorrect-password"},admin.data.token);
assert.equal(weak.status,401,"enrollment requires current password");
const setup=await request("auth/mfa-setup","POST",{password},admin.data.token);
assert.equal(setup.status,200,"enrollment starts after password recheck");
assert.match(setup.data.secret,/^[A-Z2-7]{32}$/);
const otp=totp(setup.data.secret);
const invalid=await request("auth/mfa-enable","POST",{code:otp.slice(0,5)+(otp[5]==="0"?"1":"0")},admin.data.token);
assert.equal(invalid.status,422,"wrong authenticator code rejected");
const enabled=await request("auth/mfa-enable","POST",{code:otp},admin.data.token);
assert.equal(enabled.status,200,"valid authenticator enrolled");
const allowed=await request("admin","GET",null,admin.data.token);
assert.equal(allowed.status,200,"MFA-verified session can enter admin");
const another=await request("auth/login","POST",{email:adminEmail,password});
assert.equal(another.status,200);
assert.equal(another.data.user.mfaSetupRequired,false);
const secondBlocked=await request("admin","GET",null,another.data.token);
assert.equal(secondBlocked.status,403,"other session must separately authenticate");
const replay=await request("auth/mfa-verify","POST",{code:otp},another.data.token);
assert.equal(replay.status,409,"already used code cannot authorize another session");
const member=await request("auth/login","POST",{email:memberEmail,password});
assert.equal(member.status,200);
assert.equal(member.data.user.mfaRequired,false,"ordinary members can sign in without privileged MFA");
const memberForbidden=await request("admin","GET",null,member.data.token);
assert.equal(memberForbidden.status,403,"member must not be able to read admin data");
console.log("Verified admin MFA setup, privileged gate, replay rejection, independent sessions, member role denial.");
