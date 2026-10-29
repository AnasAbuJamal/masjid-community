import {test} from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
const require=createRequire(import.meta.url);
const buildConfig=require("../masjid-mobile/app.config.js");

test("preview refuses missing, non-HTTPS or credential-bearing API origins",()=>{
 const oldProfile=process.env.EAS_BUILD_PROFILE,oldUrl=process.env.EXPO_PUBLIC_API_URL;
 try{
  process.env.EAS_BUILD_PROFILE="preview";
  for(const url of ["","http://localhost:3000","http://staging.example.org",
   "https://localhost","https://user:secret@staging.example.org",
   "https://staging.example.org/api/v1","https://staging.example.org/?key=token"]){
   process.env.EXPO_PUBLIC_API_URL=url;
   assert.throws(()=>buildConfig({config:{}}),/HTTPS staging API origin/,url);
  }
  process.env.EXPO_PUBLIC_API_URL="https://staging.example.org";
  assert.deepEqual(buildConfig({config:{name:"SILA preview"}}),{name:"SILA preview"});
 }finally{
  if(oldProfile===undefined)delete process.env.EAS_BUILD_PROFILE;else process.env.EAS_BUILD_PROFILE=oldProfile;
  if(oldUrl===undefined)delete process.env.EXPO_PUBLIC_API_URL;else process.env.EXPO_PUBLIC_API_URL=oldUrl;
 }
});
test("Android and iPhone preview profiles are internal-only",()=>{
 const eas=JSON.parse(readFileSync("masjid-mobile/eas.json","utf8"));
 assert.equal(eas.build.preview.distribution,"internal");
 assert.equal(eas.build.preview.android.buildType,"apk");
 assert.equal(eas.build.preview.ios.simulator,false);
 assert.equal(eas.build.preview.environment,"preview");
 assert.equal(eas.build.preview.autoSubmit,undefined);
});
