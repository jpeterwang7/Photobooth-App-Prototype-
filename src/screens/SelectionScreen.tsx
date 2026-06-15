import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Selection'>;
  route: RouteProp<RootStackParamList, 'Selection'>;
};

const { width: SCREEN_W } = Dimensions.get('window');
const MAX_W = Math.min(SCREEN_W, 600);
const PAD = 20;
const GAP = 6;
const COLS = 2;
const CELL_W = (MAX_W - PAD * 2 - GAP * (COLS - 1)) / COLS;
// Taller than wide to match the camera crop guide (1.35), but photos are
// shown with `contain` so the full capture is visible — no extreme cropping
const CELL_H = CELL_W * 1.35;

const C = {
  bg: '#0A0A0A',
  surface: '#161616',
  border: '#222222',
  text: '#FFFFFF',
  muted: '#666666',
  dim: '#2A2A2A',
};

export default function SelectionScreen({ navigation, route }: Props) {
  const { photos, gridId, templateId, collageName, requiredCount } = route.params;
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (idx: number) => {
    setSelected(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length >= requiredCount) return prev;
      return [...prev, idx];
    });
  };

  const canProceed = selected.length === requiredCount;
  const remaining = requiredCount - selected.length;

  const handleNext = () => {
    const orderedPhotos = selected.map(i => photos[i]);
    navigation.navigate('Collage', {
      selectedPhotos: orderedPhotos,
      gridId,
      templateId,
      collageName,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Choose Favorites</Text>
            <View style={styles.progressPill}>
              <Text style={styles.progressText}>
                {selected.length} / {requiredCount}
              </Text>
            </View>
          </View>

          <View style={{ width: 34 }} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(selected.length / requiredCount) * 100}%` as any,
                backgroundColor: canProceed ? '#30D158' : '#FFFFFF',
              },
            ]}
          />
        </View>

        {/* Hint */}
        <Text style={styles.hint}>
          {canProceed
            ? 'Looking good — tap Next'
            : `Pick ${remaining} more photo${remaining !== 1 ? 's' : ''}`}
        </Text>

        {/* Grid */}
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
        >
          {photos.map((photo, idx) => {
            const isSelected = selected.includes(idx);
            const selectionOrder = isSelected ? selected.indexOf(idx) + 1 : null;
            const isDisabled = !isSelected && selected.length >= requiredCount;

            return (
              <TouchableOpacity
                key={idx}
                onPress={() => toggle(idx)}
                activeOpacity={0.88}
                style={[
                  styles.cell,
                  isSelected && styles.cellSelected,
                  isDisabled && styles.cellDisabled,
                ]}
              >
                {photo ? (
                  <Image
                    source={{ uri: photo }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.photo, styles.photoEmpty]}>
                    <Ionicons name="image-outline" size={28} color="#333" />
                  </View>
                )}

                {/* Dim overlay when at limit */}
                {isDisabled && <View style={styles.dimOverlay} />}

                {/* Selected tint */}
                {isSelected && <View style={styles.selectedTint} />}

                {/* Corner brackets when selected */}
                {isSelected && (
                  <>
                    <View style={[styles.bracket, styles.bracketTL]} />
                    <View style={[styles.bracket, styles.bracketTR]} />
                    <View style={[styles.bracket, styles.bracketBL]} />
                    <View style={[styles.bracket, styles.bracketBR]} />
                  </>
                )}

                {/* Order badge */}
                {isSelected && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{selectionOrder}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected strip */}
        {selected.length > 0 && (
          <View style={styles.strip}>
            <Text style={styles.stripLabel}>ORDER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stripScroll}>
              <View style={styles.stripRow}>
                {selected.map((photoIdx, order) => (
                  <TouchableOpacity
                    key={order}
                    onPress={() => toggle(photoIdx)}
                    style={styles.stripThumb}
                  >
                    {photos[photoIdx] ? (
                      <Image
                        source={{ uri: photos[photoIdx] }}
                        style={styles.stripThumbImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.stripThumbImg, { backgroundColor: '#222' }]} />
                    )}
                    <View style={styles.stripOrder}>
                      <Text style={styles.stripOrderText}>{order + 1}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {Array.from({ length: requiredCount - selected.length }).map((_, i) => (
                  <View key={`empty-${i}`} style={[styles.stripThumb, styles.stripThumbEmpty]}>
                    <Ionicons name="add" size={14} color="#333" />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Next button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, !canProceed && styles.nextBtnOff]}
            onPress={handleNext}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text style={[styles.nextText, !canProceed && styles.nextTextOff]}>
              Build Collage
            </Text>
            <Ionicons name="arrow-forward" size={17} color={canProceed ? '#000' : '#444'} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    letterSpacing: 0.3,
  },
  progressPill: {
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  progressText: { fontSize: 12, fontWeight: '600', color: C.muted },

  progressBar: {
    height: 1.5,
    backgroundColor: C.dim,
    marginHorizontal: 20,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },

  hint: {
    fontSize: 12,
    color: C.muted,
    letterSpacing: 0.3,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },

  scroll: { flex: 1, paddingHorizontal: PAD },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingBottom: 16,
  },

  cell: {
    width: CELL_W,
    height: CELL_H,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: C.surface,
  },
  cellSelected: {
    borderColor: '#FFFFFF',
  },
  cellDisabled: {
    opacity: 0.4,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  selectedTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // Corner brackets
  bracket: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  bracketTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  bracketTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bracketBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bracketBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  badge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#000' },

  // Selection strip
  strip: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  stripLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.muted,
    textTransform: 'uppercase',
  },
  stripScroll: { flexGrow: 0 },
  stripRow: { flexDirection: 'row', gap: 6 },
  stripThumb: {
    width: 38,
    height: 52,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: C.surface,
    position: 'relative',
  },
  stripThumbImg: { width: '100%', height: '100%' },
  stripThumbEmpty: {
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripOrder: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripOrderText: { fontSize: 8, fontWeight: '800', color: '#FFF' },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingTop: 12,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 15,
  },
  nextBtnOff: { backgroundColor: C.surface },
  nextText: { fontSize: 15, fontWeight: '700', color: '#000' },
  nextTextOff: { color: '#444' },
});
