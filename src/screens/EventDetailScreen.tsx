import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView,
  Modal, Pressable, Alert, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, PhotoCollage, EventPhoto } from '../types';
import { GRIDS } from '../data/grids';
import { TEMPLATES } from '../data/templates';
import CollageView from '../components/CollageView';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// ── Masonry height estimator ──────────────────────────────────────────────────
// Mirrors the layout math inside CollageView so we can predict each strip's
// rendered height before it's on screen, enabling greedy shortest-column assignment.
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

  const fixedH  = 2 * outerBorder + 2 * pad + headerH + footerH
                + grid.rows * ivoryCapH + photoGap * (grid.rows - 1);
  const innerW  = cardWidth - 2 * outerBorder - 2 * pad - 2 * filmSideW;
  const cellW   = Math.max(0, (innerW - photoGap * (grid.columns - 1)) / grid.columns);
  const stripH  = fixedH + cellW * PHOTO_RATIO * grid.rows;
  return stripH + 36 + 10; // +36 strip footer, +10 tile bottom margin
}

// Greedy 2-column assignment: each photo goes to whichever column is shorter.
function assignColumns(photos: EventPhoto[], cardWidth: number): [EventPhoto[], EventPhoto[]] {
  const left: EventPhoto[]  = [];
  const right: EventPhoto[] = [];
  let leftH = 0;
  let rightH = 0;
  for (const photo of photos) {
    const h = estimateStripHeight(photo.gridId, photo.templateId, cardWidth);
    if (leftH <= rightH) {
      left.push(photo);
      leftH += h;
    } else {
      right.push(photo);
      rightH += h;
    }
  }
  return [left, right];
}

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'EventDetail'>;
  route: RouteProp<RootStackParamList, 'EventDetail'>;
};

const C = {
  bg: '#0A0A0A',
  surface: '#141416',
  surfaceRaised: '#1E1E22',
  border: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  textMuted: '#6E6E73',
  accent: '#BF5AF2',
  accentDim: 'rgba(191,90,242,0.15)',
  accentBorder: 'rgba(191,90,242,0.3)',
};

// ── Add my photos modal ───────────────────────────────────────────────────────
function AddPhotosModal({
  collages,
  existingIds,
  onClose,
  onAdd,
}: {
  collages: PhotoCollage[];
  existingIds: string[];
  onClose: () => void;
  onAdd: (collage: PhotoCollage) => void;
}) {
  const available = collages.filter(c => !existingIds.includes(c.id));

  return (
    <Modal visible transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Add Your Photos</Text>
          <Text style={styles.sheetSub}>Choose a session to share with this event</Text>
          {available.length === 0 ? (
            <Text style={[styles.sheetSub, { textAlign: 'center', marginTop: 20 }]}>
              All your sessions are already shared, or you have none yet.
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {available.map(c => {
                const grid = GRIDS.find(g => g.id === c.gridId) ?? GRIDS[0];
                const tmpl = TEMPLATES.find(t => t.id === c.templateId) ?? TEMPLATES[0];
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.collageRow}
                    onPress={() => { onAdd(c); onClose(); }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.collageMini}>
                      <CollageView photos={c.photos} grid={grid} template={tmpl} collageName={c.name} width={48} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.collageName}>{c.name}</Text>
                      <Text style={styles.collageMeta}>{grid.label} · {tmpl.name}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={20} color={C.accent} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Photo strip card ──────────────────────────────────────────────────────────
function PhotoStripCard({
  photo,
  cardWidth,
  isMe,
  onPrint,
}: {
  photo: EventPhoto;
  cardWidth: number;
  isMe: boolean;
  onPrint: () => void;
}) {
  const grid = GRIDS.find(g => g.id === photo.gridId) ?? GRIDS[0];
  const tmpl = TEMPLATES.find(t => t.id === photo.templateId) ?? TEMPLATES[0];

  return (
    <View style={[styles.stripCard, { width: cardWidth }]}>
      <CollageView
        photos={photo.photos}
        grid={grid}
        template={tmpl}
        collageName={photo.collageName}
        width={cardWidth}
      />
      <View style={styles.stripFooter}>
        <View style={[styles.stripAvatar, isMe && { backgroundColor: C.accentDim, borderColor: C.accentBorder }]}>
          <Text style={[styles.stripAvatarText, isMe && { color: C.accent }]}>
            {photo.userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.stripName} numberOfLines={1}>{isMe ? 'You' : photo.userName.split(' ')[0]}</Text>
        <TouchableOpacity style={styles.stripPrintBtn} onPress={onPrint} activeOpacity={0.8}>
          <Ionicons name="print-outline" size={12} color={C.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function EventDetailScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const { user } = useAuth();
  const { events, collages, addPhotoToEvent, deleteEvent } = useApp();
  const [showAddPhotos, setShowAddPhotos] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [containerW, setContainerW] = useState(0);

  // 2-column masonry: section has paddingHorizontal:16 on each side (32 total)
  // plus an 8px gap between columns → subtract 40 and halve
  const cardWidth = containerW > 0 ? Math.floor((containerW - 40) / 2) : 0;

  const event = events.find(e => e.id === eventId);

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.textMuted }}>Event not found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ color: C.accent }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isHost = event.createdBy === user?.id;
  const myPhotoIds = event.photos.filter(p => p.userId === user?.id).map(p => p.collageId);

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(event.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch { }
  };

  const handleAddPhoto = (collage: PhotoCollage) => {
    if (!user) return;
    const photo: EventPhoto = {
      id: `${user.id}_${collage.id}`,
      userId: user.id,
      userName: user.name,
      collageId: collage.id,
      collageName: collage.name,
      photos: collage.photos,
      gridId: collage.gridId,
      templateId: collage.templateId,
      addedAt: new Date(),
    };
    addPhotoToEvent(event.id, photo);
  };

  // Group photos by member
  const memberMap: Record<string, { name: string; photos: EventPhoto[] }> = {};
  event.photos.forEach(p => {
    if (!memberMap[p.userId]) memberMap[p.userId] = { name: p.userName, photos: [] };
    memberMap[p.userId].photos.push(p);
  });

  // Put "me" first
  const orderedUserIds = Object.keys(memberMap).sort(a => (a === user?.id ? -1 : 0));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <Modal visible transparent animationType="fade">
          <Pressable style={styles.overlay} onPress={() => setShowDeleteConfirm(false)}>
            <Pressable style={[styles.sheet, { borderRadius: 20, margin: 24, paddingBottom: 24 }]} onPress={() => {}}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,69,58,0.12)', borderWidth: 1, borderColor: 'rgba(255,69,58,0.25)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
                <Ionicons name="trash-outline" size={24} color="#FF453A" />
              </View>
              <Text style={[styles.sheetTitle, { textAlign: 'center' }]}>Delete Event?</Text>
              <Text style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 }}>
                "{event?.name}" will be permanently deleted for everyone. This cannot be undone.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, height: 46, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: C.textMuted }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, height: 46, borderRadius: 12, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => { deleteEvent(eventId); navigation.goBack(); }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {showAddPhotos && (
        <AddPhotosModal
          collages={collages}
          existingIds={myPhotoIds}
          onClose={() => setShowAddPhotos(false)}
          onAdd={handleAddPhoto}
        />
      )}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onLayout={e => setContainerW(e.nativeEvent.layout.width)}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{event.name}</Text>
            {event.description ? (
              <Text style={styles.headerSub} numberOfLines={1}>{event.description}</Text>
            ) : null}
          </View>
          {isHost ? (
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: 'rgba(255,69,58,0.1)', borderWidth: 1, borderColor: 'rgba(255,69,58,0.25)' }]}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Ionicons name="trash-outline" size={17} color="#FF453A" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {/* Info bar */}
        <View style={styles.infoBar}>
          {/* Members */}
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={13} color={C.textMuted} />
            <Text style={styles.infoText}>{event.members.length} member{event.members.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.infoDot} />
          {/* Photos */}
          <View style={styles.infoItem}>
            <Ionicons name="images-outline" size={13} color={C.textMuted} />
            <Text style={styles.infoText}>{event.photos.length} photo{event.photos.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.infoDot} />
          {/* Host */}
          <View style={styles.infoItem}>
            <Ionicons name="star-outline" size={13} color={C.textMuted} />
            <Text style={styles.infoText}>{isHost ? 'You' : event.createdByName.split(' ')[0]}</Text>
          </View>
        </View>

        {/* Invite code card */}
        <View style={styles.inviteCard}>
          <View>
            <Text style={styles.inviteLabel}>Invite Code</Text>
            <Text style={styles.inviteCode}>{event.inviteCode}</Text>
            <Text style={styles.inviteHint}>Share this code so friends can join the event</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode} activeOpacity={0.8}>
            <Ionicons name={codeCopied ? 'checkmark' : 'copy-outline'} size={16} color={codeCopied ? '#30D158' : C.accent} />
            <Text style={[styles.copyBtnText, codeCopied && { color: '#30D158' }]}>
              {codeCopied ? 'Copied!' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Members row */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Members</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersRow}>
            {event.members.map(m => {
              const isMe = m.userId === user?.id;
              const initials = m.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
              return (
                <View key={m.userId} style={styles.memberChip}>
                  <View style={[styles.memberAvatar, isMe && { backgroundColor: C.accentDim, borderColor: C.accentBorder }]}>
                    <Text style={[styles.memberInitials, isMe && { color: C.accent }]}>{initials}</Text>
                  </View>
                  <Text style={styles.memberName} numberOfLines={1}>{isMe ? 'You' : m.name.split(' ')[0]}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Add my photos button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.addPhotosBtn} onPress={() => setShowAddPhotos(true)} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={18} color={C.accent} />
            <Text style={styles.addPhotosBtnText}>Add My Photostrips</Text>
          </TouchableOpacity>
        </View>

        {/* Photos by member */}
        {event.photos.length === 0 ? (
          <View style={styles.emptyPhotos}>
            <Ionicons name="images-outline" size={32} color="rgba(255,255,255,0.15)" />
            <Text style={styles.emptyPhotosText}>No photos yet — be the first to share!</Text>
          </View>
        ) : (
          orderedUserIds.map(uid => {
            const group = memberMap[uid];
            const isMe = uid === user?.id;
            return (
              <View key={uid} style={styles.section}>
                <View style={styles.sectionRow}>
                  <View style={[styles.groupAvatar, isMe && { backgroundColor: C.accentDim, borderColor: C.accentBorder }]}>
                    <Text style={[styles.groupAvatarText, isMe && { color: C.accent }]}>
                      {group.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.groupName}>{isMe ? 'Your Photos' : group.name}</Text>
                  <Text style={styles.groupCount}>{group.photos.length}</Text>
                </View>
                {cardWidth > 0 && (() => {
                  const [leftPhotos, rightPhotos] = assignColumns(group.photos, cardWidth);
                  return (
                    <View style={styles.masonryColumns}>
                      <View style={styles.masonryCol}>
                        {leftPhotos.map(photo => (
                          <View key={photo.id} style={styles.masonryTile}>
                            <PhotoStripCard
                              photo={photo}
                              cardWidth={cardWidth}
                              isMe={isMe}
                              onPrint={() => navigation.navigate('Payment', { collageName: photo.collageName, collageId: photo.collageId })}
                            />
                          </View>
                        ))}
                      </View>
                      <View style={styles.masonryCol}>
                        {rightPhotos.map(photo => (
                          <View key={photo.id} style={styles.masonryTile}>
                            <PhotoStripCard
                              photo={photo}
                              cardWidth={cardWidth}
                              isMe={isMe}
                              onPrint={() => navigation.navigate('Payment', { collageName: photo.collageName, collageId: photo.collageId })}
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })()}
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  headerSub: { fontSize: 12, color: C.textMuted },

  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: C.textMuted },
  infoDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textMuted },

  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: C.accentDim,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  inviteLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: C.accent, textTransform: 'uppercase', marginBottom: 4 },
  inviteCode: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: 6 },
  inviteHint: { fontSize: 11, color: C.textMuted, marginTop: 4 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(191,90,242,0.2)',
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: C.accent },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase',
    color: C.textMuted, marginBottom: 10,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },

  membersRow: { flexDirection: 'row' },
  memberChip: { alignItems: 'center', marginRight: 14, width: 52, gap: 5 },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.surfaceRaised,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  memberInitials: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  memberName: { fontSize: 10, color: C.textMuted, textAlign: 'center' },

  addPhotosBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12,
    backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accentBorder,
  },
  addPhotosBtnText: { fontSize: 14, fontWeight: '600', color: C.accent },

  groupAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.surfaceRaised,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  groupAvatarText: { fontSize: 9, fontWeight: '700', color: C.textMuted },
  groupName: { fontSize: 13, fontWeight: '600', color: C.text, flex: 1 },
  groupCount: { fontSize: 11, color: C.textMuted },
  masonryColumns: { flexDirection: 'row', gap: 8 },
  masonryCol: { flex: 1 },
  masonryTile: { marginBottom: 10 },

  stripCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  stripFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 7,
  },
  stripAvatar: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.surfaceRaised,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stripAvatarText: { fontSize: 7, fontWeight: '700', color: C.textMuted },
  stripName: { flex: 1, fontSize: 10, fontWeight: '600', color: C.textMuted },
  stripPrintBtn: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.surfaceRaised,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },

  emptyPhotos: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 48, gap: 12, paddingHorizontal: 40,
  },
  emptyPhotosText: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 21 },

  // Sheet / modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  sheetSub: { fontSize: 13, color: C.textMuted, marginTop: -8 },
  collageRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  collageMini: { width: 48, height: 72, borderRadius: 6, overflow: 'hidden', backgroundColor: C.surface },
  collageName: { fontSize: 14, fontWeight: '600', color: C.text },
  collageMeta: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  doneBtn: {
    backgroundColor: C.accent, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
});
