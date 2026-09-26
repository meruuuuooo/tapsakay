import { useEffect, useState } from 'react';
import { ScrollView, Pressable, StyleSheet, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type IconName } from '@/components/app-icon';
import { WelcomeScreen } from '@/components/welcome-screen';
import { FindingRela } from '@/components/finding-rela';
import { Image } from 'expo-image';
import { Button, C, Card, Pill, Row, SectionTitle, T } from '@/components/demo-ui';
import { RouteMap } from '@/components/route-map';
import { initialNotices, initialRelas, stationName, stations } from '@/data/mock';
import { useDemoStore } from '@/store/demo';
import type { Rela, Ride } from '@/types/demo';

type PassengerTab = 'Home' | 'Book' | 'Trips' | 'Notifications' | 'Profile';
type DriverTab = 'Home' | 'Requests' | 'Passengers' | 'Route' | 'Menu';
type Tab = PassengerTab | DriverTab;
const passengerTabs: { name: PassengerTab; icon: IconName }[] = [
  { name: 'Home', icon: 'home-outline' }, { name: 'Book', icon: 'ticket-outline' },
  { name: 'Trips', icon: 'navigate-outline' }, { name: 'Notifications', icon: 'notifications-outline' },
  { name: 'Profile', icon: 'person-outline' },
];
const driverTabs: { name: DriverTab; icon: IconName }[] = [
  { name: 'Home', icon: 'home-outline' }, { name: 'Requests', icon: 'mail-outline' },
  { name: 'Passengers', icon: 'people-outline' }, { name: 'Route', icon: 'map-outline' },
  { name: 'Menu', icon: 'menu-outline' },
];

function Timeline({ currentId, pickupId, dropoffId }: { currentId: number; pickupId?: number; dropoffId?: number }) {
  return <View style={styles.timeline}>{stations.map((station, index) => {
    const complete = station.id < currentId;
    const active = station.id === currentId;
    return <View key={station.id} style={styles.stopRow}>
      <View style={styles.rail}><View style={[styles.node, { backgroundColor: complete ? C.green : active ? C.navy : C.white, borderColor: complete ? C.green : active ? C.navy : C.line }]}>
        {complete ? <AppIcon name="checkmark" size={13} color={C.white} /> : active ? <View style={styles.nodeCore} /> : null}
      </View>{index < 4 && <View style={[styles.line, { backgroundColor: complete ? C.green : C.line }]} />}</View>
      <View style={[styles.stopCopy, active && { backgroundColor: C.pale }]}><T size={15} weight={active ? 'bold' : 'medium'} color={active ? C.navy : complete ? C.ink : C.muted}>{station.name}</T>
        {station.id === pickupId && <Pill label="PICKUP" tone="green" />}
        {station.id === dropoffId && <Pill label="DROP-OFF" tone="amber" />}
      </View>
    </View>;
  })}</View>;
}

function RelaCard({ rela }: { rela: Rela }) {
  const seats = rela.capacity - rela.passengers;
  return <Card><Row icon="bus-outline" trailing={<Pill label={rela.status === 'full' ? 'FULL' : rela.status === 'offline' ? 'OFFLINE' : `${seats} SEATS`} tone={rela.status === 'online' ? 'blue' : 'red'} />}>
    <T size={17} weight="bold">{rela.code}</T><T size={12} color={C.slate}>{stationName(rela.currentStationId)} · {rela.status === 'online' ? 'On route' : rela.status}</T>
  </Row></Card>;
}

function RouteMapCard({ relas, ride, pickupId }: { relas: Rela[]; ride?: Ride | null; pickupId?: number }) {
  return <Card>
    <View><T size={17} weight="bold" color={C.navy}>Demo route map</T><T size={12} color={C.slate}>Approximate stops · Simulated rela positions</T></View>
    <RouteMap relas={relas} ride={ride} pickupId={pickupId} />
    <T size={11} color={C.slate}>CBM · CMU Gate · Hospital · Market · Terminal</T>
  </Card>;
}

function BookingForm({ onRequested }: { onRequested: () => void }) {
  const { pickupId, dropoffId, passengerCount, setBooking, requestRide, error } = useDemoStore();
  const submit = () => {
    requestRide();
    if (useDemoStore.getState().ride?.status === 'matching') onRequested();
  };
  return <View style={styles.stack}>
    <View><T size={27} weight="extra" color={C.navy}>Where are you going?</T><T color={C.slate}>Choose your stops on the CBM–Terminal route.</T></View>
    <Card><T size={12} weight="bold" color={C.slate}>PICKUP STATION</T><View style={styles.chips}>{stations.slice(0, 4).map((station) => <Pressable key={station.id} accessibilityRole="button" accessibilityState={{ selected: pickupId === station.id }} onPress={() => setBooking({ pickupId: station.id, dropoffId: dropoffId <= station.id ? station.id + 1 : dropoffId })} style={[styles.chip, pickupId === station.id && styles.chipSelected]}><T size={13} weight="semi" color={pickupId === station.id ? C.white : C.navy}>{station.name}</T></Pressable>)}</View>
      <View style={styles.divider} /><T size={12} weight="bold" color={C.slate}>DROP-OFF STATION</T><View style={styles.chips}>{stations.filter((station) => station.id > pickupId).map((station) => <Pressable key={station.id} accessibilityRole="button" accessibilityState={{ selected: dropoffId === station.id }} onPress={() => setBooking({ dropoffId: station.id })} style={[styles.chip, dropoffId === station.id && styles.chipSelected]}><T size={13} weight="semi" color={dropoffId === station.id ? C.white : C.navy}>{station.name}</T></Pressable>)}</View></Card>
    <Card><Row icon="people-outline" trailing={<View style={styles.counter}><Pressable accessibilityRole="button" accessibilityLabel="Decrease passengers" disabled={passengerCount <= 1} onPress={() => setBooking({ passengerCount: passengerCount - 1 })} style={styles.counterButton}><AppIcon name="remove" size={20} color={passengerCount <= 1 ? C.muted : C.navy} /></Pressable><T weight="bold" size={18} color={C.navy}>{passengerCount}</T><Pressable accessibilityRole="button" accessibilityLabel="Increase passengers" disabled={passengerCount >= 8} onPress={() => setBooking({ passengerCount: passengerCount + 1 })} style={styles.counterButton}><AppIcon name="add" size={20} color={passengerCount >= 8 ? C.muted : C.navy} /></Pressable></View>}><T weight="bold">Passengers</T><T size={12} color={C.slate}>1 to 8 seats</T></Row></Card>
    {error && <Card style={{ backgroundColor: C.redPale }}><T color={C.red} weight="semi">{error}</T></Card>}
    <Button label="Request ride" onPress={submit} icon="arrow-forward" />
  </View>;
}

function PassengerRide({ ride, rela, onBook, onCancel, onDriver }: { ride: Ride; rela?: Rela; onBook: () => void; onCancel: () => void; onDriver: () => void }) {
  const current = rela?.currentStationId ?? ride.pickupId;
  const heading = { matching: 'Finding a nearby rela', requested: 'Rela matched', accepted: 'Driver accepted', waiting_pickup: 'Waiting for pickup', onboard: 'You’re onboard', approaching_dropoff: current === ride.dropoffId ? 'You’ve reached your stop' : 'Your destination is next', completed: 'Ride complete', cancelled: 'Ride cancelled' }[ride.status];
  return <View style={styles.stack}>
    <View style={[styles.hero, ride.status === 'completed' && { backgroundColor: C.green }]}><Pill label={ride.status === 'matching' ? 'MATCHING' : ride.status === 'completed' ? 'COMPLETED' : 'LIVE DEMO'} tone={ride.status === 'completed' ? 'green' : 'amber'} /><T size={28} weight="extra" color={C.white}>{heading}</T>
      <T color={C.white}>{ride.status === 'matching' ? 'Checking the route and available seats…' : ride.status === 'requested' ? 'Your driver is reviewing the request.' : ride.status === 'cancelled' ? 'You can request another ride.' : `${stationName(ride.pickupId)}  →  ${stationName(ride.dropoffId)}`}</T></View>
    {rela && <RouteMapCard relas={[rela]} ride={ride} pickupId={ride.pickupId} />}
    {rela && <Card><Row icon="bus-outline" trailing={<Pill label={`${rela.capacity - rela.passengers} SEATS`} />}><T size={18} weight="bold">{rela.code}</T><T size={12} color={C.slate}>{rela.driverName} · Demo ETA ~2 min</T></Row></Card>}
    <Card><SectionTitle title="Trip details" /><Row icon="location-outline"><T size={12} color={C.slate}>Pickup</T><T weight="bold">{stationName(ride.pickupId)}</T></Row><Row icon="flag-outline"><T size={12} color={C.slate}>Drop-off</T><T weight="bold">{stationName(ride.dropoffId)}</T></Row><Row icon="people-outline"><T size={12} color={C.slate}>Passengers</T><T weight="bold">{ride.passengerCount}</T></Row></Card>
    {['waiting_pickup', 'onboard', 'approaching_dropoff'].includes(ride.status) && <Card><SectionTitle title="Route progress" /><Timeline currentId={current} pickupId={ride.pickupId} dropoffId={ride.dropoffId} /></Card>}
    {['requested', 'accepted', 'waiting_pickup', 'onboard', 'approaching_dropoff'].includes(ride.status) && <Button label="Open driver demo" kind="navy" onPress={onDriver} />}
    {ride.status === 'waiting_pickup' && <Pill label={`Driver: confirm pickup at ${stationName(ride.pickupId)}`} tone="amber" />}
    {ride.status === 'approaching_dropoff' && <Pill label={current === ride.dropoffId ? 'Driver: confirm drop-off now' : 'Your destination is next'} tone="amber" />}
    {['matching', 'requested', 'accepted', 'waiting_pickup'].includes(ride.status) && <Button label="Cancel request" kind="secondary" onPress={onCancel} />}
    {['completed', 'cancelled'].includes(ride.status) && <Button label={ride.status === 'completed' ? 'Reset and book again' : 'Book another ride'} onPress={onBook} icon="arrow-forward" />}
  </View>;
}

function TripTrackingScreen({ ride, rela, error, onBack, onCancel, onBook, onDriver }: {
  ride: Ride | null; rela?: Rela; error: string | null; onBack: () => void; onCancel: () => void; onBook: () => void; onDriver: () => void;
}) {
  return <View style={styles.trackingScreen}>
    <View style={styles.trackingHeader}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to passenger tabs" onPress={onBack} style={styles.trackingBack}><AppIcon name="arrow-back" size={22} color={C.ink} /></Pressable>
      <T size={16} weight="bold" color={C.ink} style={{ flex: 1 }}>Live Trip Tracking</T>
      <Image source={require('../../assets/favicon/web-app-manifest-512x512.png')} style={styles.trackingLogo} contentFit="contain" accessibilityLabel="TAPSAKAY logo" />
    </View>
    <ScrollView contentContainerStyle={styles.trackingScroll} showsVerticalScrollIndicator={false}>
      {ride?.status === 'matching' ? <FindingRela ride={ride} onCancel={onCancel} /> : ride ? <View style={styles.trackingBody}><PassengerRide ride={ride} rela={rela} onBook={onBook} onCancel={onCancel} onDriver={onDriver} /></View> : <View style={styles.trackingBody}><View style={styles.hero}><T size={24} weight="extra" color={C.white}>No rela available yet</T><T color={C.white}>{error ?? 'Try another pickup or fewer passengers.'}</T></View><Button label="Change pickup or seats" onPress={onBook} icon="arrow-forward" /></View>}
    </ScrollView>
  </View>;
}

function PassengerScreen({ tab, navigate, openTracking, onRequested }: { tab: PassengerTab; navigate: (tab: PassengerTab) => void; openTracking: () => void; onRequested: () => void }) {
  const state = useDemoStore();
  const activeRela = state.relas.find((rela) => rela.id === state.ride?.relaId);
  if (tab === 'Home') return <View style={styles.stack}><View><T size={27} weight="extra" color={C.navy}>Good day!</T><T color={C.slate}>Let’s ride with TAPSAKAY.</T></View>
    <Card><Row icon="location-outline" trailing={<Pill label="MOCK LOCATION" />}><T size={12} color={C.slate}>YOUR LOCATION</T><T size={20} weight="bold">{stationName(state.pickupId)}</T></Row><Button label="Confirm location" onPress={() => navigate('Book')} icon="arrow-forward" /></Card>
    <RouteMapCard relas={state.relas} ride={state.ride} pickupId={state.pickupId} />
    {state.ride && !['completed', 'cancelled'].includes(state.ride.status) && <Pressable accessibilityRole="button" onPress={openTracking}><Card style={{ backgroundColor: C.pale }}><T weight="bold" color={C.navy}>Active ride · Open tracking</T><T>{stationName(state.ride.pickupId)} → {stationName(state.ride.dropoffId)}</T><Pill label={state.ride.status.replaceAll('_', ' ').toUpperCase()} tone="amber" /></Card></Pressable>}
    <SectionTitle title="Nearby relas" action={<T size={12} color={C.slate}>3 on this route</T>} />{state.relas.map((rela) => <RelaCard key={rela.id} rela={rela} />)}
  </View>;
  if (tab === 'Book') return state.ride && !['completed', 'cancelled'].includes(state.ride.status) ? <View style={styles.stack}><SectionTitle title="Ride in progress" /><Card><T weight="bold">{stationName(state.ride.pickupId)} → {stationName(state.ride.dropoffId)}</T><T color={C.slate}>Your request is already active.</T><Button label="Open live tracking" onPress={openTracking} /></Card></View> : <BookingForm onRequested={onRequested} />;
  if (tab === 'Trips') return <View style={styles.stack}><SectionTitle title="Your trip" /><RouteMapCard relas={activeRela ? [activeRela] : []} ride={state.ride} pickupId={state.ride?.pickupId} />{state.ride ? <Card><T size={18} weight="bold">{stationName(state.ride.pickupId)} → {stationName(state.ride.dropoffId)}</T><Pill label={state.ride.status.replaceAll('_', ' ').toUpperCase()} tone={state.ride.status === 'completed' ? 'green' : 'amber'} /><Button label={state.ride.status === 'completed' ? 'View trip summary' : 'Open live tracking'} onPress={openTracking} /></Card> : <Card><T weight="bold">No rides yet</T><T color={C.slate}>Book a ride to see its progress here.</T><Button label="Book a ride" onPress={() => navigate('Book')} /></Card>}</View>;
  if (tab === 'Notifications') return <View style={styles.stack}><SectionTitle title="Notifications" />{state.notices.filter((item) => item.audience === 'passenger').map((item) => <Card key={item.id}><Row icon="notifications-outline"><T weight="bold">{item.title}</T><T size={13} color={C.slate}>{item.detail}</T></Row></Card>)}</View>;
  return <View style={styles.stack}><SectionTitle title="Profile" /><Card><Row icon="person-outline"><T weight="bold">Demo passenger</T><T size={12} color={C.slate}>Local prototype profile</T></Row></Card><Card><T weight="bold">Try the driver view</T><T color={C.slate}>Both roles share this ride on this device.</T><Button label="Switch to Driver" kind="navy" onPress={() => state.setRole('driver')} /></Card></View>;
}

function DriverScreen({ tab, navigate }: { tab: DriverTab; navigate: (tab: DriverTab) => void }) {
  const state = useDemoStore();
  const ride = state.ride;
  const rela = state.relas.find((item) => item.id === (ride?.relaId ?? 1))!;
  const available = rela.capacity - rela.passengers;
  const pickupReady = ride?.status === 'waiting_pickup' && rela.currentStationId === ride.pickupId;
  const dropoffReady = ride && ['onboard', 'approaching_dropoff'].includes(ride.status) && rela.currentStationId === ride.dropoffId;
  const moveBlocked = rela.currentStationId === 5 || !!dropoffReady || !!pickupReady ||
    !!(ride?.relaId === rela.id && (['requested', 'accepted', 'waiting_pickup'].includes(ride.status) && rela.currentStationId >= ride.pickupId || ['onboard', 'approaching_dropoff'].includes(ride.status) && rela.currentStationId >= ride.dropoffId));
  if (tab === 'Home') return <View style={styles.stack}><View><T size={27} weight="extra" color={C.navy}>Driver dashboard</T><T color={C.slate}>{rela.code} · {rela.driverName}</T></View>
    <View style={[styles.hero, { backgroundColor: C.navy }]}><Pill label={rela.status.toUpperCase()} tone={rela.status === 'offline' ? 'red' : rela.status === 'full' ? 'amber' : 'green'} /><T size={42} weight="extra" color={C.white}>{rela.passengers} / {rela.capacity}</T><T color={C.white}>Passengers onboard · {available} seats available</T></View>
    <Button label={rela.status === 'offline' ? 'Go online' : 'Go offline'} kind="secondary" onPress={() => state.setDriverOnline(rela.status === 'offline')} />
    <Card><Row icon="location-outline"><T size={12} color={C.slate}>CURRENT STATION</T><T size={21} weight="bold">{stationName(rela.currentStationId)}</T></Row><View style={styles.divider} /><Row icon="arrow-forward-circle-outline"><T size={12} color={C.slate}>NEXT STATION</T><T size={18} weight="bold">{rela.currentStationId < 5 ? stationName(rela.currentStationId + 1) : 'End of route'}</T></Row></Card>
    {ride?.status === 'requested' && <Button label="View incoming request" onPress={() => navigate('Requests')} icon="arrow-forward" />}
    {pickupReady && <Button label="Confirm pickup" onPress={state.pickupPassenger} icon="people-outline" />}
    {dropoffReady && <Button label="Confirm drop-off" onPress={state.dropoffPassenger} icon="flag-outline" />}
    <Button label="Next station" kind="navy" disabled={moveBlocked} onPress={() => state.moveStation(1)} icon="arrow-forward" />
  </View>;
  if (tab === 'Requests') return <View style={styles.stack}><SectionTitle title="Requests" />{ride?.status === 'requested' ? <Card><Pill label="NEW REQUEST" tone="amber" /><T size={22} weight="bold">{ride.passengerCount} passenger{ride.passengerCount > 1 ? 's' : ''}</T><T>{stationName(ride.pickupId)} → {stationName(ride.dropoffId)}</T><T size={12} color={C.slate}>{rela.code} · {available} seats available</T><Button label="Accept request" onPress={state.acceptRide} /><Button label="Decline" kind="secondary" onPress={state.declineRide} /></Card> : <Card><T weight="bold">No new requests</T><T color={C.slate}>Passenger requests appear here after matching.</T></Card>}</View>;
  if (tab === 'Passengers') return <View style={styles.stack}><SectionTitle title="Passengers" /><Card><T size={35} weight="extra" color={C.navy}>{rela.passengers} / {rela.capacity}</T><T color={C.slate}>{available} seats available</T></Card><Card><T weight="bold">Existing riders</T><T color={C.slate}>{initialRelas.find((item) => item.id === rela.id)?.passengers ?? 0} mock riders are included in the starting occupancy.</T></Card>{ride && ['onboard', 'approaching_dropoff'].includes(ride.status) && <Card><T weight="bold">Current demo group</T><T>{ride.passengerCount} passengers · {stationName(ride.pickupId)} → {stationName(ride.dropoffId)}</T></Card>}{pickupReady && <Button label="Picked up" onPress={state.pickupPassenger} />}{dropoffReady && <Button label="Dropped off" onPress={state.dropoffPassenger} />}</View>;
  if (tab === 'Route') return <View style={styles.stack}><SectionTitle title="Route" /><RouteMapCard relas={[rela]} ride={ride} /><Card><Timeline currentId={rela.currentStationId} pickupId={ride?.pickupId} dropoffId={ride?.dropoffId} /></Card>{dropoffReady && <Card style={{ backgroundColor: C.amberPale }}><T weight="bold" color={C.navy}>Drop-off at {stationName(ride.dropoffId)}</T><T>{ride.passengerCount} passengers are ready to leave.</T><Button label="Dropped off" onPress={state.dropoffPassenger} /></Card>}{pickupReady && <Card style={{ backgroundColor: C.amberPale }}><T weight="bold">Pickup at {stationName(ride.pickupId)}</T><Button label="Picked up" onPress={state.pickupPassenger} /></Card>}<Button label="Next station" kind="navy" disabled={moveBlocked} onPress={() => state.moveStation(1)} /></View>;
  return <View style={styles.stack}><SectionTitle title="Demo controls" /><Card><T weight="bold">One-device simulation</T><T color={C.slate}>Switch roles to see the same ride from both sides.</T><Button label="Switch to Passenger" kind="navy" onPress={() => state.setRole('passenger')} /></Card><Card><T weight="bold">Move the rela</T><Button label="Previous station" kind="secondary" onPress={() => state.moveStation(-1)} disabled={rela.currentStationId === 1 || !!(ride && ['onboard', 'approaching_dropoff'].includes(ride.status))} /><Button label="Next station" kind="secondary" onPress={() => state.moveStation(1)} disabled={moveBlocked} /></Card><Card><T weight="bold">Force steps</T><T size={12} color={C.slate}>Actions only work when the ride is ready for that step.</T><Button label="Force request" kind="secondary" onPress={state.requestRide} /><Button label="Force accept" kind="secondary" onPress={state.acceptRide} /><Button label="Force pickup" kind="secondary" onPress={state.pickupPassenger} /><Button label="Force drop-off" kind="secondary" onPress={state.dropoffPassenger} /></Card><Button label="Reset demo" kind="danger" onPress={() => { state.resetDemo(); navigate('Home'); }} icon="refresh-outline" /></View>;
}

export default function DemoApp() {
  const role = useDemoStore((state) => state.role);
  const setRole = useDemoStore((state) => state.setRole);
  const ride = useDemoStore((state) => state.ride);
  const error = useDemoStore((state) => state.error);
  const relas = useDemoStore((state) => state.relas);
  const cancelRide = useDemoStore((state) => state.cancelRide);
  const resetDemo = useDemoStore((state) => state.resetDemo);
  const notices = useDemoStore((state) => state.notices);
  const latestNotice = notices.find((item) => item.audience === role && item.id !== initialNotices[0].id);
  const [tab, setTab] = useState<Tab>('Home');
  const [showWelcome, setShowWelcome] = useState(true);
  const [trackingOpen, setTrackingOpen] = useState(false);
  useEffect(() => { setTab('Home'); setTrackingOpen(false); }, [role]);
  const tabs = role === 'passenger' ? passengerTabs : driverTabs;
  if (showWelcome) return <View style={styles.outer}><View style={styles.app}><WelcomeScreen
    onPassenger={() => { setRole('passenger'); setShowWelcome(false); }}
    onDriver={() => { setRole('driver'); setShowWelcome(false); }}
  /></View></View>;
  if (trackingOpen && role === 'passenger') return <View style={styles.outer}><SafeAreaView style={styles.app} edges={['top', 'bottom']}><TripTrackingScreen
    ride={ride}
    rela={relas.find((rela) => rela.id === ride?.relaId)}
    error={error}
    onBack={() => setTrackingOpen(false)}
    onCancel={() => { cancelRide(); setTrackingOpen(false); setTab('Book'); }}
    onBook={() => { if (ride?.status === 'completed') resetDemo(); setTrackingOpen(false); setTab('Book'); }}
    onDriver={() => { setTrackingOpen(false); setRole('driver'); }}
  /></SafeAreaView></View>;
  return <View style={styles.outer}><SafeAreaView style={styles.app} edges={['top', 'bottom']}>
    <View style={styles.header}><Image source={require('../../assets/favicon/web-app-manifest-512x512.png')} style={styles.brandLogo} contentFit="contain" accessibilityLabel="TAPSAKAY logo" /><View style={{ flex: 1 }}><T size={18} weight="extra" color={C.navy}>TAPSAKAY</T><T size={11} color={C.slate}>Tap. Match. Sakay.</T></View><Pressable accessibilityRole="button" accessibilityLabel={`Switch to ${role === 'passenger' ? 'Driver' : 'Passenger'}`} onPress={() => setRole(role === 'passenger' ? 'driver' : 'passenger')} style={styles.roleSwitch}><AppIcon name={role === 'passenger' ? 'person-outline' : 'speedometer-outline'} size={15} color={C.navy} /><T size={11} weight="bold" color={C.navy}>{role === 'passenger' ? 'Passenger' : 'Driver'}</T><AppIcon name="swap-horizontal" size={14} color={C.navy} /></Pressable></View>
    {latestNotice && <View style={styles.banner}><AppIcon name="notifications" size={16} color={C.navy} /><T size={12} weight="semi" color={C.navy} numberOfLines={1}>{latestNotice.title}</T></View>}
    <ScrollView key={`${role}-${tab}`} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {role === 'passenger' ? <PassengerScreen tab={tab as PassengerTab} navigate={setTab} openTracking={() => setTrackingOpen(true)} onRequested={() => setTrackingOpen(true)} /> : <DriverScreen tab={tab as DriverTab} navigate={setTab} />}
    </ScrollView>
    <View style={styles.nav}>{tabs.map(({ name, icon }) => <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected: tab === name }} onPress={() => setTab(name)} style={styles.navItem}><AppIcon name={icon} size={21} color={tab === name ? C.red : C.muted} /><T size={name === 'Notifications' ? 9 : 10} weight={tab === name ? 'bold' : 'medium'} color={tab === name ? C.red : C.muted}>{name}</T></Pressable>)}</View>
  </SafeAreaView></View>;
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#e8edf7', alignItems: 'center' },
  app: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 520 : undefined, backgroundColor: C.bg },
  header: { height: 73, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white },
  brandLogo: { width: 50, height: 50 },
  trackingScreen: { flex: 1, backgroundColor: C.bg },
  trackingHeader: { minHeight: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.line },
  trackingBack: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  trackingLogo: { width: 34, height: 34 },
  trackingScroll: { flexGrow: 1 },
  trackingBody: { padding: 20, gap: 16, flexGrow: 1 },
  roleSwitch: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: C.pale },
  banner: { height: 35, paddingHorizontal: 20, backgroundColor: C.amberPale, flexDirection: 'row', alignItems: 'center', gap: 8 },
  content: { padding: 20, paddingBottom: 36 }, stack: { gap: 16 },
  hero: { backgroundColor: C.navy, borderRadius: 18, padding: 24, gap: 12, minHeight: 165, justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 39, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.pale, justifyContent: 'center' },
  chipSelected: { backgroundColor: C.navy }, divider: { height: 1, backgroundColor: C.line, marginVertical: 4 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: C.pale, borderRadius: 10 },
  timeline: { paddingTop: 3 }, stopRow: { flexDirection: 'row', minHeight: 65, gap: 12 }, rail: { width: 27, alignItems: 'center' },
  node: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  nodeCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.white }, line: { width: 2, flex: 1 },
  stopCopy: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderRadius: 10 },
  nav: { backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line, minHeight: 64, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 5 },
  navItem: { minWidth: 56, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
