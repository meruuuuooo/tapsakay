import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const webOrigin = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : null;
const defaultApiUrl = webOrigin === 'https://tapsakay.lumichat.site'
  ? 'https://apitapsakay.lumichat.site'
  : webOrigin ?? 'https://apitapsakay.lumichat.site';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || defaultApiUrl).replace(/\/$/, '');
const TOKEN_KEY = 'tapsakay.access-token';
let token: string | null = null;
export class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: Record<string, string[]>) { super(message); }
}
export async function restoreToken() {
  token = Platform.OS === 'web' ? null : await SecureStore.getItemAsync(TOKEN_KEY);
}
export async function saveToken(value: string | null) {
  token = value;
  if (Platform.OS !== 'web') {
    if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}
function csrfToken() {
  if (typeof document === 'undefined') return '';
  return decodeURIComponent(document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='))?.slice(11) ?? '');
}
export async function csrf() {
  if (Platform.OS === 'web') await request('/sanctum/csrf-cookie', undefined, undefined, true);
}
export async function request<T>(path: string, body?: unknown, extraHeaders?: Record<string, string>, absolutePath = false): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_URL}${absolutePath ? path : `/api/v1${path}`}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: Platform.OS === 'web' ? 'include' : 'omit',
      headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(Platform.OS === 'web' ? { 'X-XSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' } : token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
      body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal,
    });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, data?.message ?? `Request failed (${response.status}). Please retry.`, data?.errors);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Cannot reach TAPSAKAY. Check your connection and retry.');
  } finally { clearTimeout(timeout); }
}
