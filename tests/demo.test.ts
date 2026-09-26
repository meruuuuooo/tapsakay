import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { initialRelas } from '../src/data/mock';
import { MATCHING_DELAY_MS, useDemoStore } from '../src/store/demo';
import { eligibleRela, validBooking } from '../src/utils/ride';

const state = () => useDemoStore.getState();

beforeEach(() => {
  vi.useFakeTimers();
  state().resetDemo();
});
afterEach(() => vi.useRealTimers());

describe('mock matching', () => {
  it('selects the first reachable online rela with enough seats', () => {
    expect(eligibleRela(initialRelas, 1, 2)?.code).toBe('Rela #01');
    expect(eligibleRela(initialRelas, 1, 4)).toBeUndefined();
    expect(eligibleRela(initialRelas, 2, 4)?.code).toBe('Rela #02');
    expect(eligibleRela(initialRelas, 3, 8)).toBeUndefined();
  });
  it('accepts only forward rides and a valid passenger count', () => {
    expect(validBooking(1, 4, 2)).toBe(true);
    expect(validBooking(4, 1, 2)).toBe(false);
    expect(validBooking(1, 1, 2)).toBe(false);
    expect(validBooking(1, 4, 0)).toBe(false);
  });
});

describe('demo ride', () => {
  it('completes the passenger and driver flow with 5 → 7 → 5 seats occupied', () => {
    state().requestRide();
    expect(state().ride?.status).toBe('matching');
    vi.advanceTimersByTime(MATCHING_DELAY_MS - 1);
    expect(state().ride?.status).toBe('matching');
    vi.advanceTimersByTime(1);
    expect(state().ride?.relaId).toBe(1);
    expect(state().ride?.status).toBe('requested');
    state().moveStation(1);
    expect(state().relas[0].currentStationId).toBe(1);
    state().acceptRide();
    expect(state().ride?.status).toBe('accepted');
    vi.advanceTimersByTime(1000);
    expect(state().ride?.status).toBe('waiting_pickup');
    state().pickupPassenger();
    state().pickupPassenger();
    expect(state().relas[0].passengers).toBe(7);
    state().moveStation(1);
    expect(state().ride?.status).toBe('onboard');
    state().moveStation(1);
    expect(state().ride?.status).toBe('approaching_dropoff');
    state().moveStation(1);
    expect(state().relas[0].currentStationId).toBe(4);
    state().moveStation(1);
    expect(state().relas[0].currentStationId).toBe(4);
    state().dropoffPassenger();
    state().dropoffPassenger();
    expect(state().ride?.status).toBe('completed');
    expect(state().relas[0].passengers).toBe(5);
  });

  it('shows no match without taking seats', () => {
    state().setBooking({ passengerCount: 4 });
    state().requestRide();
    vi.advanceTimersByTime(MATCHING_DELAY_MS);
    expect(state().ride).toBeNull();
    expect(state().error).toMatch(/No rela/);
    expect(state().relas[0].passengers).toBe(5);
    state().setBooking({ passengerCount: 2 });
    state().requestRide();
    vi.advanceTimersByTime(MATCHING_DELAY_MS);
    expect(state().ride?.status).toBe('requested');
  });

  it('keeps passenger updates separate from driver request and drop-off alerts', () => {
    state().requestRide();
    vi.advanceTimersByTime(MATCHING_DELAY_MS);
    expect(state().notices.find((item) => item.audience === 'driver')?.title).toBe('New passenger request');
    expect(state().notices.find((item) => item.audience === 'passenger')?.title).toBe('Rela #01 found');

    state().acceptRide();
    vi.advanceTimersByTime(1000);
    state().pickupPassenger();
    expect(state().notices.find((item) => item.audience === 'driver')?.title).toBe('Pickup confirmed');
    state().moveStation(1);
    state().moveStation(1);
    state().moveStation(1);
    expect(state().notices.find((item) => item.audience === 'driver')?.title).toBe('Drop-off at this station');
    expect(state().notices.find((item) => item.audience === 'passenger')?.title).toBe('You have arrived');
  });

  it('cancels pending timers and fully resets the demo', () => {
    state().requestRide();
    state().cancelRide();
    vi.advanceTimersByTime(MATCHING_DELAY_MS + 1000);
    expect(state().ride?.status).toBe('cancelled');
    state().resetDemo();
    expect(state().ride).toBeNull();
    expect(state().relas[0].passengers).toBe(5);
    expect(state().relas[0].currentStationId).toBe(1);
    expect(state().notices).toHaveLength(1);
  });

  it('declines without changing occupancy', () => {
    state().requestRide();
    vi.advanceTimersByTime(MATCHING_DELAY_MS);
    state().declineRide();
    state().pickupPassenger();
    expect(state().ride?.status).toBe('cancelled');
    expect(state().relas[0].passengers).toBe(5);
  });

  it('marks an eight-seat rela full until drop-off', () => {
    state().setBooking({ passengerCount: 3 });
    state().requestRide();
    vi.advanceTimersByTime(MATCHING_DELAY_MS);
    state().acceptRide();
    vi.advanceTimersByTime(1000);
    state().pickupPassenger();
    expect(state().relas[0].passengers).toBe(8);
    expect(state().relas[0].status).toBe('full');
    state().moveStation(1);
    state().moveStation(1);
    state().moveStation(1);
    state().dropoffPassenger();
    expect(state().relas[0].passengers).toBe(5);
    expect(state().relas[0].status).toBe('online');
  });
});
