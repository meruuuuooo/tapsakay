import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ request: vi.fn(), saveToken: vi.fn(), restoreToken: vi.fn(), csrf: vi.fn() }));
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('expo-crypto', () => ({ randomUUID: () => '11111111-1111-4111-8111-111111111111' }));
vi.mock('../src/services/api', () => ({ ...mocks, ApiError: class ApiError extends Error { constructor(public status: number, message: string) { super(message); } } }));
import { useAppStore } from '../src/store/app';
import { ApiError } from '../src/services/api';

const user = { id: 1, name: 'Rider', email: 'rider@example.test', role: 'passenger' as const, verified: true };
const snapshot = { ride: null, rides: [], relas: [], serverTime: '2026-09-27T00:00:00Z' };
function healthy() {
  mocks.request.mockImplementation(async (path: string) => {
    if (path === '/state') return snapshot;
    if (path === '/stations') return { data: [] };
    if (path === '/rides' || path === '/notifications') return { data: [], current_page: 1, last_page: 1 };
    return {};
  });
}
beforeEach(async () => {
  vi.resetAllMocks(); healthy();
  useAppStore.setState({ busy: false }); await useAppStore.getState().logout();
  useAppStore.setState({ user, stale: false, busy: false, error: null, message: null });
  mocks.request.mockClear();
});
describe('server-backed app state', () => {
  it('restores authenticated state and clears private state on expired session', async () => {
    mocks.request.mockRejectedValue(new ApiError(401, 'Expired'));
    await useAppStore.getState().refresh();
    expect(useAppStore.getState().user).toBeNull();
    expect(useAppStore.getState().history).toEqual([]);
    expect(mocks.saveToken).toHaveBeenCalledWith(null);
  });
  it('blocks mutations while disconnected', async () => {
    useAppStore.setState({ stale: true });
    expect(await useAppStore.getState().book()).toBe(false);
    expect(await useAppStore.getState().act('/driver/advance')).toBe(false);
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('marks failed polling stale and recovers on reconnect', async () => {
    mocks.request.mockRejectedValue(new ApiError(0, 'Offline'));
    await useAppStore.getState().refresh();
    expect(useAppStore.getState().stale).toBe(true);
    healthy(); await useAppStore.getState().refresh();
    expect(useAppStore.getState().stale).toBe(false);
  });
  it('retains the booking key after an ambiguous network failure', async () => {
    mocks.request.mockRejectedValueOnce(new ApiError(0, 'Offline'));
    await useAppStore.getState().book();
    const firstKey = mocks.request.mock.calls[0][2];
    healthy(); await useAppStore.getState().refresh();
    mocks.request.mockRejectedValueOnce(new ApiError(0, 'Offline'));
    await useAppStore.getState().book();
    const requests = mocks.request.mock.calls.filter((call) => call[0] === '/rides' && call[1]);
    expect(requests).toHaveLength(2);
    expect(requests[1][2]).toEqual(firstKey);
  });
  it('does not restore an old response after logout', async () => {
    let resolve!: (value: unknown) => void;
    mocks.request.mockImplementation((path: string) => path === '/state' ? new Promise((r) => { resolve = r; }) : Promise.resolve({ data: [], last_page: 1 }));
    const pending = useAppStore.getState().refresh();
    await useAppStore.getState().logout();
    resolve({ ...snapshot, rides: [{ id: 123 }] }); await pending;
    expect(useAppStore.getState().user).toBeNull();
    expect(useAppStore.getState().rides).toEqual([]);
  });
  it('preserves authenticated state when server logout fails', async () => {
    mocks.request.mockRejectedValue(new ApiError(0, 'Offline'));
    await useAppStore.getState().logout();
    expect(useAppStore.getState().user).toEqual(user);
    expect(useAppStore.getState().error).toContain('Reconnect');
  });
});
