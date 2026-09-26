export type RideStatus =
  | 'matching'
  | 'requested'
  | 'accepted'
  | 'waiting_pickup'
  | 'onboard'
  | 'approaching_dropoff'
  | 'completed'
  | 'cancelled';

export type Station = { id: number; name: string; sequence: number; latitude: number; longitude: number };
export type Rela = {
  id: number;
  code: string;
  capacity: number;
  passengers: number;
  currentStationId: number;
  status: 'online' | 'offline' | 'full';
  driverName: string;
};
export type Ride = {
  id: number;
  pickupId: number;
  dropoffId: number;
  passengerCount: number;
  relaId: number | null;
  status: RideStatus;
};
export type Notice = { id: number; audience: 'passenger' | 'driver'; title: string; detail: string };
