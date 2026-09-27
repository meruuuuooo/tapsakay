import type { Rela, Ride, Station } from './demo';
export type User = { id: number; name: string; email: string; role: 'passenger' | 'driver'; verified: boolean };
export type ApiRide = Ride & { reason: string | null; createdAt: string; offerExpiresAt: string };
export type ApiRela = Rela & { availableSeats: number; reservedSeats: number };
export type Notice = { id: number; rideId: number; title: string; detail: string; createdAt: string };
export type Page<T> = { data: T[]; current_page: number; last_page: number };
export type Snapshot = { ride: ApiRide | null; rides: ApiRide[]; relas: ApiRela[]; serverTime: string };
export type { Station };
