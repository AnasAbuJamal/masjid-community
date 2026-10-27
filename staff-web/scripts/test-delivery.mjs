import assert from "node:assert/strict";
if(process.env.NODE_ENV==="production"||!process.env.DATABASE_URL?.includes("masjid_ci"))throw Error("Refusing production notification test.");
const base="http://127.0.0.1:3000/api/internal/notifications";
const response=await fetch(base);
assert.equal(response.status,503,"Worker must not send mail without a configured secret.");
const fake=await fetch(base,{headers:{Authorization:"Bearer malicious"}});
assert.equal(fake.status,503,"Invalidly configured worker must not send any notifications.");
console.log("Verified no unauthenticated or unconfigured background delivery.");
