import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import EditIcon from '../assets/icons/edit.svg';
import { RootStackParamList, GridConfig, Template } from '../types';
import { GRIDS } from '../data/grids';
import { TEMPLATES } from '../data/templates';
import CollageView from '../components/CollageView';
import { useApp } from '../context/AppContext';
import { shareCollage } from '../utils/shareCollage';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'CollageDetail'>;
  route: RouteProp<RootStackParamList, 'CollageDetail'>;
};

const C = {
  bg: '#0A0A0A',
  surface: '#161616',
  border: '#222222',
  text: '#FFFFFF',
  textMuted: '#666666',
};

const PHOTO_RATIO = 1.35;

/**
 * Given the height of the collage display area, compute the width that makes
 * the CollageView fill it exactly. Uses the same layout constants as CollageView.
 */
function collageWidthForHeight(targetH: number, grid: GridConfig, template: Template): number {
  const tid = template.id;
  const outerBorder = tid === 'classic' ? 3 : 0;
  const filmSideW   = tid === 'film'    ? 12 : 0;
  const pad         = tid === 'classic' ? 5 : tid === 'ivory' ? 8 : tid === 'sky' ? 6 : tid === 'film' ? 4 : 0;
  const photoGap    = tid === 'minimal' ? 0 : tid === 'film'  ? 2 : tid === 'ivory' ? 0 : tid === 'classic' ? 2 : 2;
  const ivoryCapH   = tid === 'ivory'   ? 12 : 0;
  const headerH     = tid === 'classic' ? 20 : tid === 'film' ? 10 : tid === 'sky' ? 16 : 0;
  const footerH     = tid === 'classic' ? 24 : tid === 'film' ? 18 : tid === 'sky' ? 20 : tid === 'ivory' ? 18 : 0;

  const fixedH  = 2 * outerBorder + 2 * pad + headerH + footerH
                + grid.rows * ivoryCapH + photoGap * (grid.rows - 1);
  const cellH   = (targetH - fixedH) / grid.rows;
  const cellW   = cellH / PHOTO_RATIO;
  const innerW  = cellW * grid.columns + photoGap * (grid.columns - 1);
  return innerW + 2 * outerBorder + 2 * pad + 2 * filmSideW;
}

export default function CollageDetailScreen({ navigation, route }: Props) {
  const { collageId } = route.params;
  const { collages, deleteCollage, renameCollage } = useApp();
  const collage = collages.find(c => c.id === collageId);

  const collageRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'done' | 'error'>('idle');
  const [areaH, setAreaH] = useState(0);
  const [areaW, setAreaW] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  if (!collage) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Session not found.</Text>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const grid     = GRIDS.find(g => g.id === collage.gridId)         ?? GRIDS[0];
  const template = TEMPLATES.find(t => t.id === collage.templateId) ?? TEMPLATES[0];
  const date     = new Date(collage.createdAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  // Compute collage width so the strip fills the available area exactly,
  // capped to area width with some horizontal breathing room.
  const COLLAGE_WIDTH = areaH > 0
    ? Math.min(collageWidthForHeight(areaH, grid, template), areaW - 32)
    : 0;

  // Dark templates need a subtle glow so they're visible against the black bg
  const isDark = ['#0A0A0A', '#000000'].includes(template.backgroundColor);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    setShareStatus('idle');
    try {
      await shareCollage(collageRef, collage.name);
      setShareStatus('done');
      setTimeout(() => setShareStatus('idle'), 2500);
    } catch (e) {
      console.warn('Share failed:', e);
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 2500);
    } finally {
      setSharing(false);
    }
  };

  const shareLabel =
    shareStatus === 'done'  ? 'Saved!' :
    shareStatus === 'error' ? 'Try again' :
    sharing                 ? 'Preparing…' :
    Platform.OS === 'web'   ? 'Download / Share' : 'Share';

  const shareIcon =
    shareStatus === 'done'  ? 'checkmark' :
    shareStatus === 'error' ? 'alert-circle-outline' :
    'share-social-outline';

  const shareIconColor =
    shareStatus === 'done'  ? '#30D158' :
    shareStatus === 'error' ? '#FF453A' : '#FFFFFF';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* ── Rename modal ─────────────────────────────────────────────────── */}
        <Modal visible={showRename} transparent animationType="fade">
          <Pressable style={styles.overlay} onPress={() => setShowRename(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Rename</Text>
              <View style={styles.renameInputWrapper}>
                <TextInput
                  style={styles.renameInput}
                  value={renameValue}
                  onChangeText={setRenameValue}
                  autoFocus
                  selectTextOnFocus
                  maxLength={40}
                  returnKeyType="done"
                  onSubmitEditing={() => { renameCollage(collage.id, renameValue); setShowRename(false); }}
                />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowRename(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={() => { renameCollage(collage.id, renameValue); setShowRename(false); }}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── Delete modal ─────────────────────────────────────────────────── */}
        <Modal visible={confirmDelete} transparent animationType="fade">
          <Pressable style={styles.overlay} onPress={() => setConfirmDelete(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.deleteIconCircle}>
                <Ionicons name="trash-outline" size={22} color="#FF453A" />
              </View>
              <Text style={styles.modalTitle}>Delete Session?</Text>
              <Text style={styles.modalSub}>"{collage.name}" will be permanently removed.</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setConfirmDelete(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalDeleteBtn}
                  onPress={() => { deleteCollage(collage.id); navigation.goBack(); }}
                >
                  <Text style={styles.modalDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerCenter}
            onPress={() => { setRenameValue(collage.name); setShowRename(true); }}
            activeOpacity={0.7}
          >
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>{collage.name}</Text>
              <EditIcon width={11} height={11} color={C.textMuted} />
            </View>
            <Text style={styles.headerSub}>{date}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => setConfirmDelete(true)}>
            <Ionicons name="trash-outline" size={18} color="#FF453A" />
          </TouchableOpacity>
        </View>

        {/* ── Collage area — flex:1, measures itself, fits strip exactly ────── */}
        <View
          style={styles.collageArea}
          onLayout={e => {
            setAreaH(e.nativeEvent.layout.height);
            setAreaW(e.nativeEvent.layout.width);
          }}
        >
          {COLLAGE_WIDTH > 0 && (
            <View
              ref={collageRef}
              collapsable={false}
              style={isDark ? styles.darkGlow : undefined}
            >
              <CollageView
                photos={collage.photos}
                grid={grid}
                template={template}
                collageName={collage.name}
                width={COLLAGE_WIDTH}
              />
            </View>
          )}
        </View>

        {/* ── Meta badges ──────────────────────────────────────────────────── */}
        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Ionicons name="grid-outline" size={11} color={C.textMuted} />
            <Text style={styles.badgeText}>{grid.label}</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="color-palette-outline" size={11} color={C.textMuted} />
            <Text style={styles.badgeText}>{template.name}</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="images-outline" size={11} color={C.textMuted} />
            <Text style={styles.badgeText}>{collage.photos.length} photos</Text>
          </View>
        </View>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.shareBtn,
              shareStatus === 'done'  && styles.shareBtnDone,
              shareStatus === 'error' && styles.shareBtnError,
              sharing && styles.btnDisabled,
            ]}
            onPress={handleShare}
            activeOpacity={0.85}
            disabled={sharing}
          >
            {sharing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name={shareIcon as any} size={17} color={shareIconColor} />
            }
            <Text style={[
              styles.shareBtnText,
              shareStatus === 'done'  && { color: '#30D158' },
              shareStatus === 'error' && { color: '#FF453A' },
            ]}>
              {shareLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.printBtn}
            onPress={() => navigation.navigate('Payment', { collageName: collage.name, collageId: collage.id })}
            activeOpacity={0.8}
          >
            <Ionicons name="print-outline" size={17} color="#FFFFFF" />
            <Text style={styles.printText}>Order Prints</Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center', gap: 3 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  headerSub:   { fontSize: 11, color: C.textMuted, letterSpacing: 0.3 },

  // Collage display area — fills all space between header and meta row
  collageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    marginBottom: 4,
  },

  darkGlow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  badgeText: { fontSize: 11, color: C.textMuted, letterSpacing: 0.3 },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 10,
  },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#1A1A2E', borderRadius: 12, paddingVertical: 15,
    borderWidth: 1, borderColor: '#3A3A6E',
  },
  shareBtnDone:  { backgroundColor: '#0D1F0D', borderColor: '#30D158' },
  shareBtnError: { backgroundColor: '#1F0D0D', borderColor: '#FF453A' },
  shareBtnText:  { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  printBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.surface, borderRadius: 12, paddingVertical: 13,
    borderWidth: 1, borderColor: C.border,
  },
  printText: { fontSize: 15, fontWeight: '600', color: C.text },

  btnDisabled: { opacity: 0.5 },

  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#1C1C1E', borderRadius: 20,
    padding: 24, width: 300, alignItems: 'center',
    gap: 8, borderWidth: 1, borderColor: '#2C2C2E',
  },
  deleteIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,69,58,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,69,58,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  modalTitle:  { fontSize: 17, fontWeight: '700', color: C.text, textAlign: 'center' },
  modalSub:    { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  renameInputWrapper: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, height: 46, justifyContent: 'center',
  },
  renameInput: { fontSize: 15, color: C.text, outlineStyle: 'none' } as any,
  modalSaveBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center',
  },
  modalSaveText:  { fontSize: 15, fontWeight: '700', color: '#000' },
  modalCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#2C2C2E', alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: C.text },
  modalDeleteBtn:  {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#FF453A', alignItems: 'center',
  },
  modalDeleteText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  notFound: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, backgroundColor: C.bg,
  },
  notFoundText: { fontSize: 15, color: C.textMuted },
  backLink:     { paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: C.text, fontWeight: '600' },
});
