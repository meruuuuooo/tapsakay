export type PushStatus = 'registered' | 'prompt' | 'denied' | 'unsupported' | 'error';
export { registerPush, getPushDestination, listenForPush } from './push.web';
