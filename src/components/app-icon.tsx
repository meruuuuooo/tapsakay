import {
  ArrowLeft, ArrowLeftRight, ArrowRight, Bell, BusFront, Check, CircleArrowRight, Flag,
  Gauge, House, Mail, Map, MapPin, Menu, Minus, Navigation, Plus,
  RotateCcw, Ticket, UserRound, UsersRound,
} from 'lucide-react-native';

const icons = {
  add: Plus,
  remove: Minus,
  checkmark: Check,
  'arrow-back': ArrowLeft,
  'arrow-forward': ArrowRight,
  'arrow-forward-circle-outline': CircleArrowRight,
  'swap-horizontal': ArrowLeftRight,
  'home-outline': House,
  'ticket-outline': Ticket,
  'navigate-outline': Navigation,
  'notifications-outline': Bell,
  notifications: Bell,
  'person-outline': UserRound,
  'mail-outline': Mail,
  'people-outline': UsersRound,
  'map-outline': Map,
  'menu-outline': Menu,
  'bus-outline': BusFront,
  'location-outline': MapPin,
  'flag-outline': Flag,
  'refresh-outline': RotateCcw,
  'speedometer-outline': Gauge,
} as const;

export type IconName = keyof typeof icons;

export function AppIcon({ name, size = 20, color = '#04377b' }: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const Icon = icons[name];
  return <Icon size={size} color={color} strokeWidth={2} />;
}
