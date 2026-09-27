import { beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({ expoGo: true }));
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo', () => ({ isRunningInExpoGo: () => runtime.expoGo }));
vi.mock('expo-constants', () => ({ default: {} }));
vi.mock('expo-notifications', () => { throw new Error('Expo Go cannot load remote push notifications'); });
vi.mock('../src/services/api', () => ({ request: vi.fn() }));

beforeEach(() => { runtime.expoGo = true; vi.resetModules(); });

describe('Expo Go push compatibility', () => {
  it('loads the app without evaluating expo-notifications', async () => {
    const push = await import('../src/services/push.native');
    expect(await push.registerPush(true)).toBe('unsupported');
    await expect(push.getPushDestination()).resolves.toBeNull();
    expect(push.listenForPush(() => {}, () => {})).toBeTypeOf('function');
  });

  it('does not load notifications merely because a standalone user signed in', async () => {
    runtime.expoGo = false;
    const push = await import('../src/services/push.native');
    const unsubscribe = push.listenForPush(() => {}, () => {});
    expect(unsubscribe).toBeTypeOf('function');
    unsubscribe();
  });
});
