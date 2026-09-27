import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo', () => ({ isRunningInExpoGo: () => true }));
vi.mock('expo-constants', () => ({ default: {} }));
vi.mock('expo-notifications', () => { throw new Error('Expo Go cannot load remote push notifications'); });
vi.mock('../src/services/api', () => ({ request: vi.fn() }));

describe('Expo Go push compatibility', () => {
  it('loads the app without evaluating expo-notifications', async () => {
    const push = await import('../src/services/push.native');
    expect(await push.registerPush(true)).toBe('unsupported');
    await expect(push.getPushDestination()).resolves.toBeNull();
    expect(push.listenForPush(() => {}, () => {})).toBeTypeOf('function');
  });
});
