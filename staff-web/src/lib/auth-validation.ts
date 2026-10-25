import { z } from "zod";
export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(1).max(128),
});
export const registrationSchema = loginSchema.extend({
    password: z.string().min(8).max(128),
    firstName: z.string().trim().min(2).max(100),
    lastName: z.string().trim().min(2).max(100),
});
export const profileSchema = z.object({
    firstName: z.string().trim().min(2).max(100).optional(),
    lastName: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().max(30).nullable().optional(),
}).strict();
