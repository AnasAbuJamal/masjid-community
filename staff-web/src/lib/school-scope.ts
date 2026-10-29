import {Prisma} from "@prisma/client";

// New students have explicit ownership. Existing unowned students require
// positive local school evidence and NO conflicting foreign school evidence.
// Never infer child ownership from an email, name or guardian link alone.
export function schoolStudentScope(organizationId:string):Prisma.StudentWhereInput {
 return {OR:[
  {organizationId},
  {organizationId:null,AND:[
   {OR:[
    {enrollments:{some:{classSection:{program:{organizationId}}}}},
    {applications:{some:{organizationId,status:"approved"}}}
   ]},
   {enrollments:{none:{classSection:{program:{organizationId:{not:organizationId}}}}}},
   {applications:{none:{organizationId:{not:organizationId},status:"approved"}}},
   {invoices:{none:{organizationId:{not:organizationId}}}}
  ]}
 ]};
}
