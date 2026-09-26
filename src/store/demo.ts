import { create } from 'zustand';
import { initialNotices, initialRelas, stationName } from '@/data/mock';
import type { Notice, Rela, Ride } from '@/types/demo';
import { canDropoff, canPickup, eligibleRela, travelStatus, validBooking } from '@/utils/ride';

type DemoStore = {
  role: 'passenger' | 'driver';
  relas: Rela[];
  ride: Ride | null;
  notices: Notice[];
  pickupId: number;
  dropoffId: number;
  passengerCount: number;
  error: string | null;
  setRole: (role: 'passenger' | 'driver') => void;
  setBooking: (values: Partial<Pick<DemoStore, 'pickupId' | 'dropoffId' | 'passengerCount'>>) => void;
  setDriverOnline: (online: boolean) => void;
  requestRide: () => void;
  acceptRide: () => void;
  declineRide: () => void;
  pickupPassenger: () => void;
  moveStation: (step: -1 | 1) => void;
  dropoffPassenger: () => void;
  cancelRide: () => void;
  resetDemo: () => void;
};

let matchTimer: ReturnType<typeof setTimeout> | undefined;
let acceptTimer: ReturnType<typeof setTimeout> | undefined;
let nextNoticeId = 2;
export const MATCHING_DELAY_MS = 3000;

const seed = () => ({
  relas: initialRelas.map((rela) => ({ ...rela })),
  ride: null as Ride | null,
  notices: [...initialNotices],
  pickupId: 1,
  dropoffId: 4,
  passengerCount: 2,
  error: null as string | null,
});

function notice(audience: Notice['audience'], title: string, detail: string): Notice {
  return { id: nextNoticeId++, audience, title, detail };
}

function clearTimers() {
  if (matchTimer) clearTimeout(matchTimer);
  if (acceptTimer) clearTimeout(acceptTimer);
  matchTimer = undefined;
  acceptTimer = undefined;
}

export const useDemoStore = create<DemoStore>((set, get) => ({
  role: 'passenger',
  ...seed(),
  setRole: (role) => set({ role }),
  setBooking: (values) => set((state) => ({ ...values, error: null, pickupId: values.pickupId ?? state.pickupId, dropoffId: values.dropoffId ?? state.dropoffId, passengerCount: values.passengerCount ?? state.passengerCount })),
  setDriverOnline: (online) => set((state) => ({
    relas: state.relas.map((rela) => rela.id === (state.ride?.relaId ?? 1) ? { ...rela, status: online ? (rela.passengers === rela.capacity ? 'full' : 'online') : 'offline' } : rela),
  })),
  requestRide: () => {
    const { ride, pickupId, dropoffId, passengerCount } = get();
    if (ride && !['completed', 'cancelled'].includes(ride.status)) return;
    if (!validBooking(pickupId, dropoffId, passengerCount)) {
      set({ error: 'Choose a pickup before your destination and 1–8 passengers.' });
      return;
    }
    clearTimers();
    set({ ride: { id: Date.now(), pickupId, dropoffId, passengerCount, relaId: null, status: 'matching' }, error: null });
    matchTimer = setTimeout(() => {
      const state = get();
      if (state.ride?.status !== 'matching') return;
      const match = eligibleRela(state.relas, state.ride.pickupId, state.ride.passengerCount);
      if (!match) {
        set({ ride: null, error: 'No rela can reach this pickup with enough seats. Try another station or fewer passengers.' });
        return;
      }
      set({ ride: { ...state.ride, relaId: match.id, status: 'requested' }, notices: [
        notice('driver', 'New passenger request', `${state.ride.passengerCount} passenger(s): ${stationName(state.ride.pickupId)} → ${stationName(state.ride.dropoffId)}.`),
        notice('passenger', `${match.code} found`, 'Your request is waiting for the driver.'),
        ...state.notices,
      ] });
    }, MATCHING_DELAY_MS);
  },
  acceptRide: () => {
    const { ride, notices } = get();
    if (!ride || ride.status !== 'requested') return;
    const rela = get().relas.find((item) => item.id === ride.relaId);
    if (!rela || rela.status !== 'online' || rela.capacity - rela.passengers < ride.passengerCount) return;
    set({ ride: { ...ride, status: 'accepted' }, notices: [
      notice('driver', 'Request accepted', `Pick up ${ride.passengerCount} passenger(s) at ${stationName(ride.pickupId)}.`),
      notice('passenger', `${rela.code} accepted`, `${rela.driverName} is heading to ${stationName(ride.pickupId)}.`),
      ...notices,
    ] });
    acceptTimer = setTimeout(() => {
      const current = get().ride;
      if (current?.id === ride.id && current.status === 'accepted') set((state) => ({ ride: { ...current, status: 'waiting_pickup' }, notices: [notice('passenger', 'Your rela is approaching', `Meet ${rela.code} at ${stationName(current.pickupId)}.`), ...state.notices] }));
    }, 1000);
  },
  declineRide: () => {
    const { ride, notices } = get();
    if (ride?.status !== 'requested') return;
    set({ ride: { ...ride, status: 'cancelled' }, notices: [notice('driver', 'Request declined', 'The request is closed.'), notice('passenger', 'Request declined', 'Choose another pickup or reset the demo.'), ...notices] });
  },
  pickupPassenger: () => {
    const { ride, relas, notices } = get();
    const rela = relas.find((item) => item.id === ride?.relaId);
    if (!rela || !canPickup(ride, rela)) return;
    set({ ride: { ...ride!, status: 'onboard' }, relas: relas.map((item) => item.id === rela.id ? { ...item, passengers: item.passengers + ride!.passengerCount, status: item.passengers + ride!.passengerCount === item.capacity ? 'full' : item.status } : item), notices: [notice('driver', 'Pickup confirmed', `${ride!.passengerCount} passenger(s) are onboard.`), notice('passenger', 'You are now onboard', `${rela.code} picked you up at ${stationName(ride!.pickupId)}.`), ...notices] });
  },
  moveStation: (step) => {
    const { ride, relas, notices } = get();
    const relaId = ride?.relaId ?? 1;
    const rela = relas.find((item) => item.id === relaId);
    if (!rela) return;
    const next = Math.max(1, Math.min(5, rela.currentStationId + step));
    if (next === rela.currentStationId) return;
    // The developer's Previous Station control cannot rewind an onboard ride.
    if (step === -1 && ride && ['onboard', 'approaching_dropoff'].includes(ride.status)) return;
    if (step === 1 && ride?.relaId === rela.id) {
      if (['requested', 'accepted', 'waiting_pickup'].includes(ride.status) && next > ride.pickupId) return;
      if (['onboard', 'approaching_dropoff'].includes(ride.status) && next > ride.dropoffId) return;
    }
    const active = ride && ride.relaId === rela.id && ['onboard', 'approaching_dropoff'].includes(ride.status);
    const updatedRide = active ? { ...ride, status: travelStatus(ride, next) } : ride;
    const alerts = active && step === 1 && next === ride.dropoffId - 1
      ? [notice('driver', 'Destination next', `Prepare to stop at ${stationName(ride.dropoffId)}.`), notice('passenger', 'Your destination is next', `${stationName(ride.dropoffId)} is the next stop.`)]
      : active && step === 1 && next === ride.dropoffId
        ? [notice('driver', 'Drop-off at this station', `Confirm drop-off at ${stationName(next)}.`), notice('passenger', 'You have arrived', `Your stop is ${stationName(next)}.`)]
        : [];
    set({ relas: relas.map((item) => item.id === rela.id ? { ...item, currentStationId: next } : item), ride: updatedRide, notices: [...alerts, ...notices] });
  },
  dropoffPassenger: () => {
    const { ride, relas, notices } = get();
    const rela = relas.find((item) => item.id === ride?.relaId);
    if (!rela || !canDropoff(ride, rela)) return;
    set({ ride: { ...ride!, status: 'completed' }, relas: relas.map((item) => item.id === rela.id ? { ...item, passengers: item.passengers - ride!.passengerCount, status: item.status === 'full' ? 'online' : item.status } : item), notices: [notice('driver', 'Drop-off complete', `${ride!.passengerCount} passenger(s) left at ${stationName(ride!.dropoffId)}.`), notice('passenger', 'Ride completed', `You arrived at ${stationName(ride!.dropoffId)}.`), ...notices] });
  },
  cancelRide: () => {
    const { ride, notices } = get();
    if (!ride || !['matching', 'requested', 'accepted', 'waiting_pickup'].includes(ride.status)) return;
    clearTimers();
    set({ ride: { ...ride, status: 'cancelled' }, notices: [notice('driver', 'Request cancelled', 'The passenger cancelled the request.'), notice('passenger', 'Ride cancelled', 'Your seats were not taken.'), ...notices] });
  },
  resetDemo: () => {
    clearTimers();
    nextNoticeId = 2;
    set({ ...seed(), role: 'passenger' });
  },
}));
