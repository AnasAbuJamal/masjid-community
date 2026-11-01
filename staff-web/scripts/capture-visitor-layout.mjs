// A real Chromium capture of the rendered, database-backed SILA public site.
// Runs ONLY against GitHub Actions' explicitly disposable PostgreSQL schema.
// Screenshots contain no logins, tokens, private account data or child records.
import {strict as assert} from "node:assert";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {chromium} from "playwright";

const expectedDatabase="postgresql://masjid_ci:ci_only_password@127.0.0.1:5432/masjid_ci";
if(process.env.GITHUB_ACTIONS!=="true"||
   process.env.DATABASE_URL!==expectedDatabase||
   process.env.NODE_ENV==="production"||
   process.env.VERCEL)
 throw Error("Refusing screenshot capture outside disposable GitHub Actions CI.");
const base="http://127.0.0.1:3000",dir=resolve("visual-artifacts");
await mkdir(dir,{recursive:true});
const checks=[];
let browser;
try{
 try{browser=await chromium.launch({channel:"chrome",headless:true,args:["--no-sandbox"]});}
 catch{browser=await chromium.launch({headless:true,args:["--no-sandbox"]});}
 const variants=[
  {lang:"en",kind:"phone",width:390,height:844},
  {lang:"ar",kind:"phone",width:390,height:844},
  {lang:"en",kind:"desktop",width:1440,height:900},
  {lang:"ar",kind:"desktop",width:1440,height:900}
 ];
 let publishedDetail=null;
 for(const item of variants){
  const context=await browser.newContext({viewport:{width:item.width,height:item.height},
   deviceScaleFactor:1,isMobile:item.kind==="phone",hasTouch:item.kind==="phone",
   reducedMotion:"reduce"});
  const page=await context.newPage();
  try{
   const path="/visit"+(item.lang==="ar"?"?lang=ar":"");
   const response=await page.goto(base+path,{waitUntil:"networkidle",timeout:30000});
   assert.equal(response?.status(),200,"Guest page must render without Vercel or app login.");
   const main=page.locator("main.visit");
   await main.waitFor({state:"visible"});
   assert.equal(await main.getAttribute("lang"),item.lang);
   assert.equal(await main.getAttribute("dir"),item.lang==="ar"?"rtl":"ltr");
   assert.ok(await page.locator("#prayers").isVisible(),"Published prayer section must be present");
   assert.ok(await page.locator("#gatherings").isVisible(),"Published gatherings section must be present");
   assert.ok(await page.getByRole("link",{name:"العربية"}).count(),"Visible Arabic language control required");
   const disclosure=page.locator("details.visit-filters-disclosure");
   assert.equal(await disclosure.count(),1);
   assert.equal(await disclosure.evaluate(element=>element.open),false,
    "Unfiltered public pages should prioritize gathering results over controls.");
   await disclosure.locator("summary").click();
   assert.equal(await disclosure.evaluate(element=>element.open),true);
   assert.ok(await page.locator('input[name="gatherQ"]').isVisible());
   await disclosure.locator("summary").click();
   assert.equal(await disclosure.evaluate(element=>element.open),false);
   if(item.lang==="ar")
    assert.ok(await page.getByRole("heading",{name:"مواقيت الصلاة"}).isVisible(),
     "Arabic visitor page must render actual Arabic prayer labels");
   else
    assert.ok(await page.getByRole("heading",{name:"Prayer times"}).isVisible());
   const horizontalOverflow=await page.evaluate(
    ()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth
   );
   const screenshot="visit-"+item.kind+"-"+item.lang+".png";
   await page.screenshot({path:resolve(dir,screenshot),fullPage:true,animations:"disabled"});
   checks.push({page:path,width:item.width,language:item.lang,horizontalOverflow,screenshot});
   assert.ok(horizontalOverflow<=3,
    "Visitor layout must not scroll horizontally at "+item.width+"px in "+item.lang+
    " (overflow "+horizontalOverflow+"px). Screenshot captured for debugging.");
   if(item.kind==="phone"&&item.lang==="en"){
    publishedDetail=await page.locator('a[href^="/visit/content/gatherings/"]').first().getAttribute("href");
    assert.ok(publishedDetail?.startsWith("/visit/content/gatherings/"),
     "Published gathering should have an inspectable public detail route.");
   }
   if(item.kind==="phone"&&publishedDetail){
    const detail=item.lang==="ar"?publishedDetail+(publishedDetail.includes("?")?"&":"?")+"lang=ar":publishedDetail;
    const detailResponse=await page.goto(base+detail,{waitUntil:"networkidle",timeout:30000});
    assert.equal(detailResponse?.status(),200,"Public gathering detail must render.");
    assert.equal(await page.locator("main.visit").getAttribute("dir"),
     item.lang==="ar"?"rtl":"ltr");
    const detailOverflow=await page.evaluate(
     ()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth
    );
    const detailShot="visit-detail-phone-"+item.lang+".png";
    await page.screenshot({path:resolve(dir,detailShot),fullPage:true,animations:"disabled"});
    checks.push({page:detail,width:item.width,language:item.lang,horizontalOverflow:detailOverflow,screenshot:detailShot});
    assert.ok(detailOverflow<=3,
     "Public event detail overflows phone viewport ("+item.lang+"): "+detailOverflow+"px.");
   }
  }finally{await context.close();}
 }
 console.log("Captured six synthetic guest UI snapshots with verified visible, non-overflowing bilingual pages.");
}finally{
 await writeFile(resolve(dir,"report.json"),JSON.stringify({disposableCI:true,checks},null,2));
 await browser?.close();
}
