import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { AppIcon } from '@/components/app-icon';
import { Button, C, T } from '@/components/demo-ui';
import { stationName } from '@/data/mock';
import type { Ride } from '@/types/demo';

function RelaIllustration() {
  return <Svg width={68} height={68} viewBox="0 0 64 64" accessibilityLabel="Illustration of a yellow rela">
    <Rect x="10" y="16" width="44" height="26" rx="6" fill={C.amber} />
    <Path d="M10 26H54V38C54 40.2 52.2 42 50 42H14C11.8 42 10 40.2 10 38V26Z" fill={C.navy} />
    <Rect x="14" y="20" width="10" height="9" rx="2" fill="#dbe9ff" />
    <Rect x="27" y="20" width="10" height="9" rx="2" fill="#dbe9ff" />
    <Rect x="40" y="20" width="10" height="9" rx="2" fill="#dbe9ff" />
    <Path d="M48 30L56 34V41H48V30Z" fill={C.amber} />
    <Circle cx="20" cy="44" r="5" fill={C.ink} /><Circle cx="20" cy="44" r="2" fill="#d3e4fd" />
    <Circle cx="44" cy="44" r="5" fill={C.ink} /><Circle cx="44" cy="44" r="2" fill="#d3e4fd" />
    <Circle cx="55" cy="42" r="3.5" fill={C.ink} /><Circle cx="55" cy="42" r="1.5" fill="#d3e4fd" />
    <Circle cx="51" cy="34" r="2.5" fill={C.white} />
    <Rect x="12" y="34" width="3" height="4" rx="1" fill={C.red} />
  </Svg>;
}

function ScanningRadar() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted || reduceMotion) return;
      animation = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }));
      animation.start();
    });
    return () => { mounted = false; animation?.stop(); pulse.setValue(0); };
  }, [pulse]);
  return <View style={styles.radar} accessibilityLabel="Scanning for an available rela">
    <Animated.View style={[styles.pulseRing, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.28] }) }] }]} />
    <View style={styles.ringOuter}><View style={styles.ringMiddle}><View style={styles.ringInner}>
      <RelaIllustration />
      <View style={styles.scanningPill}><View style={styles.scanningDot} /><T size={10} weight="bold" color={C.navy}>SCANNING</T></View>
    </View></View></View>
  </View>;
}

export function FindingRela({ ride, onCancel }: { ride: Ride; onCancel: () => void }) {
  return <View style={styles.content}>
    <View style={styles.intro} accessibilityLiveRegion="polite">
      <T size={24} weight="extra" color={C.navy} style={styles.center}>Finding a rela for you…</T>
      <T size={14} color={C.slate} style={styles.center}>We’re checking nearby relas with enough seats for your route.</T>
    </View>
    <ScanningRadar />
    <View style={styles.dots}><View style={[styles.dot, styles.dotActive]} /><View style={styles.dot} /><View style={styles.dot} /></View>
    <View style={styles.pickupCard}>
      <View style={styles.pickupIcon}><AppIcon name="navigate-outline" size={21} color={C.navy} /></View>
      <View style={styles.pickupCopy}><T size={10} weight="bold" color={C.muted}>PICKUP POINT</T><T size={15} weight="bold">{stationName(ride.pickupId)}</T><T size={12} color={C.slate}>To {stationName(ride.dropoffId)}</T></View>
      <View style={styles.seatCopy}><T size={11} color={C.slate}>Demo route</T><T size={13} weight="bold" color={C.red}>{ride.passengerCount} {ride.passengerCount === 1 ? 'seat' : 'seats'}</T></View>
    </View>
    <View style={styles.infoCard}><View style={styles.infoIcon}><T size={13} weight="bold" color={C.white}>i</T></View><View style={styles.infoCopy}><T size={13} weight="bold" color={C.navy}>This may take a few moments</T><T size={12} color={C.slate}>Checking online relas that can reach {stationName(ride.pickupId)}.</T></View></View>
    <View style={styles.bottom}><Button label="Cancel request" kind="secondary" onPress={onCancel} /><T size={11} color={C.muted} style={styles.center}>Your request is still searching until you cancel it.</T></View>
  </View>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 26, gap: 18 },
  intro: { alignItems: 'center', gap: 6 }, center: { textAlign: 'center' },
  radar: { height: 196, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#d3e4fd' },
  ringOuter: { width: 176, height: 176, borderRadius: 88, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f0ff' },
  ringMiddle: { width: 146, height: 146, borderRadius: 73, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dbe9ff' },
  ringInner: { width: 116, height: 116, borderRadius: 58, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, gap: 0, shadowColor: C.navy, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 3 },
  scanningPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: '#dce8ff' },
  scanningDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.red },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: -9 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.muted }, dotActive: { backgroundColor: C.red },
  pickupCard: { minHeight: 78, padding: 13, borderRadius: 13, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 1 },
  pickupIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' },
  pickupCopy: { flex: 1, gap: 1 }, seatCopy: { alignItems: 'flex-end', gap: 2 },
  infoCard: { backgroundColor: '#edf3ff', borderRadius: 12, padding: 13, flexDirection: 'row', gap: 10 },
  infoIcon: { width: 23, height: 23, borderRadius: 12, backgroundColor: '#385da2', alignItems: 'center', justifyContent: 'center' }, infoCopy: { flex: 1, gap: 3 },
  bottom: { marginTop: 'auto', gap: 8, paddingTop: 16 },
});
