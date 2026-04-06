import { defineConfig } from 'vitest/config';
import { getDefaultConfig } from 'expo/metro-config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['__tests__/**/*.test.ts'],
  },
});
