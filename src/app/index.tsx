import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { WelcomeScreen } from '@/components/welcome-screen';
import { AppIcon, type IconName } from '@/components/app-icon';
import { AccountScreen } from '@/components/account-screen';
import { Button, C, Card, Pill, SectionTitle, T } from '@/components/demo-ui';
import { RouteMap } from '@/components/route-map';
import { ScreenSkeleton, StartupSkeleton } from '@/components/skeleton';
import { useAppStore } from '@/store/app';
import { listenForPush, registerPush, type PushStatus } from '@/services/push';
import type { ApiRide } from '@/types/api';

const passengerTabs = ['Home', 'Book', 'Trips', 'Notifications', 'Profile'] as const;
const driverTabs = ['Home', 'Requests', 'Passengers', 'Route'] as const;
type Tab = typeof passengerTabs[number] | typeof driverTabs[number];
const icons: Record<Tab, IconName> = { Home: 'home-outline', Book: 'ticket-outline', Trips: 'navigate-outline', Notifications: 'notifications-outline', Profile: 'person-outline', Requests: 'mail-outline', Passengers: 'people-outline', Route: 'map-outline' };
const active = (ride: ApiRide) => !['completed', 'cancelled'].includes(ride.status);

function RideCard({ ride }: { ride: ApiRide }) {
  const s = useAppStore();
  const station = (id: number) => s.stations.find((item) => item.id === id)?.name ?? 'Station';
  const v = s.relas.find((item) => item.id === ride.relaId);
  const driver = s.user?.role === 'driver';
  const disabled = s.busy || s.stale;
  const action = (name: string) => void s.act(`/rides/${ride.id}/${name}`);
  return <Card>
    <View style={styles.row}><T size={13} color={C.slate}>Ride #{ride.id} · {ride.passengerCount} passenger(s)</T><Pill label={ride.status.replaceAll('_', ' ').toUpperCase()} tone={ride.status === 'completed' ? 'green' : ride.status === 'cancelled' ? 'red' : 'amber'} /></View>
    <T size={19} weight="bold" color={C.navy}>{station(ride.pickupId)} → {station(ride.dropoffId)}</T>
    {v && <T color={C.slate}>{v.code} · {v.driverName} · Last reported at {station(v.currentStationId)}</T>}
    {ride.reason && <T color={C.slate}>{ride.reason}</T>}
    {ride.status === 'requested' && <T size={12} color={C.slate}>Seats held until {new Date(ride.offerExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Waiting for the driver.</T>}
    {driver && ride.status === 'requested' && <><Button label="Accept request" disabled={disabled} onPress={() => action('accept')} /><Button label="Decline request" kind="secondary" disabled={disabled} onPress={() => action('decline')} /></>}
    {driver && ride.status === 'waiting_pickup' && v?.currentStationId === ride.pickupId && <Button label="Confirm pickup" disabled={disabled} onPress={() => action('pickup')} />}
    {driver && ['onboard', 'approaching_dropoff'].includes(ride.status) && v?.currentStationId === ride.dropoffId && <Button label="Confirm drop-off" disabled={disabled} onPress={() => action('dropoff')} />}
    {!driver && ['requested', 'accepted', 'waiting_pickup'].includes(ride.status) && <Button label="Cancel request" kind="secondary" disabled={disabled} onPress={() => action('cancel')} />}
  </Card>;
}
function MapCard() {
  const s = useAppStore();
  if (!s.stations.length) return null;
  return <Card><T size={18} weight="bold" color={C.navy}>Route progress</T><T size={12} color={C.slate}>Driver-reported stations · Approximate map pins</T><RouteMap stations={s.stations} relas={s.relas} ride={s.user?.role === 'passenger' ? s.ride : null} pickupId={s.pickupId} /></Card>;
}
function Booking() {
  const s = useAppStore();
  if (s.ride && active(s.ride)) return <><SectionTitle title="Your active ride" /><RideCard ride={s.ride} /></>;
  return <>
    <View><T size={27} weight="extra" color={C.navy}>Where are you going?</T><T color={C.slate}>Choose your stops and reserve your seats.</T></View>
    <Card><T weight="bold">Pickup station</T><View style={styles.chips}>{s.stations.slice(0, -1).map((station, i) => <Button key={station.id} label={station.name} kind={station.id === s.pickupId ? 'navy' : 'secondary'} disabled={s.busy} onPress={() => s.setBooking({ pickupId: station.id, dropoffId: s.stations.findIndex((x) => x.id === s.dropoffId) <= i ? s.stations[i + 1].id : s.dropoffId })} />)}</View>
    <T weight="bold">Destination</T><View style={styles.chips}>{s.stations.filter((x) => x.sequence > (s.stations.find((p) => p.id === s.pickupId)?.sequence ?? 0)).map((station) => <Button key={station.id} label={station.name} kind={station.id === s.dropoffId ? 'navy' : 'secondary'} disabled={s.busy} onPress={() => s.setBooking({ dropoffId: station.id })} />)}</View></Card>
    <Card><T weight="bold">Passengers</T><View style={styles.row}><Button label="Fewer" kind="secondary" disabled={s.busy || s.passengerCount <= 1} onPress={() => s.setBooking({ passengerCount: s.passengerCount - 1 })} /><T size={26} weight="extra">{s.passengerCount}</T><Button label="More" kind="secondary" disabled={s.busy || s.passengerCount >= 8} onPress={() => s.setBooking({ passengerCount: s.passengerCount + 1 })} /></View></Card>
    <Button label={s.busy ? 'Finding a rela…' : 'Request ride'} disabled={s.busy || s.stale || !s.stations.length} onPress={() => void s.book()} />
  </>;
}
function Notices() {
  const s = useAppStore();
  return <><SectionTitle title="Notifications" />{s.notices.length ? s.notices.map((n) => <Card key={n.id}><T weight="bold">{n.title}</T><T color={C.slate}>{n.detail}</T></Card>) : <T color={C.slate}>Ride updates will appear here.</T>}{s.noticePage < s.noticeLastPage && <Button label="Older notifications" kind="secondary" disabled={s.busy} onPress={() => void s.moreNotices()} />}</>;
}
function Profile() {
  const s = useAppStore();
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  useEffect(() => { if (!s.user?.verified) return; let active = true; void registerPush(false).then((status) => { if (active) setPushStatus(status); }); return () => { active = false; }; }, [s.user?.verified]);
  return <><SectionTitle title="Your account" /><T size={22} weight="bold">{s.user?.name}</T><T color={C.slate}>{s.user?.email}</T><Pill label={s.user?.role.toUpperCase() ?? ''} />
    {s.user?.verified && pushStatus !== 'registered' && pushStatus !== 'unsupported' && <Button label="Enable ride notifications" kind="secondary" onPress={() => { void registerPush(true).then(setPushStatus); }} />}
    {s.user?.verified && pushStatus === 'denied' && <T color={C.slate}>Allow notifications in your device or browser settings, then try again.</T>}
    {s.user?.verified && pushStatus === 'error' && <T color={C.slate}>Notifications could not be enabled. Check your connection and try again.</T>}
    <Button label="Sign out" kind="secondary" disabled={s.busy} onPress={() => void s.logout()} /></>;
}
function Passenger({ tab, navigate }: { tab: Tab; navigate: (tab: Tab) => void }) {
  const s = useAppStore();
  if (tab === 'Book') return <Booking />;
  if (tab === 'Notifications') return <Notices />;
  if (tab === 'Profile') return <Profile />;
  if (tab === 'Trips') return <><SectionTitle title="Your trips" />{s.history.length ? s.history.map((ride) => <RideCard key={ride.id} ride={ride} />) : <T color={C.slate}>Your first trip starts with a booking.</T>}{s.historyPage < s.historyLastPage && <Button label="Older trips" kind="secondary" disabled={s.busy} onPress={() => void s.moreHistory()} />}</>;
  return <View style={styles.homeStack}>
    <View style={styles.homeGreeting}>
      <View style={{ flex: 1, gap: 4 }}><T size={13} weight="semi" color={C.slate}>Good day</T><T size={28} weight="extra" color={C.navy}>{s.user?.name.split(' ')[0]}!</T><T color={C.slate}>Where will TAPSAKAY take you?</T></View>
      <View style={styles.passengerAvatar}><AppIcon name="person-outline" size={23} color={C.navy} /></View>
    </View>
    {s.ride && active(s.ride) ? <><View style={styles.homeSectionHeader}><T size={19} weight="bold" color={C.navy}>Your ride</T><Pill label="LIVE" tone="green" /></View><RideCard ride={s.ride} /></> : <View style={styles.bookHero}>
      <View style={styles.bookHeroTop}><View style={styles.bookIcon}><AppIcon name="ticket-outline" size={22} color={C.navy} /></View><Pill label="QUICK BOOK" tone="blue" /></View>
      <View style={{ gap: 5 }}><T size={23} weight="extra" color={C.navy}>Ready to move?</T><T color={C.slate}>Choose your stops and reserve your seats.</T></View>
      <Button label="Book a ride" kind="primary" icon="arrow-forward" onPress={() => navigate('Book')} />
    </View>}
    <View style={styles.homeSectionHeader}><T size={19} weight="bold" color={C.navy}>Your route</T><T size={12} weight="semi" color={C.slate}>5 stops · CBM to Terminal</T></View>
    <View style={styles.routeStrip}>{s.stations.map((station, index) => <View key={station.id} style={styles.routeStop}><View style={[styles.routeDot, index === 0 && { backgroundColor: C.green }, index === s.stations.length - 1 && { backgroundColor: C.red }]} /><T size={11} weight="semi" color={C.slate} numberOfLines={1}>{station.name}</T>{index < s.stations.length - 1 && <View style={styles.routeLine} />}</View>)}</View>
    <MapCard />
    <View style={styles.homeSectionHeader}><T size={19} weight="bold" color={C.navy}>Relas nearby</T><T size={12} weight="semi" color={C.slate}>{s.relas.length} on route</T></View>
    {s.relas.length ? <View style={styles.relaGrid}>{s.relas.map((v) => <Card key={v.id} style={styles.relaCard}><View style={styles.row}><T size={16} weight="bold" color={C.navy}>{v.code}</T><View style={[styles.statusDot, { backgroundColor: v.status === 'online' ? C.green : v.status === 'full' ? C.amber : C.muted }]} /></View><T size={12} color={C.slate}>{s.stations.find((x) => x.id === v.currentStationId)?.name}</T><T size={13} weight="bold" color={C.navy}>{v.availableSeats} seats free</T></Card>)}</View> : <Card><T color={C.slate}>No vehicles are configured yet.</T></Card>}
  </View>;
}
function Driver({ tab, navigate }: { tab: Tab; navigate: (tab: Tab) => void }) {
  const s = useAppStore(), v = s.relas[0];
  if (tab === 'Notifications') return <><Button label="Back to dashboard" kind="secondary" icon="arrow-back" onPress={() => navigate('Home')} /><Notices /></>;
  if (tab === 'Profile') return <><Button label="Back to dashboard" kind="secondary" icon="arrow-back" onPress={() => navigate('Home')} /><Profile /><Notices /></>;
  if (!v) return <><SectionTitle title="Vehicle assignment needed" /><T color={C.slate}>Ask your operator to assign a rela to your account.</T><Profile /></>;
  const current = s.stations.find((x) => x.id === v.currentStationId);
  const next = s.stations.find((x) => x.sequence > (current?.sequence ?? 0));
  const obligation = s.rides.some((r) => (['onboard', 'approaching_dropoff'].includes(r.status) ? r.dropoffId : r.pickupId) === v.currentStationId);
  const disabled = s.busy || s.stale;
  if (tab === 'Requests' || tab === 'Passengers') {
    const rides = s.rides.filter((r) => tab === 'Requests' ? r.status === 'requested' : r.status !== 'requested');
    return <><SectionTitle title={tab === 'Requests' ? 'Incoming requests' : 'Passenger groups'} /><T color={C.slate}>{v.passengers} onboard · {v.reservedSeats - v.passengers} reserved · {v.availableSeats} available</T>{rides.length ? rides.map((r) => <RideCard key={r.id} ride={r} />) : <T color={C.slate}>{tab === 'Requests' ? 'New requests will appear here while you are online.' : 'Accepted passenger groups will appear here.'}</T>}</>;
  }
  return <><View><T size={27} weight="extra" color={C.navy}>{tab === 'Route' ? 'Your route' : 'Driver dashboard'}</T><T color={C.slate}>{v.code} · {s.user?.name}</T></View>
    <Card><Pill label={v.status.toUpperCase()} tone={v.status === 'online' ? 'green' : 'amber'} /><T size={36} weight="extra" color={C.navy}>{v.passengers} / {v.capacity}</T><T color={C.slate}>Passengers onboard · {v.reservedSeats - v.passengers} seats reserved</T><Button label={v.status === 'offline' ? 'Go online' : 'Go offline'} kind="secondary" disabled={disabled} onPress={() => void s.act('/driver/availability', { online: v.status === 'offline' })} /></Card>
    <MapCard /><Card><T color={C.slate}>Current station</T><T size={24} weight="bold" color={C.navy}>{current?.name}</T><T color={C.slate}>{next ? `Next: ${next.name}` : 'End of route'}</T>{obligation && <T color={C.slate}>Resolve this station’s requests, pickups, and drop-offs before moving.</T>}{next ? <Button label="Confirm next station" kind="navy" disabled={disabled || obligation} onPress={() => void s.act('/driver/advance', { fromStationId: v.currentStationId })} /> : <Button label="Start new route at first station" disabled={disabled || s.rides.length > 0} onPress={() => void s.act('/driver/restart')} />}</Card>
    {s.rides.map((r) => <RideCard key={r.id} ride={r} />)}
  </>;
}
export default function App() {
  const s = useAppStore();
  const [tab, setTab] = useState<Tab>('Home');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const openedFromPush = useRef(false);
  const { resetToken, notification } = useLocalSearchParams<{ resetToken?: string; notification?: string }>();
  useEffect(() => { void useAppStore.getState().init(); }, []);
  useEffect(() => { setTab(openedFromPush.current || notification ? 'Notifications' : 'Home'); if (!s.user?.id) setShowWelcome(true); }, [s.user?.id, notification]);
  useEffect(() => {
    if (!s.user?.verified) { setShowPushPrompt(false); return; }
    let cancelled = false;
    void registerPush(Platform.OS === 'android').then((status) => {
      if (cancelled) return;
      setPushStatus(status);
      if (Platform.OS === 'web' && status === 'prompt' && localStorage.getItem(`push-dismissed-${s.user?.id}`) !== '1') setShowPushPrompt(true);
    });
    return () => { cancelled = true; };
  }, [s.user?.id, s.user?.verified]);
  useEffect(() => {
    if (!s.user?.verified) return;
    return listenForPush(() => { openedFromPush.current = true; setTab('Notifications'); void useAppStore.getState().refresh(); }, () => { void useAppStore.getState().refresh(); });
  }, [s.user?.id, s.user?.verified]);
  useEffect(() => {
    if (!s.user?.verified) return;
    const foreground = () => AppState.currentState === 'active' && (Platform.OS !== 'web' || typeof document === 'undefined' || document.visibilityState !== 'hidden');
    const resume = () => { if (typeof navigator !== 'undefined' && navigator.onLine === false) { useAppStore.setState({ stale: true }); return; } if (foreground()) { void useAppStore.getState().heartbeat(); void useAppStore.getState().refresh(); void registerPush(false); } else useAppStore.setState({ stale: true }); };
    resume();
    const poll = setInterval(() => { if (foreground()) void useAppStore.getState().refresh(); }, 5000);
    const heartbeat = setInterval(() => { if (foreground()) void useAppStore.getState().heartbeat(); }, 30000);
    const subscription = AppState.addEventListener('change', resume);
    if (typeof window !== 'undefined') { window.addEventListener('online', resume); window.addEventListener('offline', resume); document.addEventListener('visibilitychange', resume); }
    return () => { clearInterval(poll); clearInterval(heartbeat); subscription.remove(); if (typeof window !== 'undefined') { window.removeEventListener('online', resume); window.removeEventListener('offline', resume); document.removeEventListener('visibilitychange', resume); } };
  }, [s.user?.id, s.user?.verified]);
  const tabs = s.user?.role === 'driver' ? driverTabs : passengerTabs;
  if (s.ready && !s.user && showWelcome && !resetToken) {
    return <View style={styles.outer}><View style={styles.app}><WelcomeScreen
      onPassenger={() => setShowWelcome(false)}
      onDriver={() => setShowWelcome(false)}
    /></View></View>;
  }
  return <View style={styles.outer}><SafeAreaView style={styles.app} edges={['top', 'bottom']}>
    {!s.ready ? <StartupSkeleton /> : !s.user ? <AccountScreen onBack={() => setShowWelcome(true)} /> : <>
      <View style={styles.header}><Image source={require('../../assets/favicon/web-app-manifest-512x512.png')} style={{ width: 48, height: 48 }} accessibilityLabel="TAPSAKAY logo" /><View style={{ flex: 1 }}><T size={18} weight="extra" color={C.navy}>TAPSAKAY</T><T size={11} color={C.slate}>Tap. Match. Sakay.</T></View><View style={styles.headerActions}>{s.user.role !== 'driver' && <Pill label={s.user.role.toUpperCase()} />}{s.user.role === 'driver' && s.user.verified && <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open driver notifications"
        accessibilityState={{ selected: tab === 'Notifications' }}
        onPress={() => setTab('Notifications')}
        style={({ pressed }) => [styles.notificationButton, (pressed || tab === 'Notifications') && { backgroundColor: C.pale }]}
      ><AppIcon name="notifications-outline" size={23} color={C.navy} /></Pressable>}{s.user.role === 'driver' && s.user.verified && <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open driver profile for ${s.user.name}`}
        accessibilityState={{ selected: tab === 'Profile' }}
        onPress={() => setTab('Profile')}
        style={({ pressed }) => [styles.profileButton, { opacity: pressed ? 0.75 : 1 }, tab === 'Profile' && { borderColor: C.navy }]}
      ><View style={styles.profileAvatar}><AppIcon name="person-outline" size={24} color={C.navy} /></View></Pressable>}</View></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {s.user.verified && showPushPrompt && <Card><T weight="bold">Ride updates on your device</T><T color={C.slate}>Get notified when your ride changes, even when TAPSAKAY is closed.</T><Button label="Enable notifications" onPress={() => { void registerPush(true).then((status) => { setPushStatus(status); setShowPushPrompt(status === 'error' || status === 'prompt'); }); }} /><Button label="Not now" kind="secondary" onPress={() => { localStorage.setItem(`push-dismissed-${s.user?.id}`, '1'); setShowPushPrompt(false); }} /></Card>}
        {pushStatus === 'error' && s.user.verified && <T color={C.slate}>Push notifications are unavailable. Ride updates still appear here while the app is open.</T>}
        {s.error && <View accessibilityRole="alert"><Card style={{ backgroundColor: C.redPale }}><T color={C.red}>{s.error}</T></Card></View>}
        {s.user.verified && s.stale && <Card style={{ backgroundColor: C.amberPale }}><T color={C.ink}>Updates unavailable. Reconnect before changing a ride.</T><Button label="Refresh connection" kind="secondary" onPress={() => void s.refresh()} /></Card>}
        {!s.user.verified ? <><SectionTitle title="Verify your email" /><T color={C.slate}>Open the verification link sent to {s.user.email}, then check again here.</T>{s.message && <View accessibilityLiveRegion="polite" role="status"><T color={C.ink}>{s.message}</T></View>}<Button label="Check verification" onPress={() => void s.checkUser()} /><Button label="Resend verification email" kind="secondary" disabled={s.busy} onPress={() => void s.authAction('verification-notification', {})} /><Profile /></> : !s.dataReady ? <ScreenSkeleton tab={tab} role={s.user.role} /> : s.user.role === 'driver' ? <Driver tab={tab} navigate={setTab} /> : <Passenger tab={tab} navigate={setTab} />}
      </ScrollView>
      {s.user.verified && <View style={styles.nav}>{tabs.map((name) => <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected: tab === name }} onPress={() => setTab(name)} style={styles.navItem}><AppIcon name={icons[name]} size={21} color={tab === name ? C.red : C.slate} /><T size={name === 'Notifications' ? 9 : 10} weight="bold" color={tab === name ? C.red : C.slate}>{name}</T></Pressable>)}</View>}
    </>}
  </SafeAreaView></View>;
}
const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#e8edf7', alignItems: 'center' },
  app: { flex: 1, width: '100%', maxWidth: 520, backgroundColor: C.bg },
  header: { minHeight: 76, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notificationButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  profileButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  profileAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 36, gap: 18 },
  homeStack: { gap: 18 },
  homeGreeting: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 4 },
  passengerAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  homeSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  bookHero: { backgroundColor: C.white, borderRadius: 20, padding: 20, gap: 18, shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 14, elevation: 3 },
  bookHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' },
  routeStrip: { minHeight: 58, backgroundColor: C.white, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  routeStop: { flex: 1, alignItems: 'center', gap: 5, minWidth: 0, position: 'relative' },
  routeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.navy, zIndex: 1 },
  routeLine: { position: 'absolute', height: 2, backgroundColor: C.line, left: '58%', right: '-42%', top: 4 },
  relaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  relaCard: { flexGrow: 1, flexBasis: '46%', padding: 14, gap: 7, minWidth: 140 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nav: { backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line, minHeight: 64, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 5 },
  navItem: { minWidth: 56, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
