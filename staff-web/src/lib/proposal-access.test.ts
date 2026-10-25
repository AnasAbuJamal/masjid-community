import { describe, it, expect } from 'vitest';
import { proposalInput, commentSchema } from './proposal-access';
describe('proposal validation', () => {
 it('maps human-readable categories into stored enums', () => {
  const data = proposalInput.parse({ title: 'Community gathering', description: 'A gathering for our local community.', category: 'Community Event' });
  expect(data.category).toBe('community_event');
 });
 it('rejects invalid categories, empty content, and oversized comments', () => {
  expect(proposalInput.safeParse({ title: 'Title', description: 'A sufficiently long description.', category: 'not-real' }).success).toBe(false);
  expect(commentSchema.safeParse({ message: '   ' }).success).toBe(false);
  expect(commentSchema.safeParse({ message: 'x'.repeat(5001) }).success).toBe(false);
 });
});
