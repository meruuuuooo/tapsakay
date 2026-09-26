import type { Rela, Ride } from '@/types/demo';

export type RouteMapProps = {
  relas: Rela[];
  ride?: Ride | null;
  pickupId?: number;
};
