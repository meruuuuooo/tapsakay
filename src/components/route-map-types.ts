import type { Rela, Ride, Station } from '@/types/demo';

export type RouteMapProps = {
  stations: Station[];
  relas: Rela[];
  ride?: Ride | null;
  pickupId?: number;
};
