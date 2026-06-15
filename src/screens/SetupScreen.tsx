import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import OrderIcon from '../assets/icons/order.svg';
import { RootStackParamList } from '../types';
import { GRIDS } from '../data/grids';
import { TEMPLATES } from '../data/templates';
import { useApp } from '../context/AppContext';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Setup'>;
};

const { width: SCREEN_W } = Dimensions.get('window');

const COLORS = {
  bg: '#0A0A0A',
  surface: '#161616',
  surfaceRaised: '#1E1E1E',
  border: '#272727',
  text: '#FFFFFF',
  textMuted: '#666666',
  textDim: '#3A3A3A',
  accent: '#FFFFFF',
};

function GridPreview({ grid, selected, onPress }: {
  grid: typeof GRIDS[0];
  selected: boolean;
  onPress: () => void;
}) {
  const cellW = 10;
  const cellH = 14;
  const gap = 2;
  const previewW = grid.columns * cellW + (grid.columns - 1) * gap + 12;
  const previewH = grid.rows * cellH + (grid.rows - 1) * gap + 12;

  return (
    <TouchableOpacity
      style={[styles.gridCard, selected && styles.gridCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.gridPreview, { width: previewW, height: previewH }]}>
        {Array.from({ length: grid.rows }).map((_, row) => (
          <View key={row} style={[styles.gridPreviewRow, { marginBottom: row < grid.rows - 1 ? gap : 0 }]}>
            {Array.from({ length: grid.columns }).map((_, col) => (
              <View
                key={col}
                style={[
                  styles.gridCell,
                  { width: cellW, height: cellH, marginRight: col < grid.columns - 1 ? gap : 0 },
                  selected ? styles.gridCellSelected : styles.gridCellDefault,
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      <Text style={[styles.gridLabel, selected && styles.gridLabelSelected]}>
        {grid.label}
      </Text>
      <Text style={styles.gridDesc}>{grid.photoCount} photos</Text>
    </TouchableOpacity>
  );
}

// Per-template accent colour used for card border & preview details
const TEMPLATE_ACCENT: Record<string, string> = {
  classic: 'rgba(255,255,255,0.7)',
  film:    'rgba(200,168,122,0.65)',
  sky:     'rgba(58,122,155,0.6)',
  ivory:   'rgba(160,148,130,0.7)',
  minimal: 'rgba(255,255,255,0.22)',
};

// Card background — lift dark templates off the black app background
const TEMPLATE_CARD_BG: Record<string, string> = {
  classic: '#1A1A1A',
  film:    '#141414',
  sky:     '#C9E8F7',
  ivory:   '#EDE9E1',
  minimal: '#111111',
};

// Photo-block colour inside the preview
const TEMPLATE_BLOCK_BG: Record<string, string> = {
  classic: '#3A3A3A',
  film:    '#2C2C2C',
  sky:     '#A4D0E8',
  ivory:   '#C4BAA8',
  minimal: '#2E2E2E',
};

function TemplateCard({ template, selected, onPress }: {
  template: typeof TEMPLATES[0];
  selected: boolean;
  onPress: () => void;
}) {
  const accent   = TEMPLATE_ACCENT[template.id]   ?? 'rgba(255,255,255,0.3)';
  const cardBg   = TEMPLATE_CARD_BG[template.id]  ?? '#141414';
  const blockBg  = TEMPLATE_BLOCK_BG[template.id] ?? '#2A2A2A';
  const isIvory  = template.id === 'ivory';
  const isSky    = template.id === 'sky';
  const isLight  = isIvory || isSky;

  // 3 photo blocks: tall · short · tall
  const blocks = [0.6, 0.28, 0.6];

  return (
    <TouchableOpacity
      style={[
        styles.templateCard,
        { backgroundColor: cardBg, borderColor: selected ? '#FFFFFF' : accent },
        template.id === 'classic' && styles.templateCardClassic,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Film holes — left column */}
      {template.hasFilmHoles && (
        <View style={styles.filmHolesPreview}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={styles.filmHolePreview} />
          ))}
        </View>
      )}

      {/* Sky cloud decoration — top */}
      {isSky && (
        <View style={styles.skyTopClouds}>
          <View style={styles.skyCloudSm} />
          <View style={styles.skyCloudLg} />
          <View style={styles.skyCloudSm} />
        </View>
      )}

      {/* Photo block strip */}
      <View style={[
        styles.templatePhotos,
        template.hasFilmHoles && { marginLeft: 10 },
        template.id === 'classic' && { margin: 4, borderWidth: 2, borderColor: '#FFFFFF', padding: 3 },
        isSky && { marginTop: 4 },
      ]}>
        {blocks.map((flex, i) => (
          <View
            key={i}
            style={[
              styles.templatePhotoBlock,
              {
                flex,
                backgroundColor: blockBg,
                marginBottom: i < blocks.length - 1 ? Math.max(template.gap, 2) : 0,
                borderRadius: template.cornerRadius,
              },
            ]}
          />
        ))}

        {/* Ivory polaroid bottom cap */}
        {isIvory && (
          <View style={styles.ivoryFooter}>
            <View style={styles.ivoryLine} />
          </View>
        )}
      </View>

      {/* Label — muted by default, becomes prominent only when selected */}
      <View style={styles.templateMeta}>
        <Text style={[
          styles.templateName,
          { color: isLight ? 'rgba(40,70,90,0.5)' : COLORS.textMuted },
          selected && { color: isLight ? '#1E4A6A' : COLORS.text },
        ]}>
          {template.name}
        </Text>
        <Text style={[styles.templateDesc, isLight && { color: 'rgba(40,70,90,0.38)' }]}>
          {template.description}
        </Text>
      </View>

      {/* Selected checkmark */}
      {selected && (
        <View style={[styles.templateCheck, isLight && { backgroundColor: '#3A7A9B' }]}>
          <Ionicons name="checkmark" size={11} color={isLight ? '#FFFFFF' : '#000'} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SetupScreen({ navigation }: Props) {
  const { addCollage } = useApp();
  const [selectedGridId, setSelectedGridId] = useState(GRIDS[0].id);
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  const [collageName, setCollageName] = useState('');

  const selectedGrid = GRIDS.find(g => g.id === selectedGridId)!;
  const selectedTemplate = TEMPLATES.find(t => t.id === selectedTemplateId)!;
  const totalPhotos = selectedGrid.photoCount + 2;

  const handleStart = () => {
    const name = collageName.trim() || 'Untitled Session';
    navigation.navigate('Camera', {
      gridId: selectedGridId,
      templateId: selectedTemplateId,
      collageName: name,
      totalPhotos,
      gridPhotoCount: selectedGrid.photoCount,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Nav */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>New Session</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Session Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Summer nights, birthday bash…"
                placeholderTextColor="#3A3A3A"
                value={collageName}
                onChangeText={setCollageName}
                maxLength={40}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Grid */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Layout</Text>
              <Text style={styles.sectionHint}>{selectedGrid.description}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              <View style={styles.hRow}>
                {GRIDS.map(g => (
                  <GridPreview
                    key={g.id}
                    grid={g}
                    selected={g.id === selectedGridId}
                    onPress={() => setSelectedGridId(g.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Template */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Template</Text>
              <Text style={styles.sectionHint}>{selectedTemplate.description}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              <View style={styles.hRow}>
                {TEMPLATES.map(t => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    selected={t.id === selectedTemplateId}
                    onPress={() => setSelectedTemplateId(t.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Photos taken</Text>
              <Text style={styles.summaryValue}>{totalPhotos}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Photos used</Text>
              <Text style={styles.summaryValue}>{selectedGrid.photoCount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Grid</Text>
              <Text style={styles.summaryValue}>{selectedGrid.label}</Text>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
            <OrderIcon width={18} height={18} color="#000000" />
            <Text style={styles.startText}>Start Shooting</Text>
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
  section: { paddingHorizontal: 24, marginTop: 28 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  sectionHint: {
    fontSize: 12,
    color: COLORS.textDim,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
  },
  input: {
    height: 50,
    fontSize: 15,
    color: COLORS.text,
    outlineStyle: 'none',
  } as any,
  hScroll: { marginHorizontal: -24, paddingLeft: 24 },
  hRow: { flexDirection: 'row', gap: 10, paddingRight: 24 },

  // Grid cards
  gridCard: {
    width: 80,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 6,
  },
  gridCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: '#1E1E1E',
  },
  gridPreview: { alignItems: 'center', justifyContent: 'center' },
  gridPreviewRow: { flexDirection: 'row' },
  gridCell: { borderRadius: 1 },
  gridCellDefault: { backgroundColor: '#2E2E2E' },
  gridCellSelected: { backgroundColor: '#FFFFFF' },
  gridLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.5 },
  gridLabelSelected: { color: COLORS.text },
  gridDesc: { fontSize: 10, color: COLORS.textDim, letterSpacing: 0.3 },

  // Template cards
  templateCard: {
    width: 100,
    height: 155,
    borderRadius: 12,
    padding: 8,
    paddingBottom: 7,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  templateCardClassic: {
    // Extra emphasis — white border template
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  templateCardSelected: {
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  // Film holes — left column, vertically centred
  filmHolesPreview: {
    position: 'absolute',
    left: 5,
    top: 10,
    bottom: 30,   // leave room for label
    width: 8,
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filmHolePreview: {
    width: 6,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(200,168,122,0.55)',   // amber rim — visible on dark
  },
  templatePhotos: { flex: 1, justifyContent: 'center' },
  templatePhotoBlock: { width: '100%' },
  // Ivory polaroid footer cap
  ivoryFooter: { paddingTop: 3, alignItems: 'center' },
  ivoryLine: { height: 1, width: '70%', backgroundColor: '#B0A898', borderRadius: 1 },

  // Sky cloud decorations (top of card)
  skyTopClouds: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  skyCloudSm: { width: 12, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.75)' },
  skyCloudLg: { width: 18, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.85)' },
  templateMeta: { marginTop: 5 },
  templateName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  templateNameSelected: { color: COLORS.text },
  templateDesc: { fontSize: 9, color: COLORS.textDim, marginTop: 1 },
  templateCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary
  summary: {
    marginHorizontal: 24,
    marginTop: 28,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textMuted },
  summaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },

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
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
  },
  startText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
