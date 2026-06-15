import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Signup'>;
};

const C = {
  bg: '#0A0A0A',
  surface: '#161616',
  border: '#222222',
  borderFocus: '#444444',
  text: '#FFFFFF',
  muted: '#666666',
  dim: '#333333',
  error: '#FF453A',
};

export default function SignupScreen({ navigation }: Props) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSignup = async () => {
    setError('');
    if (!name.trim()) { setError('Enter your name.'); return; }
    if (!email.trim()) { setError('Enter your email.'); return; }
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Nav */}
          <View style={styles.nav}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoRow}>
              <View style={styles.logoDot} />
              <Text style={styles.logoText}>BOOTH</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.formHeader}>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Start capturing your moments</Text>
            </View>

            <View style={styles.fields}>
              {/* Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Your Name</Text>
                <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Jane Smith"
                    placeholderTextColor={C.dim}
                    value={name}
                    onChangeText={v => { setName(v); setError(''); }}
                    autoCapitalize="words"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={C.dim}
                    value={email}
                    onChangeText={v => { setEmail(v); setError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 6 characters"
                    placeholderTextColor={C.dim}
                    value={password}
                    onChangeText={v => { setPassword(v); setError(''); }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Confirm */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputWrapper, focusedField === 'confirm' && styles.inputFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={C.dim}
                    value={confirm}
                    onChangeText={v => { setConfirm(v); setError(''); }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="done"
                    onSubmitEditing={handleSignup}
                  />
                </View>
              </View>

              {error ? (
                <View style={styles.errorRow}>
                  <View style={styles.errorDot} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnLoading]}
              onPress={handleSignup}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#000" size="small" />
                : <Text style={styles.btnText}>Create Account</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
    gap: 32,
  },
  nav: { paddingTop: 16 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoArea: { alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFF' },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 5,
  },
  form: { gap: 20 },
  formHeader: { gap: 4 },
  title: { fontSize: 26, fontWeight: '700', color: C.text, letterSpacing: 0.3 },
  subtitle: { fontSize: 14, color: C.muted },
  fields: { gap: 14 },
  fieldGroup: { gap: 7 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: C.muted,
  },
  inputWrapper: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
  },
  inputFocused: { borderColor: C.borderFocus },
  input: {
    fontSize: 15,
    color: C.text,
    outlineStyle: 'none',
  } as any,
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  errorDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.error },
  errorText: { fontSize: 13, color: C.error },
  btn: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnLoading: { opacity: 0.7 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: { fontSize: 14, color: C.muted },
  footerLink: { fontSize: 14, fontWeight: '600', color: C.text },
});
