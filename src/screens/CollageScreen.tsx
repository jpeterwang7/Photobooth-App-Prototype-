import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { GRIDS } from '../data/grids';
import { TEMPLATES } from '../data/templates';
import CollageView from '../components/CollageView';
import { useApp } from '../context/AppContext';
import { shareCollage } from '../utils/shareCollage';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Collage'>;
  route: RouteProp<RootStackParamList, 'Collage'>;
};

const { width: SCREEN_W } = Dimensions.get('window');
const COLLAGE_WIDTH = Math.min(SCREEN_W - 48, 360);

const COLORS = {
  bg: '#0A0A0A',
  surface: '#161616',
  border: '#222222',
  text: '#FFFFFF',
  textMuted: '#666666',
};

export default function CollageScreen({ navigation, route }: Props) {
  const { selectedPhotos, gridId, templateId, collageName } = route.params;
  const { addCollage } = useApp();

  const [saving, setSaving]       = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'done' | 'error'>('idle');
  const committedRef = useRef(false);
  const collageRef   = useRef<View>(null);

  // Toast for auto-save confirmation
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = () => {
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  // ── Auto-save to app on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    addCollage({
      id: Date.now().toString(),
      name: collageName,
      createdAt: new Date(),
      gridId,
      templateId,
      photos: selectedPhotos,
    });
    showToast();
  }, []);                 // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save to device (download / share) ─────────────────────────────────────
  const handleSaveToDevice = async () => {
    if (saving) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      await shareCollage(collageRef, collageName);
      setSaveStatus('done');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (e) {
      console.warn('Save to device failed:', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } finally {
      setSaving(false);
    }
  };

  const grid     = GRIDS.find(g => g.id === gridId)         ?? GRIDS[0];
  const template = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0];

  const saveIcon =
    saveStatus === 'done'  ? 'checkmark' :
    saveStatus === 'error' ? 'alert-circle-outline' :
    'download-outline';

  const saveLabel =
    saveStatus === 'done'  ? 'Saved to Device!' :
    saveStatus === 'error' ? 'Try again' :
    saving                 ? 'Saving…' :
    Platform.OS === 'web'  ? 'Save to Device' :
    'Save to Device';

  const saveColor =
    saveStatus === 'done'  ? '#30D158' :
    saveStatus === 'error' ? '#FF453A' :
    '#000000';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Auto-save toast */}
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { opacity: toastOpacity }]}
        >
          <Ionicons name="checkmark-circle" size={15} color="#30D158" />
          <Text style={styles.toastText}>Saved to BOOTH</Text>
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{collageName}</Text>
            <Text style={styles.headerSub}>{template.name} · {grid.label}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.popToTop()}>
            <Ionicons name="home-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Collage preview */}
          <View ref={collageRef} collapsable={false} style={styles.collageWrapper}>
            <CollageView
              photos={selectedPhotos}
              grid={grid}
              template={template}
              collageName={collageName}
              width={COLLAGE_WIDTH}
            />
          </View>

          {/* Info badges */}
          <View style={styles.infoRow}>
            <View style={styles.infoBadge}>
              <Ionicons name="grid-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.infoBadgeText}>{grid.label}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Ionicons name="color-palette-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.infoBadgeText}>{template.name}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Ionicons name="images-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.infoBadgeText}>{selectedPhotos.length} photos</Text>
            </View>
          </View>

          <View style={{ height: 160 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            {/* Save to Device — primary */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                saveStatus === 'done'  && styles.saveBtnDone,
                saveStatus === 'error' && styles.saveBtnError,
                saving && styles.btnDisabled,
              ]}
              onPress={handleSaveToDevice}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name={saveIcon as any} size={17} color={saveColor} />
              )}
              <Text style={[
                styles.saveText,
                saveStatus === 'done'  && { color: '#30D158' },
                saveStatus === 'error' && { color: '#FF453A' },
              ]}>
                {saveLabel}
              </Text>
            </TouchableOpacity>

            {/* Order Prints — secondary */}
            <TouchableOpacity
              style={styles.printBtn}
              onPress={() => navigation.navigate('Payment', { collageName })}
              activeOpacity={0.8}
            >
              <Ionicons name="print-outline" size={17} color="#FFFFFF" />
              <Text style={styles.printText}>Order Prints</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Auto-save toast
  toast: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#1A2A1A',
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 99,
  },
  toastText: { fontSize: 13, fontWeight: '600', color: '#30D158' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center', gap: 3 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingTop: 20 },

  collageWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },

  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoBadgeText: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.3 },

  // Footer
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
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Save to Device — primary (white)
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 15,
  },
  saveBtnDone:  { backgroundColor: '#0D1F0D', borderWidth: 1, borderColor: '#30D158' },
  saveBtnError: { backgroundColor: '#1F0D0D', borderWidth: 1, borderColor: '#FF453A' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#000000' },

  // Order Prints — secondary (dark)
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  printText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  btnDisabled: { opacity: 0.5 },
});
