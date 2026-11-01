import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {contactValidationCode} from "../masjid-mobile/src/contact-form.ts";

const valid={
 name:"Jane Example",email:"jane@example.org",
 subject:"Community inquiry",message:"Please contact me about classes at the mosque."
};

test("contact form aligns its bounded validation with server intake requirements",()=>{
 assert.equal(contactValidationCode(valid),null);
 assert.equal(contactValidationCode({...valid,name:"a"}),"name");
 assert.equal(contactValidationCode({...valid,name:"x".repeat(101)}),"name");
 assert.equal(contactValidationCode({...valid,email:"not-an-email"}),"email");
 assert.equal(contactValidationCode({...valid,email:"x".repeat(250)+"@example.org"}),"email");
 assert.equal(contactValidationCode({...valid,subject:"ab"}),"subject");
 assert.equal(contactValidationCode({...valid,subject:"x".repeat(161)}),"subject");
 assert.equal(contactValidationCode({...valid,message:"too short"}),"message");
 assert.equal(contactValidationCode({...valid,message:"x".repeat(4001)}),"messageTooLong");
 assert.equal(contactValidationCode({
  name:"  Jane Example  ",email:" jane@example.org ",
  subject:"  Community inquiry  ",
  message:"  Please contact me about classes at the mosque.  "
 }),null);
});

test("contact intake never exposes another account's submitted text or late receipt",()=>{
 const source=readFileSync("masjid-mobile/app/contact.tsx","utf8");
 const scope=readFileSync("masjid-mobile/src/usePilotSurface.ts","utf8");
 assert.match(source,/const surface=usePilotSurface\(\)/);
 assert.match(source,/const requestGeneration=useRef\(0\)/);
 assert.match(source,/const currentScope=useRef\(\{version:surface\.contextVersion,allowed:surface\.allowed\}\)/);
 assert.match(source,/\[surface\.contextVersion,surface\.allowed\]/);
 assert.match(source,/setName\(""\)/);
 assert.match(source,/setEmail\(""\)/);
 assert.match(source,/setSubject\(""\)/);
 assert.match(source,/setMessage\(""\)/);
 assert.match(source,/if\(pending\.current\)return/);
 assert.match(source,/version!==currentScope\.current\.version\|\|!currentScope\.current\.allowed/);
 assert.match(source,/if\(response\.received!==true\)throw/);
 assert.match(source,/setSubject\(current=>current\.trim\(\)===submitted\.subject\?"":current\)/);
 assert.match(source,/setMessage\(current=>current\.trim\(\)===submitted\.message\?"":current\)/);
 assert.match(source,/t\("contact\.warning"\)/);
 assert.ok(scope.includes("memberSurfaceScope"),"contact must remain restricted to pilot scope");
});

test("all contact labels, validation hints and warnings have reviewed bilingual values",()=>{
 const code=readFileSync("masjid-mobile/app/contact.tsx","utf8");
 const dictionary=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 for(const key of [
 "eyebrow","title","subtitle","name","email","subject","message",
 "submit","unavailable","failed","sent","warning","checkName",
 "checkEmail","checkSubject","checkMessage","checkMessageTooLong",
 "deliveryNotice"
 ]){
  assert.match(dictionary,new RegExp('"contact\\.'+key+'":\\{en:".+",ar:".+"\\}'),key);
  assert.ok(code.includes('"contact.'+key+'"'),"missing label in UI "+key);
 }
 assert.match(code,/started&&validation&&!error/);
 assert.match(code,/accessibilityRole="alert"/);
});

test("server routes public contact only to the deterministic pilot mosque and preserves rate limit",()=>{
 const server=readFileSync("staff-web/src/app/api/v1/contact/route.ts","utf8");
 assert.match(server,/organization\.findFirst\(\{orderBy:\{createdAt:"asc"\}\}\)/);
 assert.match(server,/assertSameOrigin\(req\)/);
 assert.match(server,/input\.website/);
 assert.match(server,/createdAt:\{gt:new Date\(Date\.now\(\)-10\*60_000\)\}/);
 assert.match(server,/new HttpError\(429,"PLEASE_WAIT"/);
 assert.match(server,/name:z\.string\(\)\.trim\(\)\.min\(2\)\.max\(100\)/);
 assert.match(server,/message:z\.string\(\)\.trim\(\)\.min\(15\)\.max\(4000\)/);
});
