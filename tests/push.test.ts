import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../src/services/api', () => api);

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe('PWA push registration', () => {
  it('prepares the worker, waits for a user tap, and registers a browser subscription', async () => {
    const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/example', toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/example', keys: { p256dh: 'key', auth: 'secret' } }) };
    const subscribe = vi.fn().mockResolvedValue(subscription);
    const registration = { pushManager: { getSubscription: vi.fn().mockResolvedValue(null), subscribe } };
    const notification = { permission: 'default', requestPermission: vi.fn(async () => { notification.permission = 'granted'; return 'granted'; }) };
    vi.stubGlobal('window', { isSecureContext: true, PushManager: function () {}, Notification: notification });
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: vi.fn().mockResolvedValue(registration) } });
    vi.stubGlobal('Notification', notification);
    api.request.mockImplementation(async (path: string) => path === '/push/config' ? { publicKey: 'AQID' } : { registered: true });
    const { registerPush, getPushDestination } = await import('../src/services/push.web');
    expect(await registerPush(false)).toBe('prompt');
    expect(notification.requestPermission).not.toHaveBeenCalled();
    expect(await registerPush(true)).toBe('registered');
    expect(subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }));
    expect(api.request).toHaveBeenCalledWith('/push/subscriptions', { platform: 'web', subscription: subscription.toJSON() });
    registration.pushManager.getSubscription.mockResolvedValue(subscription);
    expect(await getPushDestination()).toBe(subscription.endpoint);
  });

  it('does not register when browser permission is denied', async () => {
    vi.stubGlobal('window', { isSecureContext: true, PushManager: function () {}, Notification: {} });
    vi.stubGlobal('navigator', { serviceWorker: {} });
    vi.stubGlobal('Notification', { permission: 'denied' });
    const { registerPush } = await import('../src/services/push.web');
    expect(await registerPush(true)).toBe('denied');
    expect(api.request).not.toHaveBeenCalled();
  });
});
