import type {UserRole} from "@prisma/client";

// A historical guardian link or teacher assignment cannot override a
// CURRENT role change. Students retain access to their OWN student records.
export const mayViewGuardianRecords=(role:UserRole)=>role!=="student";
export const mayViewTeacherRosters=(role:UserRole)=>
 role==="teacher"||role==="admin";
