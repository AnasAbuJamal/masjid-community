import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseQiblaCoordinates} from "../masjid-mobile/src/qibla-input.ts";
import {bearingToKaaba} from "../masjid-mobile/src/qibla.ts";

test("permission-free decimal coordinates work in English and Arabic numeral systems",()=>{
 assert.deepEqual(parseQiblaCoordinates("42.3601","-71.0589"),
  {latitude:42.3601,longitude:-71.0589});
 assert.deepEqual(parseQiblaCoordinates(" ٤٢٫٣٦٠١ ","−٧١٫٠٥٨٩"),
  {latitude:42.3601,longitude:-71.0589});
 assert.deepEqual(parseQiblaCoordinates("۴۲.۳۶۰۱","-۷۱.۰۵۸۹"),
  {latitude:42.3601,longitude:-71.0589});
 assert.deepEqual(parseQiblaCoordinates("+90","-180"),
  {latitude:90,longitude:-180});
 assert.deepEqual(parseQiblaCoordinates("-.5",".25"),
  {latitude:-0.5,longitude:0.25});
});

test("manual coordinate fields reject invalid, ambiguous or injected data",()=>{
 const invalid=[
  ["","-70"],["42",""],["90.00001","-70"],["42","180.1"],
  ["Infinity","0"],["NaN","0"],["4e1","5"],["42,5","71"],
  ["42.34 71.2","0"],["42° 12'","-70"],["<script>","0"],
  ["42.12345678","-71"],["0","-181"],["91","0"],
  ["12.3.4","-71"],["--12","-71"],["12\n4","-71"]
 ];
 for(const [latitude,longitude] of invalid){
  assert.equal(parseQiblaCoordinates(latitude,longitude),null,
   "rejected "+JSON.stringify([latitude,longitude]));
 }
});

test("great-circle bearing is finite, geographic and not invented at degenerate points",()=>{
 const boston=bearingToKaaba(42.3601,-71.0589);
 const london=bearingToKaaba(51.5074,-0.1278);
 assert.ok(Number.isFinite(boston)&&boston>=0&&boston<360);
 assert.ok(Number.isFinite(london)&&london>=0&&london<360);
 assert.notEqual(boston,london);
 assert.throws(()=>bearingToKaaba(21.4225,39.8262),/undefined/);
 assert.throws(()=>bearingToKaaba(-21.4225,-140.1738),/undefined/);
 assert.throws(()=>bearingToKaaba(91,0),/Invalid location/);
});

test("actual native screen has both private coordinate fallback and stale GPS response guard",()=>{
 const source=readFileSync("masjid-mobile/app/qibla.tsx","utf8");
 assert.match(source,/useLanguage\(\)/);
 assert.match(source,/parseQiblaCoordinates\(latitude,longitude\)/);
 assert.match(source,/Location\.requestForegroundPermissionsAsync\(\)/);
 assert.match(source,/if\(mine!==attempt\.current\)return/);
 assert.match(source,/attempt\.current\+\+/);
 assert.match(source,/onPress=\{calculateManually\}/);
 assert.match(source,/keyboardType="numbers-and-punctuation"/);
 assert.match(source,/accessibilityLiveRegion="polite"/);
 assert.match(source,/t\("qibla\.permissionDenied"\)/);
 assert.match(source,/t\("qibla\.invalidCoordinates"\)/);
 assert.doesNotMatch(source,/\bfetch\(|\bapiPost\(|SecureStore|AsyncStorage/,
  "typed coordinates must never be transmitted or persisted by this screen");
});

test("direct Today Qibla action opens Qibla screen, with bilingual interface",()=>{
 const today=readFileSync("masjid-mobile/app/(tabs)/index.tsx","utf8");
 const words=readFileSync("masjid-mobile/src/i18n.tsx","utf8");
 assert.match(today,/<PressRow icon="hands-pray" title=\{t\("home\.qibla"\)\} subtitle=\{t\("home\.qiblaSubtitle"\)\} onPress=\{\(\)=>router\.push\("\/qibla"\)\}/);
 for(const key of ["title","subtitle","bearing","useLocation","permissionDenied",
  "locationError","manualHeading","manualHelp","latitude","longitude",
  "manualAction","invalidCoordinates","undefinedBearing","sourceDevice",
  "sourceManual","bearingDescription","caution"]){
  assert.match(words,new RegExp('"qibla\\.'+key+'":\\{en:".+",ar:".+"\\}'),
   "English and Arabic label required for "+key);
 }
});
