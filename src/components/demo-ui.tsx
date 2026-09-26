import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { AppIcon, type IconName } from '@/components/app-icon';

export const C = {
  bg: '#f8f9ff', white: '#ffffff', navy: '#04377b', ink: '#0b1d2f', slate: '#375887',
  muted: '#7185a3', pale: '#e9f1ff', red: '#e3202a', redPale: '#fff0f0', green: '#07864e',
  greenPale: '#e8f7ee', amber: '#f4ae0b', amberPale: '#fff5d8', line: '#dbe4f1',
};

export function T({ children, size = 15, weight = 'regular', color = C.ink, style, numberOfLines }: {
  children: ReactNode; size?: number; weight?: 'regular' | 'medium' | 'semi' | 'bold' | 'extra';
  color?: string; style?: object; numberOfLines?: number;
}) {
  const families = { regular: 'Jakarta', medium: 'JakartaMedium', semi: 'JakartaSemi', bold: 'JakartaBold', extra: 'JakartaExtra' };
  return <Text numberOfLines={numberOfLines} style={[{ fontFamily: families[weight], fontSize: size, color, lineHeight: Math.round(size * 1.4) }, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({ label, onPress, kind = 'primary', disabled = false, icon }: {
  label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'navy' | 'danger'; disabled?: boolean; icon?: IconName;
}) {
  const bg = kind === 'primary' ? C.red : kind === 'navy' ? C.navy : kind === 'danger' ? C.redPale : C.white;
  const fg = kind === 'primary' || kind === 'navy' ? C.white : kind === 'danger' ? C.red : C.navy;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: bg, borderColor: kind === 'secondary' ? C.navy : bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }]}>
    {icon && <AppIcon name={icon} size={19} color={fg} />}
    <T weight="bold" size={15} color={fg}>{label}</T>
  </Pressable>;
}

export function Pill({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'red' | 'green' | 'amber' }) {
  const colors = { blue: [C.pale, C.navy], red: [C.redPale, C.red], green: [C.greenPale, C.green], amber: [C.amberPale, '#805500'] } as const;
  return <View style={[styles.pill, { backgroundColor: colors[tone][0] }]}><T size={11} weight="bold" color={colors[tone][1]}>{label}</T></View>;
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return <View style={styles.section}><T size={20} weight="bold">{title}</T>{action}</View>;
}

export function Row({ icon, children, trailing }: { icon: IconName; children: ReactNode; trailing?: ReactNode }) {
  return <View style={styles.row}><View style={styles.iconBox}><AppIcon name={icon} size={20} color={C.navy} /></View><View style={{ flex: 1 }}>{children}</View>{trailing}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: 16, padding: 18, gap: 12, shadowColor: C.navy, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
  button: { minHeight: 52, borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 14 },
  pill: { alignSelf: 'flex-start', borderRadius: 99, paddingVertical: 6, paddingHorizontal: 10 },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' },
});
