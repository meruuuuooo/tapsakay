import { request } from './api';
import type { PushStatus } from './push';

function supported(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function applicationServerKey(key: string): Uint8Array<ArrayBuffer> {
  const padded = key.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - key.length % 4) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

let prepared: Promise<{ publicKey: string; registration: ServiceWorkerRegistration }> | null = null;
let registrationInFlight: Promise<PushStatus> | null = null;
function prepare() {
  prepared ??= Promise.all([
    request<{ publicKey: string | null }>('/push/config'),
    navigator.serviceWorker.getRegistration().then((registration) => registration ?? navigator.serviceWorker.register('/sw.js')),
  ]).then(([config, registration]) => {
    if (!config.publicKey) throw new Error('Web Push is not configured.');
    return { publicKey: config.publicKey, registration };
  }).catch((error) => { prepared = null; throw error; });
  return prepared;
}

export async function registerPush(prompt: boolean): Promise<PushStatus> {
  if (!supported()) return 'unsupported';
  // Request permission before awaiting anything: some browsers require the tap's user activation.
  const permission = Notification.permission === 'default' && prompt ? await Notification.requestPermission() : Notification.permission;
  if (permission === 'default') {
    try { await prepare(); return 'prompt'; } catch { return 'error'; }
  }
  if (permission !== 'granted') return 'denied';
  registrationInFlight ??= (async (): Promise<PushStatus> => {
    try {
      const { publicKey, registration } = await prepare();
      const key = applicationServerKey(publicKey);
      let subscription = await registration.pushManager.getSubscription();
      const priorKey = subscription?.options.applicationServerKey;
      if (subscription && priorKey && (new Uint8Array(priorKey).length !== key.length || new Uint8Array(priorKey).some((byte, index) => byte !== key[index]))) {
        await subscription.unsubscribe();
        subscription = null;
      }
      subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      await request('/push/subscriptions', { platform: 'web', subscription: subscription.toJSON() });
      return 'registered';
    } catch { return 'error'; }
  })();
  try { return await registrationInFlight; } finally { registrationInFlight = null; }
}

export async function getPushDestination(): Promise<string | null> {
  if (!supported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription())?.endpoint ?? null;
}

export function listenForPush(onOpen: () => void, onReceive: () => void): () => void {
  if (!supported()) return () => {};
  const message = (event: MessageEvent) => { if (event.data?.type === 'ride-push') onReceive(); };
  navigator.serviceWorker.addEventListener('message', message);
  return () => navigator.serviceWorker.removeEventListener('message', message);
}
