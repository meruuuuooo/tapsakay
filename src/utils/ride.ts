import type { Rela, Ride, RideStatus } from '@/types/demo';

export function eligibleRela(relas: Rela[], pickupId: number, count: number): Rela | undefined {
  return relas.find((rela) =>
    rela.status === 'online' &&
    rela.currentStationId <= pickupId &&
    rela.capacity - rela.passengers >= count
  );
}

export function validBooking(pickupId: number, dropoffId: number, count: number): boolean {
  return Number.isInteger(pickupId) && Number.isInteger(dropoffId) &&
    pickupId >= 1 && dropoffId <= 5 && pickupId < dropoffId &&
    Number.isInteger(count) && count >= 1 && count <= 8;
}

export function canPickup(ride: Ride | null, rela: Rela): boolean {
  return !!ride && ride.status === 'waiting_pickup' && ride.relaId === rela.id &&
    rela.currentStationId === ride.pickupId && rela.capacity - rela.passengers >= ride.passengerCount;
}

export function canDropoff(ride: Ride | null, rela: Rela): boolean {
  return !!ride && (ride.status === 'onboard' || ride.status === 'approaching_dropoff') &&
    ride.relaId === rela.id && rela.currentStationId === ride.dropoffId;
}

export function travelStatus(ride: Ride, stationId: number): RideStatus {
  return stationId >= ride.dropoffId - 1 ? 'approaching_dropoff' : 'onboard';
}
