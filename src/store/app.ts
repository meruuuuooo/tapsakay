import { create } from 'zustand';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { ApiError, csrf, request, restoreToken, saveToken } from '@/services/api';
import type { ApiRide, Notice, Page, Snapshot, Station, User } from '@/types/api';

type Store = Snapshot & {
  user: User | null; ready: boolean; busy: boolean; stale: boolean; error: string | null; message: string | null;
  stations: Station[]; notices: Notice[]; history: ApiRide[]; historyPage: number; historyLastPage: number; noticePage: number; noticeLastPage: number;
  pickupId: number; dropoffId: number; passengerCount: number;
  init: () => Promise<void>; login: (email: string, password: string) => Promise<boolean>;
  authAction: (action: string, body: object) => Promise<boolean>; logout: () => Promise<void>; checkUser: () => Promise<void>;
  refresh: () => Promise<void>; heartbeat: () => Promise<void>;
  setBooking: (data: Partial<Pick<Store, 'pickupId' | 'dropoffId' | 'passengerCount'>>) => void;
  book: () => Promise<boolean>; act: (path: string, data?: object) => Promise<boolean>;
  moreHistory: () => Promise<void>; moreNotices: () => Promise<void>;
};
const clean = (): Snapshot & Pick<Store, 'stations' | 'notices' | 'history' | 'historyPage' | 'historyLastPage' | 'noticePage' | 'noticeLastPage'> => ({ ride: null, rides: [], relas: [], serverTime: '', stations: [], notices: [], history: [], historyPage: 1, historyLastPage: 1, noticePage: 1, noticeLastPage: 1 });
let epoch = 0;
let refreshRunning = false;
let bookingKey: string | null = null;
const errorMessage = (e: unknown) => e instanceof ApiError ? Object.values(e.errors ?? {}).flat()[0] ?? e.message : 'Something went wrong. Please retry.';

export const useAppStore = create<Store>((set, get) => ({
  ...clean(), user: null, ready: false, busy: false, stale: true, error: null, message: null,
  pickupId: 1, dropoffId: 4, passengerCount: 1,
  init: async () => {
    try { await restoreToken(); await get().checkUser(); }
    catch (e) { set({ error: errorMessage(e) }); }
    finally { set({ ready: true }); }
  },
  checkUser: async () => {
    const version = epoch;
    try {
      const { user } = await request<{ user: User }>('/auth/me');
      if (version !== epoch) return;
      set({ user, error: null });
      if (user.verified) await get().refresh();
    } catch (e) {
      if (version !== epoch) return;
      if (e instanceof ApiError && e.status === 401) { await saveToken(null); set({ user: null, ...clean() }); }
      else set({ error: errorMessage(e), stale: true });
    }
  },
  login: async (email, password) => {
    if (get().busy) return false;
    const version = ++epoch;
    set({ busy: true, error: null, message: null, ...clean() });
    try {
      await csrf();
      const result = await request<{ user: User; token?: string }>(Platform.OS === 'web' ? '/auth/login' : '/auth/token', { email: email.trim().toLowerCase(), password, deviceName: 'TAPSAKAY mobile' });
      if (version !== epoch) return false;
      await saveToken(result.token ?? null);
      set({ user: result.user });
      if (result.user.verified) await get().refresh();
      return true;
    } catch (e) { set({ error: errorMessage(e) }); return false; }
    finally { if (version === epoch) set({ busy: false }); }
  },
  authAction: async (action, body) => {
    if (get().busy) return false;
    set({ busy: true, error: null, message: null });
    try {
      await csrf();
      const result = await request<{ message: string }>(`/auth/${action}`, body);
      set({ message: result.message }); return true;
    } catch (e) { set({ error: errorMessage(e) }); return false; }
    finally { set({ busy: false }); }
  },
  logout: async () => {
    if (get().busy) return;
    set({ busy: true, error: null });
    try {
      await request('/auth/logout', {});
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) { set({ error: 'Sign-out could not reach the server. Reconnect and retry.', busy: false }); return; }
    }
    ++epoch; bookingKey = null;
    await saveToken(null);
    set({ ...clean(), user: null, stale: true, busy: false, error: null, message: null, pickupId: 1, dropoffId: 4, passengerCount: 1 });
  },
  refresh: async () => {
    if (refreshRunning || !get().user?.verified) return;
    refreshRunning = true;
    const version = epoch;
    try {
      const [snapshot, stations, notices, history] = await Promise.all([
        request<Snapshot>('/state'), request<{ data: Station[] }>('/stations'), request<Page<Notice>>('/notifications'), request<Page<ApiRide>>('/rides'),
      ]);
      if (version !== epoch) return;
      set({ ...snapshot, stations: stations.data, notices: [...new Map([...get().notices, ...notices.data].map((n) => [n.id, n])).values()].sort((a, b) => b.id - a.id), history: [...new Map([...get().history, ...history.data].map((r) => [r.id, r])).values()].sort((a, b) => b.id - a.id), historyLastPage: history.last_page, noticeLastPage: notices.last_page, stale: false, ...(get().stale ? { error: null } : {}) });
    } catch (e) {
      if (version !== epoch) return;
      if (e instanceof ApiError && e.status === 401) { ++epoch; await saveToken(null); set({ user: null, ...clean(), error: 'Your session expired. Please sign in again.', stale: true }); }
      else set({ stale: true, error: errorMessage(e) });
    } finally { refreshRunning = false; }
  },
  heartbeat: async () => {
    if (get().user?.role !== 'driver' || !get().user?.verified || !get().relas.length) return;
    try { await request('/driver/heartbeat', {}); } catch { set({ stale: true }); }
  },
  setBooking: (data) => { if (!get().busy) { bookingKey = null; set({ ...data, error: null }); } },
  book: async () => {
    if (get().busy || get().stale) return false;
    set({ busy: true, error: null });
    const version = epoch;
    bookingKey ??= Crypto.randomUUID();
    try {
      const { pickupId, dropoffId, passengerCount } = get();
      const result = await request<{ data: ApiRide }>('/rides', { pickupId, dropoffId, passengerCount }, { 'Idempotency-Key': bookingKey });
      if (version !== epoch) return false;
      bookingKey = null; set({ ride: result.data }); await get().refresh(); return true;
    } catch (e) {
      if (e instanceof ApiError && e.status > 0 && e.status < 500) bookingKey = null;
      set({ error: errorMessage(e), ...(e instanceof ApiError && e.status === 0 ? { stale: true } : {}) }); return false;
    } finally { if (version === epoch) set({ busy: false }); }
  },
  act: async (path, data = {}) => {
    if (get().busy || get().stale) return false;
    const version = epoch;
    set({ busy: true, error: null });
    try { await request(path, data); await get().refresh(); return true; }
    catch (e) { set({ error: errorMessage(e) }); await get().refresh(); return false; }
    finally { if (version === epoch) set({ busy: false }); }
  },
  moreHistory: async () => {
    const s = get(), version = epoch;
    if (s.historyPage >= s.historyLastPage || s.busy) return;
    set({ busy: true });
    try { const p = await request<Page<ApiRide>>(`/rides?page=${s.historyPage + 1}`); if (version === epoch) set({ history: [...new Map([...s.history, ...p.data].map((r) => [r.id, r])).values()], historyPage: p.current_page }); }
    catch (e) { set({ error: errorMessage(e) }); } finally { set({ busy: false }); }
  },
  moreNotices: async () => {
    const s = get(), version = epoch;
    if (s.noticePage >= s.noticeLastPage || s.busy) return;
    set({ busy: true });
    try { const p = await request<Page<Notice>>(`/notifications?page=${s.noticePage + 1}`); if (version === epoch) set({ notices: [...new Map([...s.notices, ...p.data].map((n) => [n.id, n])).values()], noticePage: p.current_page }); }
    catch (e) { set({ error: errorMessage(e) }); } finally { set({ busy: false }); }
  },
}));
