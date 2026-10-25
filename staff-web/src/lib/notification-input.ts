import { z } from 'zod';
export const notificationId = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const notificationQuery = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.enum(['true', 'false']).default('false'),
});
export const notificationMutation = z.union([
  z.object({ markAllRead: z.literal(true) }).strict(),
  z.object({ id: notificationId }).strict(),
]);
