import { afterEach, describe, expect, it, vi } from 'vitest';

const mockPlatform = vi.hoisted(() => ({ OS: 'web' }));
vi.mock('react-native', () => ({ Platform: mockPlatform }));
vi.mock('expo-secure-store', () => ({}));

afterEach(() => {
  mockPlatform.OS = 'web';
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('API URL', () => {
  it('uses the hosted API for a native APK without a configured URL', async () => {
    mockPlatform.OS = 'android';
    vi.stubEnv('EXPO_PUBLIC_API_URL', '');

    const { API_URL } = await import('../src/services/api');

    expect(API_URL).toBe('https://apitapsakay.lumichat.site');
  });

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
