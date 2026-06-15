import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const C = {
  bg: '#0A0A0A',
  surface: '#141416',
  border: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  textMuted: '#6E6E73',
};

// ── Edit profile modal ─────────────────────────────────────────────────────────
function EditProfileModal({
  currentName,
  currentEmail,
  onClose,
  onSave,
}: {
  currentName: string;
  currentEmail: string;
  onClose: () => void;
  onSave: (name: string, email: string) => Promise<void>;
}) {
  const [name, setName]   = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError]  = useState('');

  const emailChanged = email.toLowerCase().trim() !== currentEmail.toLowerCase();
  const nameChanged  = name.trim() !== currentName;
  const hasChanges   = emailChanged || nameChanged;

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await onSave(name, email);
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Edit Profile</Text>

          {/* Name field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                autoFocus
              />
            </View>
          </View>

          {/* Email field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={[styles.inputWrapper, emailChanged && styles.inputChanged]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
            {emailChanged && (
              <View style={styles.emailWarning}>
                <Ionicons name="information-circle-outline" size={13} color="#FF9F0A" />
                <Text style={styles.emailWarningText}>
                  Changing your email signs you in under the new address going forward.
                </Text>
              </View>
            )}
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#FF453A" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, (!hasChanges || saving) && { opacity: 0.45 }]}
              onPress={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#000" />
                : <Text style={styles.modalSaveText}>Save</Text>
              }
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, logout, updateProfile, updatePhotoUri } = useAuth();
  const { collages, orders } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const initials = user?.name
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    setPhotoLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        updatePhotoUri(result.assets[0].uri);
      }
    } finally {
      setPhotoLoading(false);
    }
  };

  const deliveredCount   = orders.filter(o => o.status === 'delivered').length;
  const activeOrderCount = orders.filter(o => o.status === 'processing' || o.status === 'shipped').length;

  return (
    <SafeAreaView style={styles.safe}>
      {showEdit && (
        <EditProfileModal
          currentName={user?.name ?? ''}
          currentEmail={user?.email ?? ''}
          onClose={() => setShowEdit(false)}
          onSave={updateProfile}
        />
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} disabled={photoLoading}>
            <View style={styles.avatar}>
              {user?.photoUri ? (
                <Image source={{ uri: user.photoUri }} style={styles.avatarPhoto} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
              {/* Camera badge */}
              <View style={styles.cameraBadge}>
                {photoLoading
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Ionicons name="camera" size={13} color="#FFFFFF" />
                }
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{collages.length}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{orders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{deliveredCount}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>

        {/* Active orders notice */}
        {activeOrderCount > 0 && (
          <View style={styles.activeOrderBanner}>
            <Ionicons name="airplane-outline" size={14} color="#0A84FF" />
            <Text style={styles.activeOrderText}>
              {activeOrderCount} order{activeOrderCount > 1 ? 's' : ''} on the way
            </Text>
          </View>
        )}

        {/* Account section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Account</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
              <Ionicons name="pencil-outline" size={12} color={C.textMuted} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listCard}>
            <View style={styles.listRow}>
              <Ionicons name="person-outline" size={16} color={C.textMuted} />
              <Text style={styles.listKey}>Name</Text>
              <Text style={styles.listVal} numberOfLines={1}>{user?.name}</Text>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.listRow}>
              <Ionicons name="mail-outline" size={16} color={C.textMuted} />
              <Text style={styles.listKey}>Email</Text>
              <Text style={styles.listVal} numberOfLines={1}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* App section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>App</Text>
          <View style={styles.listCard}>
            <View style={styles.listRow}>
              <Ionicons name="information-circle-outline" size={16} color={C.textMuted} />
              <Text style={styles.listKey}>Version</Text>
              <Text style={styles.listVal}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutBtn} onPress={logout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={16} color="#FF453A" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 24 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 28, gap: 6 },
  avatar: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  avatarPhoto: {
    width: 86, height: 86, borderRadius: 43,
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: C.text, letterSpacing: 1 },
  cameraBadge: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#3C3CBF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.bg,
  },
  name:  { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  email: { fontSize: 13, color: C.textMuted },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
    marginBottom: 14, overflow: 'hidden',
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 18, gap: 4 },
  statNum:  { fontSize: 22, fontWeight: '700', color: C.text },
  statLabel: { fontSize: 11, color: C.textMuted, letterSpacing: 0.3, textTransform: 'uppercase' },
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: 14 },

  // Active order banner
  activeOrderBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(10,132,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(10,132,255,0.25)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
  },
  activeOrderText: { fontSize: 13, color: '#0A84FF', fontWeight: '600' },

  // Sections
  section: { marginBottom: 14 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, paddingHorizontal: 2,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 2,
    textTransform: 'uppercase', color: C.textMuted,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
  },
  editBtnText: { fontSize: 11, fontWeight: '600', color: C.textMuted },

  listCard: {
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  listKey: { fontSize: 14, color: C.text, flex: 1 },
  listVal: { fontSize: 14, color: C.textMuted, maxWidth: 160 },
  rowDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  // Sign out
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: 'rgba(255,69,58,0.1)',
    borderRadius: 16, paddingVertical: 16,
    borderWidth: 1, borderColor: 'rgba(255,69,58,0.2)',
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#FF453A' },

  // Edit modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#1C1C1E', borderRadius: 20,
    padding: 24, width: 320, gap: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: C.text },

  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1,
    color: C.textMuted, textTransform: 'uppercase',
  },
  inputWrapper: {
    backgroundColor: '#2C2C2E', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14, height: 46, justifyContent: 'center',
  },
  inputChanged: { borderColor: '#FF9F0A' },
  input: { fontSize: 14, color: C.text, outlineStyle: 'none' } as any,

  emailWarning: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4,
  },
  emailWarningText: { fontSize: 11, color: '#FF9F0A', flex: 1, lineHeight: 16 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,69,58,0.2)',
  },
  errorText: { fontSize: 13, color: '#FF453A', flex: 1, lineHeight: 18 },

  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  modalSaveBtn: {
    flex: 1, height: 44, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: '#000' },
});
