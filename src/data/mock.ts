import type { Notice, Rela, Station } from '@/types/demo';

export const stations: Station[] = [
  // Approximate demo pins along the CMU-to-Maramag corridor, not surveyed pickup points.
  { id: 1, name: 'CBM', sequence: 1, latitude: 7.86202, longitude: 125.05083 },
  { id: 2, name: 'CMU Gate', sequence: 2, latitude: 7.85903, longitude: 125.05216 },
  { id: 3, name: 'Hospital', sequence: 3, latitude: 7.85825, longitude: 125.04739 },
  { id: 4, name: 'Market', sequence: 4, latitude: 7.7603, longitude: 125.0031 },
  { id: 5, name: 'Terminal', sequence: 5, latitude: 7.75992, longitude: 125.00228 },
];

export const initialRelas: Rela[] = [
  { id: 1, code: 'Rela #01', capacity: 8, passengers: 5, currentStationId: 1, status: 'online', driverName: 'Juan Dela Cruz' },
  { id: 2, code: 'Rela #02', capacity: 8, passengers: 2, currentStationId: 2, status: 'online', driverName: 'Maya Santos' },
  { id: 3, code: 'Rela #03', capacity: 8, passengers: 8, currentStationId: 3, status: 'full', driverName: 'Alex Reyes' },
];

export const initialNotices: Notice[] = [
  { id: 1, audience: 'passenger', title: 'Welcome to TAPSAKAY', detail: 'This is a local demo. Choose a station to begin.' },
];

export const stationName = (id: number) => stations.find((station) => station.id === id)?.name ?? 'Unknown station';
