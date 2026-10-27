import {NextRequest} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const schema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("budget"),category:z.string().trim().min(3).max(120),
   periodMonth:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),amountMinor:z.number().int().positive().max(1000000000),published:z.boolean().default(false)}),
 z.object({kind:z.literal("expense"),category:z.string().trim().min(3).max(120),description:z.string().trim().min(6).max(1000),
   amountMinor:z.number().int().positive().max(1000000000),incurredOn:z.iso.datetime()}),
 z.object({kind:z.literal("expense-decision"),expenseId:z.string().min(8),decision:z.enum(["approved","rejected"])}),
]);
export async function GET(req:NextRequest){
 return handled(async()=>{
  const user=await requireVerified(req,["admin","finance"]);
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  const [budgets,expenses]=await Promise.all([
   db.financeBudget.findMany({where:{organizationId:org.id},take:100,orderBy:{periodMonth:"desc"}}),
   db.financeExpense.findMany({where:{organizationId:org.id},take:100,orderBy:{createdAt:"desc"},
     select:{id:true,category:true,description:true,amountMinor:true,currency:true,status:true,incurredOn:true,createdAt:true,
      submittedById:true,approvedById:true,submitter:{select:{firstName:true,lastName:true}},approver:{select:{firstName:true,lastName:true}}}})
  ]);
  return ok({budgets,expenses,actorId:user.id,role:user.role,
   caution:"Budgets are allocations, not bank balances. Expenses are not posted to a reconciled accounting ledger."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const user=await requireVerified(req,["admin","finance"]);
  const input=schema.parse(await jsonBody(req));
  const org=await db.organization.findFirst();
  if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
  if(input.kind==="budget"){
   if(input.published&&user.role!=="admin")throw new HttpError(403,"FORBIDDEN","Only administrators may publish budgets.");
   const existing=await db.financeBudget.findUnique({where:{organizationId_category_periodMonth:{organizationId:org.id,category:input.category,periodMonth:input.periodMonth}}});
   if(existing)throw new HttpError(409,"BUDGET_EXISTS","A budget exists for this category and period.");
   const budget=await db.financeBudget.create({data:{organizationId:org.id,category:input.category,periodMonth:input.periodMonth,
    amountMinor:input.amountMinor,published:input.published}});
   await db.auditEvent.create({data:{actorId:user.id,action:"finance.budget.create",entity:"FinanceBudget",entityId:budget.id}});
   return ok({id:budget.id,published:budget.published},201);
  }
  if(input.kind==="expense"){
   const expense=await db.financeExpense.create({data:{organizationId:org.id,category:input.category,description:input.description,
     amountMinor:input.amountMinor,incurredOn:new Date(input.incurredOn),submittedById:user.id}});
   await db.auditEvent.create({data:{actorId:user.id,action:"finance.expense.submit",entity:"FinanceExpense",entityId:expense.id}});
   return ok({id:expense.id,status:expense.status},201);
  }
  const expense=await db.financeExpense.findFirst({where:{id:input.expenseId,organizationId:org.id}});
  if(!expense)throw new HttpError(404,"NOT_FOUND","Expense unavailable.");
  if(expense.submittedById===user.id)throw new HttpError(403,"SEPARATION_OF_DUTIES","A second authorized person must review this expense.");
  const updated=await db.financeExpense.updateMany({where:{id:expense.id,organizationId:org.id,status:"pending"},
    data:{status:input.decision,approvedById:user.id,reviewedAt:new Date()}});
  if(!updated.count)throw new HttpError(409,"ALREADY_REVIEWED","Expense has already been reviewed.");
  await db.auditEvent.create({data:{actorId:user.id,action:"finance.expense."+input.decision,entity:"FinanceExpense",entityId:expense.id}});
  return ok({id:expense.id,status:input.decision});
 });
}
