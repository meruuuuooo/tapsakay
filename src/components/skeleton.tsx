import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { Card } from '@/components/demo-ui';

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: {
  width?: ViewStyle['width']; height?: number; radius?: number; style?: ViewStyle;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!mounted || reduced) return;
      animation = Animated.loop(Animated.timing(progress, { toValue: 1, duration: 1200, useNativeDriver: true }));
      animation.start();
    });
    return () => { mounted = false; animation?.stop(); progress.setValue(0); };
  }, [progress]);
  const travel = typeof width === 'number' ? width : 280;
  return <View accessible={false} style={[styles.base, { width, height, borderRadius: radius }, style]}>
    <Animated.View accessible={false} style={[styles.shine, { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-travel, travel] }) }] }]} />
  </View>;
}

function Lines({ count = 2, widths = ['92%', '68%'] }: { count?: number; widths?: string[] }) {
  return <View style={styles.lines}>{Array.from({ length: count }, (_, i) => <Skeleton key={i} width={widths[i % widths.length] as `${number}%`} height={12} radius={6} />)}</View>;
}

function BaseScreen({ title = true, children }: { title?: boolean; children: ReactNode }) {
  return <View accessible accessibilityRole="progressbar" accessibilityLabel="Loading screen" style={styles.screen}>
    {title && <View style={styles.heading}><Skeleton width="48%" height={25} radius={8} /><Skeleton width="72%" height={13} radius={6} /></View>}
    {children}
  </View>;
}

export function ScreenSkeleton({ tab, role }: { tab: string; role: 'passenger' | 'driver' }) {
  if (tab === 'Book') return <BaseScreen><Card><Skeleton width="42%" height={18} /><Lines count={3} widths={['74%', '88%', '58%']} /></Card><Card><Skeleton width="35%" height={18} /><View style={styles.chips}>{[1, 2, 3].map((i) => <Skeleton key={i} width={92} height={42} radius={12} />)}</View></Card><Skeleton height={52} radius={12} /></BaseScreen>;
  if (tab === 'Trips' || tab === 'Requests' || tab === 'Passengers') return <BaseScreen><Card><Skeleton width="70%" height={20} /><Lines count={2} /></Card><Card><Skeleton width="82%" height={20} /><Lines count={2} /></Card><Card><Skeleton width="58%" height={20} /><Lines count={2} /></Card></BaseScreen>;
  if (tab === 'Notifications') return <BaseScreen><Card><Skeleton width="64%" height={18} /><Lines count={2} /></Card><Card><Skeleton width="78%" height={18} /><Lines count={2} /></Card><Card><Skeleton width="52%" height={18} /><Lines count={2} /></Card></BaseScreen>;
  if (tab === 'Profile') return <BaseScreen><Card><Skeleton width="48%" height={25} /><Skeleton width="68%" height={14} /><Skeleton width={82} height={30} radius={99} /></Card><Skeleton height={52} radius={12} /></BaseScreen>;
  if (role === 'driver') return <BaseScreen><Card><Skeleton width="32%" height={34} /><Lines count={2} /><Skeleton height={48} radius={12} /></Card><Card><Skeleton width="52%" height={20} /><Skeleton height={180} radius={14} /></Card><Card><Skeleton width="64%" height={20} /><Lines count={2} /></Card></BaseScreen>;
  return <View accessible accessibilityRole="progressbar" accessibilityLabel="Loading home screen" style={styles.screen}>
    <View style={styles.homeHeading}><View style={{ flex: 1, gap: 8 }}><Skeleton width="26%" height={13} /><Skeleton width="62%" height={28} /><Skeleton width="88%" height={14} /></View><Skeleton width={52} height={52} radius={26} /></View>
    <Card><View style={styles.row}><Skeleton width={44} height={44} radius={14} /><Skeleton width={88} height={24} radius={99} /></View><Skeleton width="66%" height={24} /><Skeleton width="88%" height={14} /><Skeleton height={50} radius={12} /></Card>
    <Skeleton height={58} radius={16} /><Card><Skeleton width="42%" height={20} /><Skeleton height={190} radius={14} /></Card>
  </View>;
}

export function StartupSkeleton() {
  return <View accessible accessibilityRole="progressbar" accessibilityLabel="Loading TAPSAKAY" style={styles.startup}><Skeleton width={72} height={72} radius={22} /><Skeleton width="48%" height={25} /><Skeleton width="62%" height={14} /><Skeleton width="78%" height={52} radius={12} /></View>;
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', backgroundColor: '#dce7f7' },
  shine: { position: 'absolute', top: 0, bottom: 0, width: 120, backgroundColor: 'rgba(255,255,255,0.55)', transform: [{ skewX: '-18deg' }] },
  screen: { gap: 18, paddingTop: 4 },
  heading: { gap: 8 },
  lines: { gap: 9 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  homeHeading: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  startup: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 },
});
