import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCredentialAuthority} from "../masjid-mobile/src/credential-authority.ts";
const deferred=()=>{
 let resolve;let reject;
 const promise=new Promise((res,rej)=>{resolve=res;reject=rej});
 return {promise,resolve,reject};
};
const store=()=>{
 let value=null;
 return {
  getItemAsync:async()=>value,
  setItemAsync:async(_key,next)=>{value=next},
  deleteItemAsync:async()=>{value=null},
  read:()=>value
 };
};
test("late secure credential read cannot restore a token after local logout",async()=>{
 const db=store();const gate=deferred();db.getItemAsync=async()=>gate.promise;
 const credentials=createCredentialAuthority(db,"masjid.session");
 const pending=credentials.token();
 await credentials.clear();
 gate.resolve("prior-private-token");
 assert.equal(await pending,null);
 assert.equal(await credentials.token(),null);
});
test("held earlier write and clear cannot overwrite a newer login token",async()=>{
 const db=store();const held=deferred();const started=deferred();
 db.setItemAsync=async(_key,value)=>{
  if(value==="old-token"){started.resolve();await held.promise}
  db._saved=value;
 };
 db.deleteItemAsync=async()=>{db._saved=null};
 const credentials=createCredentialAuthority(db,"masjid.session");
 const old=credentials.set("old-token");await started.promise;
 const clearing=credentials.clear();
 const newest=credentials.set("new-token");
 held.resolve();await Promise.all([old,clearing,newest]);
 assert.equal(db._saved,"new-token");
 assert.equal(await credentials.token(),"new-token");
});
test("failed token persistence cannot leave a usable in-memory session",async()=>{
 const db=store();db.setItemAsync=async()=>{throw new Error("secure storage unavailable")};
 const credentials=createCredentialAuthority(db,"masjid.session");
 await assert.rejects(credentials.set("invalid-signin-token"),/secure storage unavailable/);
 assert.equal(await credentials.token(),null);
});
test("logout captures the prior bearer without selecting a newer login token",async()=>{
 const db=store();const credentials=createCredentialAuthority(db,"masjid.session");
 await credentials.set("old-token");
 assert.equal(await credentials.capture(),"old-token");
 const prior=credentials.capture();await credentials.clear();
 assert.equal(await prior,"old-token");
 await credentials.set("new-token");
 assert.equal(await credentials.capture(),"new-token");
});
test("native auth transports and provider discard old responses and clear UI before remote logout",()=>{
 const src=readFileSync("masjid-mobile/src/session.tsx","utf8");
 const api=readFileSync("masjid-mobile/src/api.ts","utf8");
 for(const token of [
  "const operation=useRef(0)",
  "generation===operation.current",
  "generation!==operation.current",
  "setUser(null);setLoading(false);setContextVersion(v=>v+1)",
  "const persistedRemoval=clearToken()",
  "void previous.then(saved=>revokeCapturedBearer(saved))",
  "await persistedRemoval"
 ])assert.ok(src.includes(token),"Missing session race safeguard: "+token);
 const logoutStart=src.indexOf(" const logout=async()=>");
 assert.ok(logoutStart>0);
 const logoutEnd=src.indexOf(" const selectOrganization=",logoutStart);
 const logout=src.slice(logoutStart,logoutEnd);
 assert.ok(logout.indexOf("setUser(null)")<logout.indexOf("await persistedRemoval"),
  "Private UI must be removed before awaiting secure storage or revocation");
 for(const token of [
  "createCredentialAuthority(SecureStore,tokenKey)",
  "const revision=authority.version()",
  "check(revision)",
  "const saved=await token()",
  "revokeCapturedBearer(saved:string|null)",
  "export async function apiCalendar("
 ])assert.ok(api.includes(token),"Missing native transport guard: "+token);
 assert.ok(!api.includes("export async function setToken(value:string){return SecureStore.setItemAsync"));
});
