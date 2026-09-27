import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('expo-secure-store', () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('API URL', () => {
  it('uses the API host when the production web build has no configured URL', async () => {
    vi.stubEnv('EXPO_PUBLIC_API_URL', '');
    vi.stubGlobal('window', { location: { origin: 'https://tapsakay.lumichat.site' } });

    const { API_URL } = await import('../src/services/api');

    expect(API_URL).toBe('https://apitapsakay.lumichat.site');
  });

  it('respects an explicitly configured API URL', async () => {
    vi.stubEnv('EXPO_PUBLIC_API_URL', 'https://custom.example.test/');
    vi.stubGlobal('window', { location: { origin: 'https://tapsakay.lumichat.site' } });

    const { API_URL } = await import('../src/services/api');

    expect(API_URL).toBe('https://custom.example.test');
  });
});
