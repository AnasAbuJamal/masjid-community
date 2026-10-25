import { ProposalStatus } from '@prisma/client';
import { z } from 'zod';
export const publicProposalStatuses: ProposalStatus[] = ['pending', 'approved', 'in_progress', 'completed'];
export const proposalIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const commentSchema = z.object({ message: z.string().trim().min(1).max(5000) });
export const proposalInput = z.object({
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(20).max(20000),
  summary: z.string().trim().min(1).max(500).optional(),
  totalBudget: z.number().finite().min(0).max(100000000).optional(),
  estimatedDuration: z.string().trim().min(1).max(200).optional(),
  objectives: z.array(z.string().trim().min(1).max(1000)).max(50).optional(),
  resourcesNeeded: z.array(z.string().trim().min(1).max(1000)).max(50).optional(),
  skillsRequired: z.array(z.string().trim().min(1).max(1000)).max(50).optional(),
  successMetrics: z.array(z.string().trim().min(1).max(1000)).max(50).optional(),
  timeline: z.array(z.record(z.string(), z.json())).max(50).optional(),
  volunteersNeeded: z.number().int().min(0).max(100000).optional(),
  submitterPhone: z.string().max(40).optional(),
  fundingSource: z.string().max(1000).optional(),
  isFundingSecured: z.boolean().optional(),
  targetAudience: z.string().max(2000).optional(),
  expectedImpact: z.string().max(5000).optional(),
  communityNeed: z.string().max(5000).optional(),
  category: z.string().default('other').transform(value => value.trim().toLowerCase().replace(/ /g, '_')).pipe(z.enum(['education','youth','community_event','facility','social_services','technology','sports_fitness','arts_culture','environment','other'])),
});
