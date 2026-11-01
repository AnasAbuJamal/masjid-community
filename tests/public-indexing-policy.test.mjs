import {test} from "node:test";
import assert from "node:assert/strict";
import {publicIndexOrigin,publicIndexPath} from "../staff-web/src/lib/public-indexing.ts";

test("search indexing is disabled unless mosque owner explicitly enables it", () => {
 assert.equal(publicIndexOrigin(undefined,"https://mosque.example"),null);
 assert.equal(publicIndexOrigin("false","https://mosque.example"),null);
 assert.equal(publicIndexOrigin("true",undefined),null);
 assert.equal(publicIndexOrigin("true","https://mosque.example"),"https://mosque.example");
 assert.equal(publicIndexOrigin("true","http://127.0.0.1:3000"),"http://127.0.0.1:3000");
});

test("canonical origin rejects path, credentials, query, fragments and insecure remote URLs", () => {
 for (const url of [
  "http://mosque.example", "https://a:b@mosque.example", "https://mosque.example/admin",
  "https://mosque.example/?x=1", "https://mosque.example/#private",
  "javascript:alert(1)", "https://mosque.example/visit", " https://mosque.example",
  "http://192.168.1.1", "//other.example"
 ]) assert.equal(publicIndexOrigin("true",url),null,url);
});

test("only known public content types with safe record IDs can be indexed", () => {
 assert.equal(publicIndexPath("gatherings","clsample_id123"),"/visit/content/gatherings/clsample_id123");
 assert.equal(publicIndexPath("faith","12345678"),"/visit/content/faith/12345678");
 for (const kind of ["users","admin","care","student","/gatherings"]) {
  assert.equal(publicIndexPath(kind,"clsample_id123"),null);
 }
 for (const id of ["../private", "short", "x/y", "abc?secret=1", "a".repeat(129)]) {
  assert.equal(publicIndexPath("learning",id),null);
 }
});
