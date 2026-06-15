import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Pressable,
  Image,  // still used for the logo
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import EditIcon   from '../assets/icons/edit.svg';
import PrintIcon  from '../assets/icons/print.svg';
import { useApp } from '../context/AppContext';
import { RootStackParamList, MainTabParamList, PhotoCollage } from '../types';
import { GRIDS } from '../data/grids';
import { TEMPLATES } from '../data/templates';
import CollageView from '../components/CollageView';

// ── Masonry height estimator (mirrors CollageView layout math) ────────────────
const PHOTO_RATIO = 1.35;

function estimateStripHeight(gridId: string, templateId: string, cardWidth: number): number {
  const grid = GRIDS.find(g => g.id === gridId) ?? GRIDS[0];
  const tid = templateId;
  const outerBorder = tid === 'classic' ? 3 : 0;
  const filmSideW   = tid === 'film'    ? 12 : 0;
  const pad         = tid === 'classic' ? 5 : tid === 'ivory' ? 8 : tid === 'sky' ? 6 : tid === 'film' ? 4 : 0;
  const photoGap    = tid === 'minimal' ? 0 : tid === 'film'  ? 2 : tid === 'ivory' ? 0 : tid === 'classic' ? 2 : 2;
  const ivoryCapH   = tid === 'ivory'   ? 12 : 0;
  const headerH     = tid === 'classic' ? 20 : tid === 'film' ? 10 : tid === 'sky' ? 16 : 0;
  const footerH     = tid === 'classic' ? 24 : tid === 'film' ? 18 : tid === 'sky' ? 20 : tid === 'ivory' ? 18 : 0;

  const fixedH = 2 * outerBorder + 2 * pad + headerH + footerH
               + grid.rows * ivoryCapH + photoGap * (grid.rows - 1);
  const innerW = cardWidth - 2 * outerBorder - 2 * pad - 2 * filmSideW;
  const cellW  = Math.max(0, (innerW - photoGap * (grid.columns - 1)) / grid.columns);
  const stripH = fixedH + cellW * PHOTO_RATIO * grid.rows;
  return stripH + 30 + 14; // +30 info row, +14 tile bottom margin
}

// Greedy 2-column assignment: each collage goes to the shorter column.
function assignColumns(collages: PhotoCollage[], cardWidth: number): [PhotoCollage[], PhotoCollage[]] {
  const left: PhotoCollage[]  = [];
  const right: PhotoCollage[] = [];
  let leftH = 0;
  let rightH = 0;
  for (const c of collages) {
    const h = estimateStripHeight(c.gridId, c.templateId, cardWidth);
    if (leftH <= rightH) {
      left.push(c);
      leftH += h;
    } else {
      right.push(c);
      rightH += h;
    }
  }
  return [left, right];
}

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Home'>,
    StackNavigationProp<RootStackParamList>
  >;
};

const C = {
  bg:        '#0A0A0A',
  card:      '#161618',
  cardBack:  '#1C1C1F',
  border:    'rgba(255,255,255,0.08)',
  text:      '#FFFFFF',
  textMuted: '#8E8E93',
  textDim:   'rgba(255,255,255,0.32)',
};

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ collage, onConfirm, onClose }: {
  collage: PhotoCollage; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <View style={styles.deleteIconCircle}>
            <Text style={{ fontSize: 22 }}>🗑</Text>
          </View>
          <Text style={styles.modalTitle}>Delete Session?</Text>
          <Text style={styles.modalSub}>"{collage.name}" will be permanently removed.</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalDeleteBtn} onPress={() => { onConfirm(); onClose(); }}>
              <Text style={styles.modalDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Rename modal ──────────────────────────────────────────────────────────────
function RenameModal({ collage, onSave, onClose }: {
  collage: PhotoCollage; onSave: (name: string) => void; onClose: () => void;
}) {
  const [value, setValue] = useState(collage.name);
  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Rename Session</Text>
          <View style={styles.renameInputWrapper}>
            <TextInput
              style={styles.renameInput}
              value={value}
              onChangeText={setValue}
              autoFocus
              selectTextOnFocus
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={() => { onSave(value); onClose(); }}
            />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => { onSave(value); onClose(); }}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Collage card (full strip masonry tile) ────────────────────────────────────
function CollageCard({ collage, cardWidth, onPress, onRename, onPrint }: {
  collage: PhotoCollage;
  cardWidth: number;
  onPress: () => void;
  onRename: () => void;
  onPrint: () => void;
}) {
  const grid     = GRIDS.find(g => g.id === collage.gridId)         ?? GRIDS[0];
  const template = TEMPLATES.find(t => t.id === collage.templateId) ?? TEMPLATES[0];

  return (
    <View style={styles.tile}>
      <TouchableOpacity style={[styles.card, { width: cardWidth }]} onPress={onPress} activeOpacity={0.88}>

        {/* Full photo strip */}
        <View style={styles.stripWrap}>
          <CollageView
            photos={collage.photos}
            grid={grid}
            template={template}
            collageName={collage.name}
            width={cardWidth}
          />
        </View>

        {/* Info row — name + rename + print */}
        <View style={styles.infoRow}>
          <Text style={styles.cardName} numberOfLines={1}>{collage.name}</Text>
          <TouchableOpacity onPress={onRename} hitSlop={8} style={styles.renameBtn}>
            <EditIcon width={10} height={10} color={C.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPrint} hitSlop={8} style={styles.printBtn}>
            <PrintIcon width={10} height={10} color={C.textMuted} />
          </TouchableOpacity>
        </View>

      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: Props) {
  const { collages, renameCollage } = useApp();

  const [renamingCollage, setRenamingCollage] = useState<PhotoCollage | null>(null);
  const [containerW, setContainerW] = useState(0);

  // 2-column masonry. Each tile has paddingHorizontal: HALF_GAP, outer
  // container also paddingHorizontal: HALF_GAP → all gaps equal HALF_GAP*2.
  // Formula: containerW - HALF_GAP*(2 outer + 2*2 tile sides) = width for 2 cols
  const HALF_GAP  = 7;
  const cardWidth = containerW > 0
    ? Math.floor((containerW - HALF_GAP * 6) / 2)
    : 0;

  const [leftCol, rightCol] = cardWidth > 0
    ? assignColumns(collages, cardWidth)
    : [collages.filter((_, i) => i % 2 === 0), collages.filter((_, i) => i % 2 === 1)];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {renamingCollage && (
        <RenameModal
          collage={renamingCollage}
          onSave={name => renameCollage(renamingCollage.id, name)}
          onClose={() => setRenamingCollage(null)}
        />
      )}

      <View
        style={styles.container}
        onLayout={e => setContainerW(e.nativeEvent.layout.width)}
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.logoClip}>
            <Image
              source={require('../assets/nomads_logo.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          {collages.length > 0 && (
            <View style={styles.headerRight}>
              <Text style={styles.sessionCount}>{collages.length}</Text>
              <Text style={styles.sessionLabel}>{collages.length === 1 ? 'session' : 'sessions'}</Text>
            </View>
          )}
        </View>

        {/* ── Content ────────────────────────────────────────────────────── */}
        {containerW === 0 ? null : collages.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconRing}>
              <Ionicons name="camera-outline" size={34} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySub}>Tap the camera below to start your first shoot</Text>
          </View>
        ) : cardWidth > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={[styles.sectionLabel, { paddingHorizontal: HALF_GAP }]}>SESSIONS</Text>

            <View style={[styles.columns, { paddingHorizontal: HALF_GAP }]}>
              {[leftCol, rightCol].map((col, ci) => (
                <View key={ci} style={styles.column}>
                  {col.map(item => (
                    <CollageCard
                      key={item.id}
                      collage={item}
                      cardWidth={cardWidth}
                      onPress={() => navigation.navigate('CollageDetail', { collageId: item.id })}
                      onRename={() => setRenamingCollage(item)}
                      onPrint={() => navigation.navigate('Payment', { collageName: item.name, collageId: item.id })}
                    />
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}

        {/* ── Bottom fade ─────────────────────────────────────────────────── */}
        <View
          pointerEvents="none"
          style={[
            styles.bottomFade,
            { backgroundImage: 'linear-gradient(to bottom, transparent, #0A0A0A)' } as any,
          ]}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 4,
  },
  logoClip: { width: 48, height: 48, borderRadius: 10, overflow: 'hidden' },
  logoImage: {
    width: 48, height: 48,
    transform: [{ scale: 2.0 }, { translateY: 3 }],
  },
  headerRight: { alignItems: 'flex-end', gap: 1 },
  sessionCount: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
  sessionLabel: {
    fontSize: 10, fontWeight: '500', color: C.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },

  // ── Section label ────────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.2)',
    paddingTop: 20, paddingBottom: 16,
  },

  // ── Scroll / columns ─────────────────────────────────────────────────────────
  scrollContent: { paddingBottom: 140 },
  columns: { flexDirection: 'row', alignItems: 'flex-start' },
  column:  { flex: 1 },

  // ── Masonry tile wrapper ──────────────────────────────────────────────────────
  tile: {
    paddingHorizontal: 7,   // matches HALF_GAP
    marginBottom: 14,
  },

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: {
    borderRadius: 12,
    backgroundColor: C.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  // ── Strip wrapper ─────────────────────────────────────────────────────────────
  stripWrap: {
    width: '100%',
    overflow: 'hidden',
  },
  // ── Info row ─────────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 4,
  },
  cardName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.1,
  },
  renameBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Bottom fade ──────────────────────────────────────────────────────────────
  bottomFade: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 110,
    pointerEvents: 'none',
  } as any,

  // ── Empty state ──────────────────────────────────────────────────────────────
  empty: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 48, paddingBottom: 100,
  },
  emptyIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 19, fontWeight: '600', color: C.text, letterSpacing: -0.3 },
  emptySub: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 21 },

  // ── Modals ───────────────────────────────────────────────────────────────────
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20, padding: 24, width: 300, gap: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  deleteIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,69,58,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,69,58,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle:      { fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'center' },
  modalSub:        { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  modalActions:    { flexDirection: 'row', gap: 10, width: '100%' },
  modalCancelBtn: {
    flex: 1, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  modalDeleteBtn: {
    flex: 1, height: 44, borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center', justifyContent: 'center',
  },
  modalDeleteText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  modalSaveBtn: {
    flex: 1, height: 44, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: '#000' },
  renameInputWrapper: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, height: 46,
    justifyContent: 'center',
  },
  renameInput: { fontSize: 15, color: C.text, outlineStyle: 'none' } as any,
});
