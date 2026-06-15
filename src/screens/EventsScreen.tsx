import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView,
  Modal, Pressable, TextInput, Alert, Platform,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import EventIcon from '../assets/icons/event.svg';
import { MainTabParamList, RootStackParamList, PhotoEvent, Friend } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Events'>,
    StackNavigationProp<RootStackParamList>
  >;
};

const C = {
  bg: '#0A0A0A',
  surface: '#141416',
  surfaceRaised: '#1E1E22',
  border: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  textMuted: '#6E6E73',
  accent: '#BF5AF2',    // purple — distinctive for Events
  accentDim: 'rgba(191,90,242,0.15)',
  accentBorder: 'rgba(191,90,242,0.3)',
};

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function formatEventDate(d?: Date) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Create event modal ─────────────────────────────────────────────────────────
function CreateEventModal({
  onClose,
  onCreate,
  friends,
}: {
  onClose: () => void;
  onCreate: (name: string, description: string, friendIds: string[]) => void;
  friends: Friend[];
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const toggleFriend = (id: string) =>
    setSelectedFriends(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  return (
    <Modal visible transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>New Event</Text>
          <Text style={styles.sheetSub}>Create a shared photo album for your crew</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Event Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Summer Bash, Birthday Party…"
                placeholderTextColor={C.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <View style={[styles.inputWrapper, { height: 72 }]}>
              <TextInput
                style={[styles.input, { textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Add a note for your guests…"
                placeholderTextColor={C.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                returnKeyType="done"
              />
            </View>
          </View>

          {friends.length > 0 && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Invite Friends</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsRow}>
                {friends.map(f => {
                  const sel = selectedFriends.includes(f.id);
                  const initials = f.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.friendChip, sel && styles.friendChipSelected]}
                      onPress={() => toggleFriend(f.id)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.friendAvatar, sel && styles.friendAvatarSelected]}>
                        <Text style={[styles.friendInitials, sel && { color: '#000' }]}>{initials}</Text>
                      </View>
                      <Text style={[styles.friendName, sel && styles.friendNameSelected]} numberOfLines={1}>
                        {f.name.split(' ')[0]}
                      </Text>
                      {sel && (
                        <View style={styles.friendCheckDot}>
                          <Ionicons name="checkmark" size={8} color="#000" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, !name.trim() && styles.createBtnDisabled]}
              onPress={() => { if (name.trim()) { onCreate(name.trim(), description.trim(), selectedFriends); onClose(); }}}
              disabled={!name.trim()}
            >
              <Ionicons name="sparkles" size={15} color="#000" />
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Join event modal ───────────────────────────────────────────────────────────
function JoinEventModal({
  onClose,
  onJoin,
}: {
  onClose: () => void;
  onJoin: (code: string) => void;
}) {
  const [code, setCode] = useState('');
  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <View style={styles.joinIconCircle}>
            <Ionicons name="qr-code-outline" size={26} color={C.accent} />
          </View>
          <Text style={styles.modalTitle}>Join an Event</Text>
          <Text style={styles.modalSub}>Enter the 6-character invite code shared by the host</Text>
          <View style={styles.codeInputWrapper}>
            <TextInput
              style={styles.codeInput}
              placeholder="ABC123"
              placeholderTextColor={C.textMuted}
              value={code}
              onChangeText={v => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              autoCapitalize="characters"
              autoFocus
              returnKeyType="go"
              onSubmitEditing={() => { if (code.length === 6) { onJoin(code); onClose(); }}}
            />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, code.length < 6 && { opacity: 0.4 }]}
              onPress={() => { if (code.length === 6) { onJoin(code); onClose(); }}}
              disabled={code.length < 6}
            >
              <Text style={styles.modalConfirmText}>Join</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Add friend modal ──────────────────────────────────────────────────────────
function AddFriendModal({
  onClose,
  onAdd,
  onImportContacts,
}: {
  onClose: () => void;
  onAdd: (name: string, email: string, phone?: string) => void;
  onImportContacts: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Add a Friend</Text>
          <Text style={styles.modalSub}>Add manually or import from your contacts</Text>

          <View style={styles.fieldGroup}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor={C.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="next"
              />
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={C.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.contactsBtn} onPress={() => { onClose(); onImportContacts(); }}>
            <Ionicons name="people-outline" size={16} color={C.accent} />
            <Text style={styles.contactsBtnText}>Import from Contacts</Text>
          </TouchableOpacity>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, (!name.trim() || !email.trim()) && { opacity: 0.4 }]}
              onPress={() => { if (name.trim() && email.trim()) { onAdd(name.trim(), email.trim()); onClose(); }}}
              disabled={!name.trim() || !email.trim()}
            >
              <Text style={styles.modalConfirmText}>Add</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Contacts picker modal ─────────────────────────────────────────────────────
function ContactsModal({
  contacts,
  onClose,
  onSelect,
}: {
  contacts: { id: string; name: string; email?: string; phone?: string }[];
  onClose: () => void;
  onSelect: (c: { id: string; name: string; email?: string; phone?: string }) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Modal visible transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { maxHeight: '80%' }]} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Contacts</Text>
          <View style={[styles.inputWrapper, { marginHorizontal: 0, marginBottom: 12 }]}>
            <TextInput
              style={styles.input}
              placeholder="Search…"
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filtered.length === 0 ? (
              <Text style={[styles.modalSub, { textAlign: 'center', marginTop: 24 }]}>No contacts found</Text>
            ) : filtered.map(c => (
              <TouchableOpacity
                key={c.id}
                style={styles.contactRow}
                onPress={() => { onSelect(c); onClose(); }}
                activeOpacity={0.75}
              >
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactInitials}>
                    {c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  {c.email && <Text style={styles.contactDetail}>{c.email}</Text>}
                  {!c.email && c.phone && <Text style={styles.contactDetail}>{c.phone}</Text>}
                </View>
                <Ionicons name="add-circle-outline" size={20} color={C.accent} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Event card ─────────────────────────────────────────────────────────────────
function EventCard({ event, onPress, isOwner }: { event: PhotoEvent; onPress: () => void; isOwner: boolean }) {
  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.82}>
      {/* Color accent strip */}
      <View style={styles.eventStrip} />
      <View style={styles.eventCardInner}>
        <View style={styles.eventCardTop}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
            {event.description ? (
              <Text style={styles.eventDesc} numberOfLines={1}>{event.description}</Text>
            ) : null}
          </View>
          {isOwner && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>Host</Text>
            </View>
          )}
        </View>

        {formatEventDate(event.eventDate) && (
          <View style={styles.eventMeta}>
            <EventIcon width={11} height={11} color={C.textMuted} />
            <Text style={styles.eventMetaText}>{formatEventDate(event.eventDate)}</Text>
          </View>
        )}

        <View style={styles.eventFooter}>
          <View style={styles.eventMeta}>
            <Ionicons name="people-outline" size={11} color={C.textMuted} />
            <Text style={styles.eventMetaText}>{event.members.length} member{event.members.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.eventMeta}>
            <Ionicons name="images-outline" size={11} color={C.textMuted} />
            <Text style={styles.eventMetaText}>{event.photos.length} photo{event.photos.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.eventCodeBadge}>
            <Text style={styles.eventCode}>{event.inviteCode}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function EventsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { friends, addFriend, events, createEvent, joinEvent } = useApp();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [contacts, setContacts] = useState<{ id: string; name: string; email?: string; phone?: string }[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  const myEvents = events.filter(e =>
    e.createdBy === user?.id || e.members.some(m => m.userId === user?.id)
  );

  const handleImportContacts = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Contact import is only available on iPhone.');
      return;
    }
    try {
      const Contacts = await import('expo-contacts');
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please allow Contacts access in Settings.');
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
      });
      const mapped = data
        .filter(c => c.name)
        .map(c => ({
          id: c.id ?? Math.random().toString(),
          name: c.name!,
          email: c.emails?.[0]?.email,
          phone: c.phoneNumbers?.[0]?.number,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setContacts(mapped);
      setShowContacts(true);
    } catch (e) {
      Alert.alert('Error', 'Could not load contacts.');
    }
  };

  const handleCreateEvent = (name: string, description: string, friendIds: string[]) => {
    if (!user) return;
    const now = new Date();
    const invitedFriends = friends.filter(f => friendIds.includes(f.id));
    const event: import('../types').PhotoEvent = {
      id: Date.now().toString(),
      name,
      description: description || undefined,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: now,
      inviteCode: generateInviteCode(),
      members: [
        { userId: user.id, name: user.name, joinedAt: now },
        ...invitedFriends.map(f => ({ userId: f.id, name: f.name, joinedAt: now })),
      ],
      photos: [],
    };
    createEvent(event);
  };

  const handleJoin = (code: string) => {
    if (!user) return;
    const result = joinEvent(code, user.id, user.name);
    if (!result) Alert.alert('Not found', 'No event with that invite code.');
  };

  const handleAddFriend = (name: string, email: string, phone?: string) => {
    addFriend({ id: Date.now().toString(), name, email, phone, addedAt: new Date() });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateEvent}
          friends={friends}
        />
      )}
      {showJoin && (
        <JoinEventModal
          onClose={() => setShowJoin(false)}
          onJoin={handleJoin}
        />
      )}
      {showAddFriend && (
        <AddFriendModal
          onClose={() => setShowAddFriend(false)}
          onAdd={handleAddFriend}
          onImportContacts={handleImportContacts}
        />
      )}
      {showContacts && (
        <ContactsModal
          contacts={contacts}
          onClose={() => setShowContacts(false)}
          onSelect={c => handleAddFriend(c.name, c.email ?? '', c.phone)}
        />
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Events</Text>
            <Text style={styles.headerSub}>Shared photo albums with friends</Text>
          </View>
          <TouchableOpacity style={styles.addFriendBtn} onPress={() => setShowAddFriend(true)}>
            <Ionicons name="person-add-outline" size={16} color={C.accent} />
          </TouchableOpacity>
        </View>

        {/* Friends strip */}
        {friends.length > 0 && (
          <View style={styles.friendsSection}>
            <TouchableOpacity style={styles.friendsSectionHeader} onPress={() => setShowFriends(f => !f)}>
              <Text style={styles.sectionLabel}>Friends · {friends.length}</Text>
              <Ionicons name={showFriends ? 'chevron-up' : 'chevron-down'} size={14} color={C.textMuted} />
            </TouchableOpacity>
            {showFriends && (
              <View style={styles.friendsList}>
                {friends.map(f => {
                  const initials = f.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <View key={f.id} style={styles.friendListRow}>
                      <View style={styles.friendListAvatar}>
                        <Text style={styles.friendListInitials}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.friendListName}>{f.name}</Text>
                        <Text style={styles.friendListEmail}>{f.email}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowCreate(true)} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={18} color={C.accent} />
            <Text style={styles.actionBtnText}>Create Event</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => setShowJoin(true)} activeOpacity={0.8}>
            <Ionicons name="enter-outline" size={18} color={C.text} />
            <Text style={[styles.actionBtnText, { color: C.text }]}>Join with Code</Text>
          </TouchableOpacity>
        </View>

        {/* Events list */}
        {myEvents.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <EventIcon width={36} height={36} color="rgba(255,255,255,0.2)" />
            </View>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySub}>
              Create an event and invite your friends to share photostrips together.
            </Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            <Text style={styles.sectionLabel}>Your Events · {myEvents.length}</Text>
            {myEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isOwner={event.createdBy === user?.id}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
              />
            ))}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  addFriendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: C.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // Friends section
  friendsSection: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  friendsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  friendsList: { paddingHorizontal: 14, paddingBottom: 10 },
  friendListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  friendListAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: C.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendListInitials: { fontSize: 11, fontWeight: '700', color: C.accent },
  friendListName: { fontSize: 13, fontWeight: '600', color: C.text },
  friendListEmail: { fontSize: 11, color: C.textMuted },

  // Action row
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  actionBtnSecondary: {
    backgroundColor: C.surface,
    borderColor: C.border,
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: C.accent },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: C.textMuted,
    marginBottom: 10,
  },

  // Event cards
  eventsList: { gap: 2 },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  eventStrip: {
    width: 4,
    backgroundColor: C.accent,
  },
  eventCardInner: { flex: 1, padding: 14, gap: 6 },
  eventCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  eventName: { fontSize: 15, fontWeight: '700', color: C.text },
  eventDesc: { fontSize: 12, color: C.textMuted },
  hostBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  hostBadgeText: { fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 0.5 },
  eventFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventMetaText: { fontSize: 11, color: C.textMuted },
  eventCodeBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: C.border,
  },
  eventCode: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5 },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 21 },

  // Modals / sheets
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  sheetSub: { fontSize: 13, color: C.textMuted, marginTop: -10 },
  sheetActions: { flexDirection: 'row', gap: 10 },

  modalCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  joinIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.accentDim,
    borderWidth: 1, borderColor: C.accentBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'center' },
  modalSub: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 19 },
  codeInputWrapper: {
    width: '100%',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.accentBorder,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    letterSpacing: 8,
    textAlign: 'center',
    outlineStyle: 'none',
    width: '100%',
  } as any,

  fieldGroup: { gap: 6, width: '100%' },
  fieldLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, color: C.textMuted, textTransform: 'uppercase' },
  inputWrapper: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    height: 46,
    justifyContent: 'center',
  },
  input: { fontSize: 14, color: C.text, outlineStyle: 'none' } as any,

  friendsRow: { marginTop: 4 },
  friendChip: {
    alignItems: 'center',
    marginRight: 12,
    width: 60,
    gap: 4,
    position: 'relative',
  },
  friendChipSelected: {},
  friendAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.surfaceRaised,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  friendAvatarSelected: { backgroundColor: C.accent, borderColor: C.accent },
  friendInitials: { fontSize: 13, fontWeight: '700', color: C.text },
  friendName: { fontSize: 10, color: C.textMuted, textAlign: 'center' },
  friendNameSelected: { color: C.accent },
  friendCheckDot: {
    position: 'absolute', top: 0, right: 4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },

  contactsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: C.accentBorder,
    width: '100%',
    justifyContent: 'center',
  },
  contactsBtnText: { fontSize: 14, fontWeight: '600', color: C.accent },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  contactAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.surfaceRaised,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  contactInitials: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: '600', color: C.text },
  contactDetail: { fontSize: 12, color: C.textMuted, marginTop: 1 },

  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  modalCancelBtn: {
    flex: 1, height: 44, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  modalConfirmBtn: {
    flex: 1, height: 44, borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  cancelBtn: {
    flex: 1, height: 46, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  createBtn: {
    flex: 1, height: 46, borderRadius: 12,
    backgroundColor: C.accent,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 6,
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },
});
