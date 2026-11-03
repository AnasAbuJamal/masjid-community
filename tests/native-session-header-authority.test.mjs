import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {sessionHeaders} from "../masjid-mobile/src/session-headers.ts";

test("caller-supplied Authorization cannot replace current session bearer",()=>{
 for(const input of [
  {authorization:"Bearer previous-account","X-Trace":"123"},
  new Headers([["AUTHORIZATION","Bearer previous-account"],["X-Trace","123"]]),
  [["Authorization","Bearer previous-account"],["X-Trace","123"]]
 ]){
  const h=sessionHeaders(input,"current-account",true);
  assert.equal(h.get("authorization"),"Bearer current-account");
  assert.equal(h.get("x-trace"),"123");
  assert.equal(h.get("accept"),"application/json");
  assert.equal(h.get("content-type"),"application/json");
 }
});
test("signed-out requests cannot carry caller-injected authentication",()=>{
 const h=sessionHeaders({Authorization:"Bearer stolen",Accept:"text/plain"},null,false);
 assert.equal(h.has("authorization"),false);
 assert.equal(h.get("accept"),"text/plain");
 assert.equal(h.has("content-type"),false);
});
test("transport preserves custom headers and explicit body type",()=>{
 const h=sessionHeaders({"Content-Type":"application/merge-patch+json","X-Request-ID":"abc"},"signed-in",true);
 assert.equal(h.get("content-type"),"application/merge-patch+json");
 assert.equal(h.get("x-request-id"),"abc");
 assert.equal(h.get("authorization"),"Bearer signed-in");
});
test("both authenticated and anonymous JSON transport use protected header builder",()=>{
 const source=readFileSync("masjid-mobile/src/api.ts","utf8");
 assert.match(source,/const headers=sessionHeaders\(options\.headers,saved,!!options\.body\)/);
 assert.match(source,/\.\.\.options,headers/);
 assert.doesNotMatch(source,/\.\.\.options\.headers/);
});
