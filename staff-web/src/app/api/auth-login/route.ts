// Legacy mobile login alias; delegates to the same verified flow.
// Keeping this endpoint avoids a second inconsistent authentication implementation.
export { POST } from "@/app/api/auth/login/route";
