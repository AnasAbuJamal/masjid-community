import { describe, it, expect } from 'vitest';
import { resolveApiUrl } from '../../services/api-config';
describe('backend URL configuration', () => {
  it('accepts either the backend origin or its API path', () => {
    expect(resolveApiUrl('https://masjid.example')).toBe('https://masjid.example/api');
    expect(resolveApiUrl('https://masjid.example/api/')).toBe('https://masjid.example/api');
  });
  it('trims pasted URLs and provides a development default', () => {
    expect(resolveApiUrl('  https://masjid.example/  ')).toBe('https://masjid.example/api');
    expect(resolveApiUrl()).toBe('http://localhost:3000/api');
  });
});
