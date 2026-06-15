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
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import OrderIcon from '../assets/icons/order.svg';
import { RootStackParamList, MainTabParamList, Order, OrderStatus } from '../types';
import { useApp } from '../context/AppContext';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Orders'>,
    StackNavigationProp<RootStackParamList>
  >;
};

const C = {
  bg: '#0A0A0A',
  surface: '#161616',
  surfaceRaised: '#1E1E1E',
  border: '#222222',
  text: '#FFFFFF',
  textMuted: '#666666',
  textDim: '#3A3A3A',
};

const STATUS_STEPS: OrderStatus[] = ['processing', 'shipped', 'delivered'];

const STATUS_META: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  processing: { label: 'Processing',  color: '#FF9F0A', icon: 'time-outline' },
  shipped:    { label: 'Shipped',     color: '#0A84FF', icon: 'airplane-outline' },
  delivered:  { label: 'Delivered',   color: '#30D158', icon: 'checkmark-circle-outline' },
  cancelled:  { label: 'Cancelled',   color: '#FF453A', icon: 'close-circle-outline' },
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shortId(id: string) {
  return '#' + id.slice(-6).toUpperCase();
}

// ── Cancel confirmation modal ─────────────────────────────────────────────────
function CancelModal({
  order,
  onConfirm,
  onClose,
}: {
  order: Order;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <View style={styles.modalIconCircle}>
            <Ionicons name="close-circle-outline" size={28} color="#FF453A" />
          </View>
          <Text style={styles.modalTitle}>Cancel Order?</Text>
          <Text style={styles.modalSub}>
            Cancel {shortId(order.id)} for "{order.collageName}"?{'\n'}This cannot be undone.
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Keep Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => { onConfirm(); onClose(); }}
            >
              <Text style={styles.modalConfirmText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Status timeline ───────────────────────────────────────────────────────────
function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <View style={styles.cancelledBadge}>
        <Ionicons name="close-circle-outline" size={13} color="#FF453A" />
        <Text style={styles.cancelledText}>Order Cancelled</Text>
      </View>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(status);

  return (
    <View style={styles.timeline}>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentStep;
        const active = i === currentStep;
        const meta = STATUS_META[step];
        return (
          <React.Fragment key={step}>
            <View style={styles.timelineStep}>
              <View style={[
                styles.timelineDot,
                done && { backgroundColor: meta.color, borderColor: meta.color },
                active && styles.timelineDotActive,
              ]}>
                {done && <Ionicons name="checkmark" size={9} color="#000" />}
              </View>
              <Text style={[styles.timelineLabel, done && { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>
            {i < STATUS_STEPS.length - 1 && (
              <View style={[styles.timelineLine, i < currentStep && styles.timelineLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────
function OrderCard({
  order,
  onCancel,
  onReorder,
}: {
  order: Order;
  onCancel: () => void;
  onReorder: () => void;
}) {
  const meta = STATUS_META[order.status];
  const isActive = order.status === 'processing' || order.status === 'shipped';

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>{shortId(order.id)}</Text>
          <Text style={styles.orderDate}>Placed {formatDate(order.orderedAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: meta.color + '55' }]}>
          <Ionicons name={meta.icon as any} size={12} color={meta.color} />
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Item info */}
      <View style={styles.itemRow}>
        <View style={styles.itemIcon}>
          <OrderIcon width={18} height={18} color={C.textMuted} />
        </View>
        <View style={styles.itemBody}>
          <Text style={styles.itemName} numberOfLines={1}>{order.collageName}</Text>
          <Text style={styles.itemSub}>4×6 glossy · Qty {order.quantity}</Text>
        </View>
        <Text style={styles.itemPrice}>${order.total.toFixed(2)}</Text>
      </View>

      <View style={styles.divider} />

      {/* Delivery info */}
      <View style={styles.deliveryRow}>
        <Ionicons name="location-outline" size={13} color={C.textMuted} />
        <Text style={styles.deliveryAddress} numberOfLines={1}>{order.address}</Text>
      </View>

      {order.status !== 'cancelled' && (
        <View style={styles.deliveryDateRow}>
          <Ionicons name="calendar-outline" size={13} color={C.textMuted} />
          <Text style={styles.deliveryDateText}>
            {order.status === 'delivered'
              ? 'Delivered on ' + formatDate(order.estimatedDelivery)
              : 'Est. delivery ' + formatDate(order.estimatedDelivery)}
          </Text>
        </View>
      )}

      {/* Status timeline */}
      <View style={styles.timelineWrapper}>
        <StatusTimeline status={order.status} />
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        {order.status === 'processing' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
            <Ionicons name="close-outline" size={14} color="#FF453A" />
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.reorderBtn, order.status !== 'processing' && { flex: 1 }]}
          onPress={onReorder}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh-outline" size={14} color="#000" />
          <Text style={styles.reorderText}>Reorder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function OrdersScreen({ navigation }: Props) {
  const { orders, cancelOrder } = useApp();
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);

  const active = orders.filter(o => o.status === 'processing' || o.status === 'shipped');
  const past = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  return (
    <SafeAreaView style={styles.safe}>
      {cancellingOrder && (
        <CancelModal
          order={cancellingOrder}
          onConfirm={() => cancelOrder(cancellingOrder.id)}
          onClose={() => setCancellingOrder(null)}
        />
      )}

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Orders</Text>
        </View>

        {orders.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <OrderIcon width={32} height={32} color={C.textDim} />
            </View>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>
              Orders placed from your sessions will appear here.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Active orders */}
            {active.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Active</Text>
                {active.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onCancel={() => setCancellingOrder(order)}
                    onReorder={() => navigation.navigate('Payment', { collageName: order.collageName })}
                  />
                ))}
              </>
            )}

            {/* Past orders */}
            {past.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, active.length > 0 && { marginTop: 28 }]}>
                  Past Orders
                </Text>
                {past.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onCancel={() => {}}
                    onReorder={() => navigation.navigate('Payment', { collageName: order.collageName })}
                  />
                ))}
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: C.textMuted,
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  orderId: { fontSize: 13, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
  orderDate: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  // Item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  itemBody: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: C.text },
  itemSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: C.text },

  // Delivery info
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  deliveryAddress: { flex: 1, fontSize: 12, color: C.textMuted },
  deliveryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
  },
  deliveryDateText: { fontSize: 12, color: C.textMuted },

  // Timeline
  timelineWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineStep: {
    alignItems: 'center',
    gap: 5,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  timelineLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: C.textDim,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timelineLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: C.border,
    marginBottom: 14,
    marginHorizontal: 4,
  },
  timelineLineDone: { backgroundColor: '#30D158' },

  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1A0A0A',
    borderWidth: 1,
    borderColor: '#3A1818',
    alignSelf: 'flex-start',
  },
  cancelledText: { fontSize: 12, fontWeight: '600', color: '#FF453A' },

  // Actions
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A1818',
    backgroundColor: '#1A0808',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#FF453A' },
  reorderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  reorderText: { fontSize: 13, fontWeight: '700', color: '#000' },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 24,
    width: 300,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2A0A0A',
    borderWidth: 1,
    borderColor: '#3A1818',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  modalSub: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  modalConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: C.text },
  emptySub: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
});
