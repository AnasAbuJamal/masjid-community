import {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireVerified} from "@/lib/auth";
import {appendIntegrityAudit} from "@/lib/integrity-audit";
import {assertSameOrigin,handled,HttpError,jsonBody,ok} from "@/lib/http";
const schema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("budget"),category:z.string().trim().min(3).max(120),
   periodMonth:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
   amountMinor:z.number().int().positive().max(1000000000),
   published:z.boolean().default(false)}).strict(),
 z.object({kind:z.literal("expense"),category:z.string().trim().min(3).max(120),
   description:z.string().trim().min(6).max(1000),
   amountMinor:z.number().int().positive().max(1000000000),
   incurredOn:z.iso.datetime()}).strict(),
 z.object({kind:z.literal("expense-decision"),expenseId:z.string().min(8).max(128),
   decision:z.enum(["approved","rejected"])}).strict()
]);
const cursor=z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/);
const PAGE_SIZE=100;
async function scope(req:NextRequest){
 const user=await requireVerified(req,["admin","finance"]);
 const org=await db.organization.findFirst({orderBy:[{createdAt:"asc"},{id:"asc"}],select:{id:true}});
 if(!org)throw new HttpError(503,"NOT_CONFIGURED","Organization unavailable.");
 return {user,org};
}
export async function GET(req:NextRequest){
 return handled(async()=>{
  const {user,org}=await scope(req);
  const query=req.nextUrl.searchParams;
  if([...query.keys()].some(k=>!["budgetCursor","expenseCursor"].includes(k))||
   ["budgetCursor","expenseCursor"].some(k=>query.getAll(k).length>1)||
   (query.has("budgetCursor")&&query.has("expenseCursor")))
   throw new HttpError(422,"BAD_QUERY","Unsupported or repeated financial register cursor.");
  const budgetCursor=query.has("budgetCursor")?cursor.parse(query.get("budgetCursor")):null;
  const expenseCursor=query.has("expenseCursor")?cursor.parse(query.get("expenseCursor")):null;
  const budgetAnchor=budgetCursor?await db.financeBudget.findFirst({
   where:{id:budgetCursor,organizationId:org.id},select:{id:true,periodMonth:true}
  }):null;
  if(budgetCursor&&!budgetAnchor)throw new HttpError(404,"BUDGET_CURSOR_UNAVAILABLE",
   "This finance budget cursor is unavailable.");
  const expenseAnchor=expenseCursor?await db.financeExpense.findFirst({
   where:{id:expenseCursor,organizationId:org.id},select:{id:true,createdAt:true}
  }):null;
  if(expenseCursor&&!expenseAnchor)throw new HttpError(404,"EXPENSE_CURSOR_UNAVAILABLE",
   "This finance expense cursor is unavailable.");
  const [budgetRows,expenseRows]=await Promise.all([
   expenseCursor?Promise.resolve([]):db.financeBudget.findMany({
    where:{organizationId:org.id,...(budgetAnchor?{OR:[
     {periodMonth:{lt:budgetAnchor.periodMonth}},
     {periodMonth:budgetAnchor.periodMonth,id:{lt:budgetAnchor.id}}
    ]}:{})},
    take:PAGE_SIZE+1,orderBy:[{periodMonth:"desc"},{id:"desc"}]
   }),
   budgetCursor?Promise.resolve([]):db.financeExpense.findMany({
    where:{organizationId:org.id,...(expenseAnchor?{OR:[
     {createdAt:{lt:expenseAnchor.createdAt}},
     {createdAt:expenseAnchor.createdAt,id:{lt:expenseAnchor.id}}
    ]}:{})},
    take:PAGE_SIZE+1,orderBy:[{createdAt:"desc"},{id:"desc"}],
    select:{id:true,category:true,description:true,amountMinor:true,currency:true,
     status:true,incurredOn:true,createdAt:true,
     submittedById:true,approvedById:true,
     submitter:{select:{firstName:true,lastName:true}},
     approver:{select:{firstName:true,lastName:true}}}
   })
  ]);
  const budgets=budgetRows.slice(0,PAGE_SIZE);
  const expenses=expenseRows.slice(0,PAGE_SIZE);
  return ok({budgets,expenses,actorId:user.id,role:user.role,pageSize:PAGE_SIZE,
   budgetComplete:budgetRows.length<=PAGE_SIZE,
   nextBudgetCursor:budgetRows.length>PAGE_SIZE?budgets.at(-1)!.id:null,
   expenseComplete:expenseRows.length<=PAGE_SIZE,
   nextExpenseCursor:expenseRows.length>PAGE_SIZE?expenses.at(-1)!.id:null,
   caution:"Budgets are allocations, not bank balances. Reviewed expenses are NOT bank payments or entries in a reconciled accounting ledger. Every write and decision is sealed-audited."});
 });
}
export async function POST(req:NextRequest){
 return handled(async()=>{
  assertSameOrigin(req);
  const {user,org}=await scope(req);
  const input=schema.parse(await jsonBody(req));
  try{
   const result=await db.$transaction(async tx=>{
    if(input.kind==="budget"){
     if(input.published&&user.role!=="admin")
      throw new HttpError(403,"FORBIDDEN","Only administrators may publish budgets.");
     const existing=await tx.financeBudget.findUnique({where:{
      organizationId_category_periodMonth:{
       organizationId:org.id,category:input.category,periodMonth:input.periodMonth}
     },select:{id:true}});
     if(existing)throw new HttpError(409,"BUDGET_EXISTS",
      "A budget exists for this category and period.");
     const budget=await tx.financeBudget.create({data:{
      organizationId:org.id,category:input.category,periodMonth:input.periodMonth,
      amountMinor:input.amountMinor,published:input.published
     }});
     await tx.auditEvent.create({data:{actorId:user.id,
      action:"finance.budget.create",entity:"FinanceBudget",entityId:budget.id}});
     await appendIntegrityAudit(tx,{request:req,organizationId:org.id,actorId:user.id,
      action:"finance.budget.create",entity:"FinanceBudget",entityId:budget.id,
      evidence:{scope:"organization",to:input.published?"published_allocation":"draft_allocation"}});
     return {id:budget.id,published:budget.published};
    }
    if(input.kind==="expense"){
     const expense=await tx.financeExpense.create({data:{
      organizationId:org.id,category:input.category,description:input.description,
      amountMinor:input.amountMinor,incurredOn:new Date(input.incurredOn),
      submittedById:user.id
     }});
     await tx.auditEvent.create({data:{actorId:user.id,
      action:"finance.expense.submit",entity:"FinanceExpense",entityId:expense.id}});
     await appendIntegrityAudit(tx,{request:req,organizationId:org.id,actorId:user.id,
      action:"finance.expense.submit",entity:"FinanceExpense",entityId:expense.id,
      evidence:{scope:"organization",to:"pending"}});
     return {id:expense.id,status:expense.status};
    }
    const expense=await tx.financeExpense.findFirst({where:{
     id:input.expenseId,organizationId:org.id
    },select:{id:true,status:true,submittedById:true}});
    if(!expense)throw new HttpError(404,"NOT_FOUND","Expense unavailable.");
    if(expense.submittedById===user.id)
     throw new HttpError(403,"SEPARATION_OF_DUTIES",
      "A second authorized person must review this expense.");
    if(expense.status!=="pending")
     throw new HttpError(409,"ALREADY_REVIEWED","Expense already reviewed.");
    const updated=await tx.financeExpense.updateMany({where:{
     id:expense.id,organizationId:org.id,status:"pending"
    },data:{status:input.decision,approvedById:user.id,reviewedAt:new Date()}});
    if(updated.count!==1)
     throw new HttpError(409,"ALREADY_REVIEWED",
      "Expense was already changed by another reviewer.");
    await tx.auditEvent.create({data:{actorId:user.id,
     action:"finance.expense."+input.decision,entity:"FinanceExpense",entityId:expense.id}});
    await appendIntegrityAudit(tx,{request:req,organizationId:org.id,actorId:user.id,
     action:"finance.expense."+input.decision,entity:"FinanceExpense",entityId:expense.id,
     evidence:{scope:"organization",from:"pending",to:input.decision}});
    return {id:expense.id,status:input.decision};
   },{isolationLevel:"Serializable"});
   return ok(result,input.kind==="expense-decision"?200:201);
  }catch(error){
   if(error instanceof Prisma.PrismaClientKnownRequestError){
    if(error.code==="P2002")throw new HttpError(409,"BUDGET_EXISTS",
     "This budget category and period is already allocated.");
    if(error.code==="P2034")throw new HttpError(409,"FINANCE_CONFLICT",
     "Another reviewer changed financial work. Refresh before retrying.");
   }
   throw error;
  }
 });
}
