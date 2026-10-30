import assert from "node:assert/strict";
if(process.env.NODE_ENV==="production"||!process.env.DATABASE_URL?.includes("/masjid_ci"))
 throw Error("Refusing worker authorization test outside isolated CI database.");
const base="http://127.0.0.1:3000/api/internal/notifications";
// With an intentionally simulated worker configured, unauthenticated and
// guessed credentials remain forbidden, never triggering provider activity.
for(const headers of [{},{Authorization:"Bearer malicious"}]){
 const response=await fetch(base,{headers});
 assert.equal(response.status,401,"No worker processing without valid authorization.");
}
assert.equal(process.env.SILA_DELIVERY_CI_CAPTURE,"test-only",
 "Test runner must only simulate in isolated GitHub Actions.");
console.log("Verified worker bearer-secret protection; no actual emails sent.");
