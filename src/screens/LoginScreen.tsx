import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
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

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('Enter your email.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoRow}>
            <View style={styles.logoDot} />
            <Text style={styles.logoText}>BOOTH</Text>
          </View>
          <Text style={styles.tagline}>capture the moment</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.fields}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'email' && styles.inputFocused,
              ]}>
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

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'password' && styles.inputFocused,
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={C.dim}
                  value={password}
                  onChangeText={v => { setPassword(v); setError(''); }}
                  secureTextEntry
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
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
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={styles.btnText}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.footerLink}>Create one</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 40,
  },
  logoArea: { alignItems: 'center', gap: 6 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFF' },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 5,
  },
  tagline: {
    fontSize: 11,
    color: C.muted,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  form: { gap: 20 },
  title: { fontSize: 26, fontWeight: '700', color: C.text, letterSpacing: 0.3 },
  subtitle: { fontSize: 14, color: C.muted, marginTop: -12 },
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
