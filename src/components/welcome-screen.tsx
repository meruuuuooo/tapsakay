import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { AppIcon } from '@/components/app-icon';
import { Button, C, T } from '@/components/demo-ui';

const buildings = [
  { x: 8, y: 149, w: 32, h: 81 }, { x: 43, y: 125, w: 28, h: 105 },
  { x: 74, y: 139, w: 31, h: 91 }, { x: 109, y: 107, w: 42, h: 123 },
  { x: 155, y: 135, w: 28, h: 95 }, { x: 187, y: 117, w: 35, h: 113 },
  { x: 227, y: 145, w: 30, h: 85 }, { x: 260, y: 113, w: 39, h: 117 },
  { x: 303, y: 130, w: 30, h: 100 }, { x: 337, y: 151, w: 42, h: 79 },
];

function RoadScene({ height }: { height: number }) {
  return <Svg width="100%" height={height} viewBox="0 0 390 380" accessibilityLabel="A curved road leading from the city skyline toward the TAPSAKAY route">
    <Defs>
      <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#f8f9ff" />
        <Stop offset="1" stopColor="#eaf1fc" />
      </LinearGradient>
      <LinearGradient id="road" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#355e93" />
        <Stop offset="1" stopColor="#082e66" />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="390" height="380" fill="url(#sky)" />
    <Circle cx="304" cy="69" r="37" fill="#fff8e6" />
    <Circle cx="304" cy="69" r="23" fill="#ffdfa0" />
    <Path d="M0 224 C72 207 117 209 177 221 C238 199 310 204 390 225 L390 280 L0 280 Z" fill="#dce8f7" />
    <G>
      {buildings.map((building, index) => <G key={building.x}>
        <Rect x={building.x} y={building.y} width={building.w} height={building.h} rx="2" fill={index % 3 === 0 ? '#8fa9c9' : index % 3 === 1 ? '#b3c6df' : '#9db6d3'} />
        {[building.y + 17, building.y + 34, building.y + 51, building.y + 68].filter((y) => y < 219).map((y) => <G key={y}>
          <Rect x={building.x + 7} y={y} width="5" height="8" rx="1" fill="#f3f7fc" opacity="0.7" />
          <Rect x={building.x + building.w - 12} y={y} width="5" height="8" rx="1" fill="#f3f7fc" opacity="0.7" />
        </G>)}
      </G>)}
    </G>
    <Path d="M0 228 C87 215 136 231 192 229 C270 218 326 214 390 227 L390 295 L0 295 Z" fill="#c9d9ee" opacity="0.8" />
    <Path d="M178 220 C178 276 122 327 16 380 L374 380 C269 328 216 279 210 220 Z" fill="#8aa6c7" opacity="0.4" />
    <Path d="M184 220 C183 274 131 330 29 380 L361 380 C263 328 213 277 204 220 Z" fill="url(#road)" />
    <Path d="M191 221 C190 281 179 326 150 380" stroke="#e5f0ff" strokeWidth="3" fill="none" opacity="0.72" />
    <Path d="M204 221 C220 279 260 333 331 380" stroke="#e5f0ff" strokeWidth="3" fill="none" opacity="0.72" />
    <Path d="M197 226 C199 271 211 317 239 380" stroke="#f4ae0b" strokeWidth="4" strokeDasharray="9 11" strokeLinecap="round" fill="none" />
    <Circle cx="197" cy="219" r="15" fill="#ffffff" />
    <Circle cx="197" cy="219" r="9" fill="#e3202a" />
    <Circle cx="197" cy="219" r="3" fill="#ffffff" />
  </Svg>;
}

export function WelcomeScreen({ onPassenger, onDriver }: { onPassenger: () => void; onDriver: () => void }) {
  const { height } = useWindowDimensions();
  const compact = height < 720;
  const sceneHeight = compact ? Math.min(210, height * 0.3) : Math.min(350, Math.max(250, height * 0.39));
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <ScrollView contentContainerStyle={[styles.content, compact && styles.compactContent]} showsVerticalScrollIndicator={false}>
      <View style={styles.brand}>
        <Image source={require('../../assets/favicon/web-app-manifest-512x512.png')} style={[styles.logo, compact && styles.compactLogo]} contentFit="contain" accessibilityLabel="TAPSAKAY logo" />
        <View style={styles.wordmark}><T size={compact ? 26 : 33} weight="extra" color={C.navy}>TAP</T><T size={compact ? 26 : 33} weight="extra" color={C.red}>SAKAY</T></View>
        <T size={compact ? 12 : 14} weight="semi" color={C.slate}>Tap. Match. Sakay.</T>
      </View>
      <View style={[styles.scene, compact && styles.compactScene]}><RoadScene height={sceneHeight} /><View style={styles.routeTag}><AppIcon name="location-outline" size={15} color={C.navy} /><T size={11} weight="bold" color={C.navy}>CBM  →  TERMINAL</T></View></View>
      <View style={styles.bottom}>
        <T size={compact ? 24 : 29} weight="extra" color={C.navy} style={styles.heading}>Your route starts here.</T>
        <T size={compact ? 13 : 15} color={C.slate} style={styles.description}>Choose a stop, match with a rela, and follow the ride.</T>
        <View style={[styles.actions, compact && styles.compactActions]}><Button label="Continue as passenger" onPress={onPassenger} icon="arrow-forward" /><Pressable accessibilityRole="button" onPress={onDriver} style={styles.driverButton}><T size={14} weight="bold" color={C.navy}>Open driver demo</T><AppIcon name="arrow-forward" size={17} color={C.navy} /></Pressable></View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { flexGrow: 1, justifyContent: 'space-between', paddingTop: 20, paddingBottom: 22 },
  compactContent: { paddingTop: 8, paddingBottom: 8 },
  brand: { alignItems: 'center', gap: 3, paddingHorizontal: 20 },
  logo: { width: 110, height: 110, marginBottom: 2 },
  compactLogo: { width: 78, height: 78, marginBottom: 0 },
  wordmark: { flexDirection: 'row', alignItems: 'center' },
  scene: { width: '100%', overflow: 'hidden', marginTop: 16, marginBottom: 12 },
  compactScene: { marginTop: 5, marginBottom: 3 },
  routeTag: { position: 'absolute', top: 11, left: 20, backgroundColor: C.white, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 99, flexDirection: 'row', alignItems: 'center', gap: 7 },
  bottom: { alignItems: 'center', paddingHorizontal: 28 },
  heading: { textAlign: 'center' },
  description: { textAlign: 'center', marginTop: 5, maxWidth: 310 },
  actions: { width: '100%', marginTop: 25, gap: 8 },
  compactActions: { marginTop: 12, gap: 2 },
  driverButton: { minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
});
