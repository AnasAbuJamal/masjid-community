import { describe, it, expect } from 'vitest';
import { loginSchema, registrationSchema, profileSchema } from './auth-validation';
describe('account input boundaries', () => {
  it('normalizes email before database lookup', () => {
    expect(loginSchema.parse({ email: '  MEMBER@Example.com ', password: 'test' }).email).toBe('member@example.com');
  });
  it('rejects weak registration data', () => {
    expect(registrationSchema.safeParse({ email: 'a@example.com', password: 'short', firstName: '  ', lastName: 'Member' }).success).toBe(false);
  });
  it('blocks privilege escalation and unrelated profile writes', () => {
    expect(profileSchema.safeParse({ firstName: 'Test', role: 'admin' }).success).toBe(false);
    expect(profileSchema.safeParse({ email: 'other@example.com' }).success).toBe(false);
  });
});
