import { useRef, useState, type ComponentProps } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react-native';
import { C, T } from './demo-ui';
import { useAppStore } from '@/store/app';

type Mode = 'login' | 'register' | 'forgot' | 'reset';
export function AccountScreen({ onBack }: { onBack?: () => void }) {
  const s = useAppStore();
  const params = Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [mode, setMode] = useState<Mode>(params.has('resetToken') ? 'reset' : 'login');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [resetToken, setResetToken] = useState(params.get('resetToken') ?? '');
  const passwordRef = useRef<TextInput>(null);
  const title = { login: 'Welcome back.', register: 'Your next ride starts here.', forgot: 'Let’s get you back in.', reset: 'A fresh start.' }[mode];
  const heading = { login: 'Sign in to your account', register: 'Create your account', forgot: 'Reset your password', reset: 'Choose a new password' }[mode];
  const switchMode = (next: Mode) => { setMode(next); setPassword(''); setConfirmation(''); useAppStore.setState({ error: null, message: null }); };
  const disabled = s.busy || !email.trim() || (mode !== 'forgot' && !password) || ((mode === 'register' || mode === 'reset') && !confirmation) || (mode === 'register' && !name.trim()) || (mode === 'reset' && !resetToken.trim());
  const submit = async () => {
    if (disabled) return;
    if (mode === 'login') { await s.login(email, password); return; }
    const ok = await s.authAction(mode === 'register' ? 'register' : mode === 'forgot' ? 'forgot-password' : 'reset-password', {
      email: email.trim().toLowerCase(), ...(mode === 'register' ? { name } : {}),
      ...(mode !== 'forgot' ? { password, password_confirmation: confirmation } : {}), ...(mode === 'reset' ? { token: resetToken } : {}),
    });
    if (ok && mode !== 'forgot') {
      setMode('login'); setPassword(''); setConfirmation(''); setResetToken('');
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.history.replaceState(null, '', '/');
    }
  };
  const back = () => {
    if (mode !== 'login') switchMode('login');
    else { useAppStore.setState({ error: null, message: null }); onBack?.(); }
  };
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.body}>
      <View style={styles.brandPanel}>
        <View style={styles.topBar}>
          <View style={styles.brand}><View style={styles.logoWell}><Image source={require('../../assets/favicon/web-app-manifest-512x512.png')} style={styles.logo} contentFit="contain" accessibilityLabel="TAPSAKAY logo" /></View><View><T size={17} weight="extra" color={C.white}>TAPSAKAY</T><T size={11} color={C.pale}>Tap. Match. Sakay.</T></View></View>
          {(onBack || mode !== 'login') && <Pressable accessibilityRole="button" accessibilityLabel={mode === 'login' ? 'Back to welcome' : 'Back to sign in'} disabled={s.busy} onPress={back} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.65 }]}><ArrowLeft size={22} color={C.white} /></Pressable>}
        </View>
        <View style={styles.introduction}><T size={32} weight="extra" color={C.white} style={styles.headline}>{title}</T><T size={14} color={C.pale} style={styles.description}>{mode === 'login' ? 'A seat on your route.\nA simpler way to get there.' : mode === 'register' ? 'Join TAPSAKAY and book your next ride.' : 'A few simple steps, and you’re on your way.'}</T></View>
      </View>
      <View style={styles.formPanel}>
        <View style={styles.formHeading}><T size={22} weight="bold" color={C.navy}>{heading}</T><T size={13} color={C.slate}>{mode === 'login' ? 'For passengers and drivers.' : mode === 'register' ? 'Passenger registration. Drivers receive an account from their operator.' : mode === 'forgot' ? 'Enter your email and we’ll send you a reset link.' : 'Use 12 or more characters, including letters and numbers.'}</T></View>
        <View style={styles.fields}>
          {mode === 'register' && <Field label="Full name" icon="person" value={name} onChangeText={setName} autoComplete="name" editable={!s.busy} placeholder="Your full name" />}
          <Field label="Email address" icon="email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" editable={!s.busy} placeholder="you@example.com" returnKeyType={mode === 'forgot' ? 'go' : 'next'} onSubmitEditing={() => mode === 'forgot' ? void submit() : passwordRef.current?.focus()} />
          {mode === 'reset' && !params.has('resetToken') && <Field label="Reset token" value={resetToken} onChangeText={setResetToken} autoCapitalize="none" autoCorrect={false} editable={!s.busy} placeholder="Paste the token from your email link" />}
          {mode !== 'forgot' && <Field inputRef={passwordRef} label="Password" icon="password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} editable={!s.busy} placeholder={mode === 'login' ? 'Enter your password' : 'At least 12 characters'} returnKeyType={mode === 'login' ? 'go' : 'next'} onSubmitEditing={() => { if (mode === 'login') void submit(); }} />}
          {(mode === 'register' || mode === 'reset') && <Field label="Confirm password" icon="password" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" editable={!s.busy} placeholder="Enter your password again" returnKeyType="go" onSubmitEditing={() => void submit()} />}
        </View>
        {mode === 'register' && <T size={12} color={C.slate}>Use 12 or more characters, including letters and numbers.</T>}
        {mode === 'login' && <View style={styles.recovery}><TextAction label="Forgot password?" disabled={s.busy} onPress={() => switchMode('forgot')} /></View>}
        {s.error && <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.feedback, { backgroundColor: C.redPale }]}><T size={13} color={C.red}>{s.error}</T></View>}
        {s.message && <View accessibilityLiveRegion="polite" role="status" style={[styles.feedback, { backgroundColor: C.greenPale }]}><CheckCircle2 size={19} color={C.green} /><T size={13} color={C.ink} style={{ flex: 1 }}>{s.message}</T></View>}
        <Pressable accessibilityRole="button" accessibilityLabel={mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Save new password'} accessibilityState={{ disabled, busy: s.busy }} disabled={disabled} onPress={() => void submit()} style={({ pressed }) => [styles.submit, disabled && styles.submitDisabled, pressed && { opacity: 0.85 }]}>
          {s.busy ? <><ActivityIndicator color={C.navy} /><T weight="bold" color={C.navy}>Please wait…</T></> : <><T weight="bold" color={disabled ? C.slate : C.white}>{mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Save new password'}</T><ArrowRight size={20} color={disabled ? C.slate : C.white} /></>}
        </Pressable>
        <View style={styles.accountLink}>{mode === 'login' ? <><T size={13} color={C.slate}>New to TAPSAKAY?</T><TextAction label="Create an account" disabled={s.busy} onPress={() => switchMode('register')} /></> : <TextAction label="Back to sign in" disabled={s.busy} onPress={() => switchMode('login')} />}</View>
        {mode === 'forgot' && <TextAction label="I have a reset token" disabled={s.busy} onPress={() => switchMode('reset')} />}
        <View style={styles.footer}><LockKeyhole size={14} color={C.slate} /><T size={11} color={C.slate}>Your account. Your journey.</T></View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
function TextAction({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.textAction, { opacity: disabled ? 0.5 : pressed ? 0.65 : 1 }]}><T size={13} weight="bold" color={C.navy} style={{ textDecorationLine: 'underline' }}>{label}</T></Pressable>;
}
function Field({ label, icon, inputRef, secureTextEntry, ...props }: ComponentProps<typeof TextInput> & { label: string; icon?: 'email' | 'password' | 'person'; inputRef?: React.Ref<TextInput> }) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const Icon = icon === 'email' ? Mail : icon === 'person' ? UserRound : LockKeyhole;
  return <View style={styles.field}><T size={13} weight="semi" color={C.ink}>{label}</T><View style={[styles.inputShell, focused && styles.inputFocused]}>
    <Icon size={19} color={focused ? C.navy : C.slate} />
    <TextInput {...props} ref={inputRef} accessibilityLabel={label} secureTextEntry={secureTextEntry && !visible} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={styles.input} placeholderTextColor={C.slate} selectionColor={C.navy} />
    {secureTextEntry && <Pressable accessibilityRole="button" accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} accessibilityState={{ disabled: props.editable === false }} disabled={props.editable === false} onPress={() => setVisible(!visible)} style={styles.visibilityButton}>{visible ? <EyeOff size={20} color={C.slate} /> : <Eye size={20} color={C.slate} />}</Pressable>}
  </View></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.navy },
  body: { flexGrow: 1 },
  brandPanel: { paddingHorizontal: 28, paddingTop: 26, paddingBottom: 40, gap: 36 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoWell: { width: 54, height: 54, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 48, height: 48 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: C.slate },
  introduction: { gap: 10 },
  headline: { letterSpacing: -0.7 },
  description: { lineHeight: 22 },
  formPanel: { flexGrow: 1, backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 28, paddingTop: 30, paddingBottom: 24, gap: 16 },
  formHeading: { gap: 6, marginBottom: 8 },
  fields: { gap: 20 },
  field: { gap: 8 },
  inputShell: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 6, borderWidth: 1, borderColor: C.line, borderRadius: 12, backgroundColor: C.bg },
  inputFocused: { borderColor: C.navy, backgroundColor: C.white },
  input: { flex: 1, minWidth: 0, minHeight: 54, paddingVertical: 12, paddingRight: 10, color: C.ink, fontFamily: 'Jakarta', fontSize: 15 },
  visibilityButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  recovery: { alignItems: 'flex-end', marginTop: -10, marginBottom: -4 },
  textAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  submit: { minHeight: 56, paddingHorizontal: 20, borderRadius: 12, backgroundColor: C.red, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  submitDisabled: { backgroundColor: C.pale },
  accountLink: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 6 },
  feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 16, marginTop: 'auto' },
});
