import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Payment'>;
  route: RouteProp<RootStackParamList, 'Payment'>;
};

const COLORS = {
  bg: '#0A0A0A',
  surface: '#161616',
  surfaceRaised: '#1E1E1E',
  border: '#222222',
  text: '#FFFFFF',
  textMuted: '#666666',
  textDim: '#3A3A3A',
  success: '#30D158',
};

const getShipping = (qty: number) => (qty <= 4 ? 1.00 : 0);

const BUNDLES = [
  { qty: 2, price: 5.00 },
  { qty: 4, price: 7.00 },
  { qty: 6, price: 10.00 },
  { qty: 8, price: 12.00 },
] as const;

export default function PaymentScreen({ navigation, route }: Props) {
  const { collageName } = route.params;
  const { addOrder } = useApp();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bundleIdx, setBundleIdx] = useState(0);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [zip, setZip] = useState('');

  const bundle = BUNDLES[bundleIdx];

  const formatCard = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    return digits;
  };

  const shipping = getShipping(bundle.qty);
  const total = (bundle.price + shipping).toFixed(2);

  const handlePay = () => {
    if (processing || success) return;
    if (!street.trim() || !city.trim() || !stateRegion.trim() || !zip.trim()) {
      alert('Please fill in your shipping address.');
      return;
    }
    if (!name.trim() || cardNumber.replace(/\s/g, '').length < 16 || expiry.length < 7 || cvc.length < 3) {
      alert('Please complete your payment details.');
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      const now = new Date();
      const delivery = new Date(now);
      delivery.setDate(delivery.getDate() + 5);
      addOrder({
        id: Date.now().toString(),
        collageName,
        quantity: bundle.qty,
        total: parseFloat(total),
        address: `${street.trim()}, ${city.trim()}, ${stateRegion.trim()} ${zip.trim()}`,
        orderedAt: now,
        estimatedDelivery: delivery,
        status: 'processing',
      });
      setProcessing(false);
      setSuccess(true);
    }, 2000);
  };

  const handleDone = () => {
    navigation.popToTop();
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={40} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSub}>
            Your prints of{'\n'}
            <Text style={styles.successBold}>{collageName}</Text>
            {'\n'}will arrive in 3–5 days.
          </Text>
          <View style={styles.orderBox}>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Prints</Text>
              <Text style={styles.orderVal}>{bundle.qty}×</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Total charged</Text>
              <Text style={styles.orderVal}>${total}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneBtnText}>Back to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewOrdersBtn}
            onPress={() => { navigation.navigate('MainTabs', { screen: 'Orders' }); }}
          >
            <Ionicons name="receipt-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.viewOrdersText}>View My Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Nav */}
        <View style={styles.nav}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Checkout</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Order summary */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Order Summary</Text>
            <View style={styles.card}>

              <Text style={styles.orderItemTitle} numberOfLines={2}>{collageName}</Text>
              <Text style={styles.orderItemSub}>Glossy · choose a pack</Text>

              {/* Bundle picker grid */}
              <View style={styles.bundleGrid}>
                {BUNDLES.map((b, i) => {
                  const perPrint = (b.price / b.qty).toFixed(2);
                  const selected = i === bundleIdx;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.bundleCard, selected && styles.bundleCardSelected]}
                      onPress={() => setBundleIdx(i)}
                      activeOpacity={0.75}
                    >
                      {selected && (
                        <View style={styles.bundleCheck}>
                          <Ionicons name="checkmark" size={10} color="#000" />
                        </View>
                      )}
                      <Text style={[styles.bundleQty, selected && styles.bundleQtySelected]}>
                        {b.qty}
                      </Text>
                      <Text style={[styles.bundlePrintsLabel, selected && styles.bundlePrintsLabelSelected]}>
                        prints
                      </Text>
                      <Text style={[styles.bundlePrice, selected && styles.bundlePriceSelected]}>
                        ${b.price.toFixed(0)}
                      </Text>
                      <Text style={[styles.bundlePerPrint, selected && styles.bundlePerPrintSelected]}>
                        ${perPrint}/ea
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.divider} />
              <View style={styles.orderRow}>
                <Text style={styles.priceLabel}>Prints ({bundle.qty}×)</Text>
                <Text style={styles.priceVal}>${bundle.price.toFixed(2)}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.priceLabel}>Shipping</Text>
                <Text style={styles.priceVal}>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.orderRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalVal}>${total}</Text>
              </View>
            </View>
          </View>

          {/* Shipping address */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Shipping Address</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Street Address</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="123 Main St, Apt 4B"
                    placeholderTextColor={COLORS.textDim}
                    value={street}
                    onChangeText={setStreet}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>
              <View style={styles.twoCol}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>City</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="New York"
                      placeholderTextColor={COLORS.textDim}
                      value={city}
                      onChangeText={setCity}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { width: 80 }]}>
                  <Text style={styles.inputLabel}>State</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="NY"
                      placeholderTextColor={COLORS.textDim}
                      value={stateRegion}
                      onChangeText={v => setStateRegion(v.toUpperCase().slice(0, 2))}
                      autoCapitalize="characters"
                      maxLength={2}
                      returnKeyType="next"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { width: 90 }]}>
                  <Text style={styles.inputLabel}>ZIP</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="10001"
                      placeholderTextColor={COLORS.textDim}
                      value={zip}
                      onChangeText={v => setZip(v.replace(/\D/g, '').slice(0, 5))}
                      keyboardType="numeric"
                      maxLength={5}
                      returnKeyType="next"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Payment form */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment</Text>
            <View style={styles.card}>
              {/* Cardholder */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Jane Smith"
                    placeholderTextColor={COLORS.textDim}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Card number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <View style={[styles.inputWrapper, styles.cardInput]}>
                  <Ionicons name="card-outline" size={18} color={COLORS.textDim} style={styles.cardIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={COLORS.textDim}
                    value={cardNumber}
                    onChangeText={v => setCardNumber(formatCard(v))}
                    keyboardType="numeric"
                    maxLength={19}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Expiry + CVC */}
              <View style={styles.twoCol}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Expiry</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="MM / YY"
                      placeholderTextColor={COLORS.textDim}
                      value={expiry}
                      onChangeText={v => setExpiry(formatExpiry(v))}
                      keyboardType="numeric"
                      maxLength={7}
                      returnKeyType="next"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVC</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor={COLORS.textDim}
                      value={cvc}
                      onChangeText={v => setCvc(v.replace(/\D/g, '').slice(0, 4))}
                      keyboardType="numeric"
                      maxLength={4}
                      returnKeyType="done"
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Security note */}
          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={12} color={COLORS.textDim} />
            <Text style={styles.securityText}>
              Payments encrypted end-to-end. Your card is never stored.
            </Text>
          </View>

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* Pay button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payBtn, processing && styles.payBtnProcessing]}
            onPress={handlePay}
            activeOpacity={0.85}
            disabled={processing}
          >
            {processing ? (
              <Text style={styles.payText}>Processing…</Text>
            ) : (
              <>
                <Ionicons name="lock-closed" size={15} color="#000" />
                <Text style={styles.payText}>Pay ${total}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 24, marginTop: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  orderItemSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Bundle picker
  bundleGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  bundleCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceRaised,
    gap: 2,
    position: 'relative',
  },
  bundleCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  bundleCheck: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bundleQty: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  bundleQtySelected: { color: '#000' },
  bundlePrintsLabel: { fontSize: 9, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  bundlePrintsLabelSelected: { color: 'rgba(0,0,0,0.5)' },
  bundlePrice: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  bundlePriceSelected: { color: '#000' },
  bundlePerPrint: { fontSize: 9, color: COLORS.textMuted },
  bundlePerPrintSelected: { color: 'rgba(0,0,0,0.45)' },

  divider: { height: 1, backgroundColor: COLORS.border },
  priceLabel: { fontSize: 13, color: COLORS.textMuted },
  priceVal: { fontSize: 13, color: COLORS.text },
  totalLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  totalVal: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, color: COLORS.textMuted, textTransform: 'uppercase' },
  inputWrapper: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 46,
    justifyContent: 'center',
  },
  cardInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  cardIcon: { marginRight: 6 },
  input: { fontSize: 14, color: COLORS.text, outlineStyle: 'none' } as any,
  twoCol: { flexDirection: 'row', gap: 10 },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  securityText: { fontSize: 11, color: COLORS.textDim, flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
  },
  payBtnProcessing: { backgroundColor: COLORS.surface },
  payText: { fontSize: 15, fontWeight: '700', color: '#000' },

  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 40,
    gap: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0D1F0D',
    borderWidth: 1.5,
    borderColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  successSub: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  successBold: { color: COLORS.text, fontWeight: '700' },
  orderBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    marginTop: 8,
  },
  orderLabel: { fontSize: 13, color: COLORS.textMuted },
  orderVal: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  doneBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  viewOrdersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  viewOrdersText: { fontSize: 13, color: COLORS.textMuted },
});
