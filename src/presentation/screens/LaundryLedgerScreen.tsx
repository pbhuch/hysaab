import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { ThemeColors } from '../theme/theme';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { useAppSelector, useAppDispatch } from '../store';
import { addLaundryEntry, updateLaundryEntry, addVendor, deleteLaundryEntry } from '../store/laundrySlice';
import { LaundryEntry, Vendor } from '../../domain/types';

interface LaundryLedgerScreenProps {
  colors: ThemeColors;
}

const DEFAULT_RATES = {
  shirts: 10,
  pants: 12,
  bedsheets: 30,
  towels: 15,
  others: 10,
};

export const LaundryLedgerScreen: React.FC<LaundryLedgerScreenProps> = ({ colors }) => {
  const dispatch = useAppDispatch();
  const laundryState = useAppSelector(state => state.laundry);

  const [activeTab, setActiveTab] = useState<'sent' | 'history' | 'vendors'>('sent');

  // Modals visibility
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [vendorModalVisible, setVendorModalVisible] = useState(false);

  // Add Entry Form state
  const [entryDateSent, setEntryDateSent] = useState(new Date().toISOString().split('T')[0]);
  const [entryVendorId, setEntryVendorId] = useState('');
  const [itemsCount, setItemsCount] = useState({
    shirts: 0,
    pants: 0,
    bedsheets: 0,
    towels: 0,
    others: 0,
  });
  const [rateMap, setRateMap] = useState({ ...DEFAULT_RATES });
  const [entryNote, setEntryNote] = useState('');

  // Add Vendor Form state
  const [vName, setVName] = useState('');
  const [vPhone, setVPhone] = useState('');

  // Auto-calculated total
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  useEffect(() => {
    let tot = 0;
    tot += itemsCount.shirts * rateMap.shirts;
    tot += itemsCount.pants * rateMap.pants;
    tot += itemsCount.bedsheets * rateMap.bedsheets;
    tot += itemsCount.towels * rateMap.towels;
    tot += itemsCount.others * rateMap.others;
    setCalculatedTotal(tot);
  }, [itemsCount, rateMap]);

  // Stepper helper
  const adjustItemCount = (key: keyof typeof itemsCount, delta: number) => {
    setItemsCount(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  // Submit handlers
  const submitEntry = () => {
    if (!entryVendorId || calculatedTotal === 0) {
      Alert.alert('Error', 'Please select a vendor and add at least one clothing item.');
      return;
    }

    const newEntry: LaundryEntry = {
      id: 'le_' + Date.now(),
      date_sent: entryDateSent,
      vendor_id: entryVendorId,
      items: { ...itemsCount },
      rate_map: { ...rateMap },
      total: calculatedTotal,
      note: entryNote,
      status: 'sent',
    };

    dispatch(addLaundryEntry(newEntry));
    setEntryModalVisible(false);
    // Reset Form
    setEntryVendorId('');
    setItemsCount({ shirts: 0, pants: 0, bedsheets: 0, towels: 0, others: 0 });
    setEntryNote('');
  };

  const handleMarkReceived = (entry: LaundryEntry) => {
    const updated: LaundryEntry = {
      ...entry,
      status: 'received',
      date_received: new Date().toISOString().split('T')[0],
    };
    dispatch(updateLaundryEntry(updated));
  };

  const submitVendor = () => {
    if (!vName || !vPhone) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    if (laundryState.vendors.some(v => v.name.toLowerCase() === vName.toLowerCase())) {
      Alert.alert('Error', 'Vendor with this name already exists.');
      return;
    }

    const newVendor: Vendor = {
      id: 'v_laundry_' + Date.now(),
      type: 'laundry',
      name: vName,
      phone: vPhone,
      base_rate: 10,
      schedule: 'custom',
      active: true,
    };

    dispatch(addVendor(newVendor));
    setVendorModalVisible(false);
    setVName('');
    setVPhone('');
  };

  const getVendorName = (id: string) => {
    return laundryState.vendors.find(v => v.id === id)?.name || 'Unknown Dhobi';
  };

  const renderLaundryItemCounts = (items: LaundryEntry['items']) => {
    const parts: string[] = [];
    if (items.shirts > 0) parts.push(`Shirts: ${items.shirts}`);
    if (items.pants > 0) parts.push(`Pants: ${items.pants}`);
    if (items.bedsheets > 0) parts.push(`Bedsheets: ${items.bedsheets}`);
    if (items.towels > 0) parts.push(`Towels: ${items.towels}`);
    if (items.others > 0) parts.push(`Others: ${items.others}`);
    return parts.join(', ');
  };

  const activeSentEntries = laundryState.entries.filter(e => e.status === 'sent');
  const receivedEntries = laundryState.entries.filter(e => e.status === 'received');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sub Header Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'sent' ? colors.primary : colors.textMuted }]}>
            Sent ({activeSentEntries.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'history' ? colors.primary : colors.textMuted }]}>
            Received History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vendors' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('vendors')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'vendors' ? colors.primary : colors.textMuted }]}>
            Vendors
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab contents */}
      {activeTab === 'sent' && (
        <FlatList
          data={activeSentEntries}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <EmptyState
              title="No Pending Laundry"
              description="All clothes sent to the laundry have been received and reconciled."
              colors={colors}
              tip="Add a laundry entry with clothes counts when sending a bag to the drycleaners/dhobi."
            />
          }
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <Card colors={colors} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View>
                  <Text style={[styles.vendorLabel, { color: colors.text }]}>{getVendorName(item.vendor_id)}</Text>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Sent on: {item.date_sent}</Text>
                </View>
                <TouchableOpacity onPress={() => dispatch(deleteLaundryEntry(item.id))}>
                  <Text style={{ color: colors.danger, fontSize: 13 }}>Delete</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.itemsText, { color: colors.text }]}>
                {renderLaundryItemCounts(item.items)}
              </Text>

              <View style={[styles.entryMeta, { borderTopColor: colors.border }]}>
                <Text style={[styles.metaAmount, { color: colors.primary }]}>₹{item.total}</Text>
                <Button
                  title="Mark Received"
                  size="sm"
                  colors={colors}
                  onPress={() => handleMarkReceived(item)}
                />
              </View>
              {item.note && <Text style={[styles.noteText, { color: colors.textMuted }]}>Note: {item.note}</Text>}
            </Card>
          )}
        />
      )}

      {activeTab === 'history' && (
        <FlatList
          data={receivedEntries}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <EmptyState
              title="No Received History"
              description="Logs of received and settled laundry entries will appear here."
              colors={colors}
            />
          }
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <Card colors={colors} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View>
                  <Text style={[styles.vendorLabel, { color: colors.text }]}>{getVendorName(item.vendor_id)}</Text>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>
                    Sent: {item.date_sent} | Received: {item.date_received}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.itemsText, { color: colors.text }]}>
                {renderLaundryItemCounts(item.items)}
              </Text>

              <View style={[styles.entryMeta, { borderTopColor: colors.border }]}>
                <Text style={[styles.metaAmount, { color: colors.text }]}>₹{item.total}</Text>
                <Text style={{ color: colors.success, fontSize: 13, fontWeight: 'bold' }}>✓ RECEIVED</Text>
              </View>
              {item.note && <Text style={[styles.noteText, { color: colors.textMuted }]}>Note: {item.note}</Text>}
            </Card>
          )}
        />
      )}

      {activeTab === 'vendors' && (
        <FlatList
          data={laundryState.vendors}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <EmptyState
              title="No Laundry Vendors"
              description="Register your local laundry helpers."
              colors={colors}
            />
          }
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <Card colors={colors}>
              <View style={styles.entryHeader}>
                <View>
                  <Text style={[styles.vendorLabel, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>📞 {item.phone}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.active ? colors.success + '20' : colors.textMuted + '20' }]}>
                  <Text style={{ color: item.active ? colors.success : colors.textMuted, fontSize: 11, fontWeight: 'bold' }}>
                    {item.active ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {/* Floating Add Buttons */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          if (activeTab === 'sent') setEntryModalVisible(true);
          if (activeTab === 'vendors') setVendorModalVisible(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Entry Modal */}
      <Modal visible={entryModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Laundry Entry</Text>
            <ScrollView>
              <Input
                label="Date Sent (YYYY-MM-DD)"
                value={entryDateSent}
                onChangeText={setEntryDateSent}
                colors={colors}
              />
              <Text style={[styles.selectLabel, { color: colors.textMuted }]}>Select Vendor</Text>
              <View style={styles.vendorSelectorRow}>
                {laundryState.vendors.filter(v => v.active).map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.selectorChip,
                      { borderColor: colors.border },
                      entryVendorId === v.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setEntryVendorId(v.id)}
                  >
                    <Text style={{ color: entryVendorId === v.id ? '#ffffff' : colors.text }}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Item counters */}
              <Text style={[styles.selectLabel, { color: colors.textMuted, marginTop: 16 }]}>Cloth Counts & Rates</Text>
              
              {Object.keys(itemsCount).map(itemKey => {
                const key = itemKey as keyof typeof itemsCount;
                return (
                  <View key={key} style={[styles.counterRow, { borderBottomColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemLabel, { color: colors.text }]}>
                        {key.toUpperCase()} <Text style={{ fontSize: 12, color: colors.textMuted }}> (₹{rateMap[key]}/pc)</Text>
                      </Text>
                    </View>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={[styles.stepperBtn, { borderColor: colors.border }]}
                        onPress={() => adjustItemCount(key, -1)}
                      >
                        <Text style={{ color: colors.text, fontSize: 18 }}>-</Text>
                      </TouchableOpacity>
                      <Text style={[styles.stepperVal, { color: colors.text }]}>{itemsCount[key]}</Text>
                      <TouchableOpacity
                        style={[styles.stepperBtn, { borderColor: colors.border }]}
                        onPress={() => adjustItemCount(key, 1)}
                      >
                        <Text style={{ color: colors.text, fontSize: 18 }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total Calculated:</Text>
                <Text style={[styles.totalVal, { color: colors.primary }]}>₹{calculatedTotal}</Text>
              </View>

              <Input
                label="Notes / Special Instructions"
                value={entryNote}
                onChangeText={setEntryNote}
                colors={colors}
              />

              <View style={styles.modalButtons}>
                <Button title="Cancel" variant="outline" colors={colors} onPress={() => setEntryModalVisible(false)} style={styles.modalBtn} />
                <Button title="Save Logs" colors={colors} onPress={submitEntry} style={styles.modalBtn} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Vendor Modal */}
      <Modal visible={vendorModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Laundry Vendor</Text>
            <ScrollView>
              <Input label="Dhobi / Vendor Name" value={vName} onChangeText={setVName} colors={colors} />
              <Input label="Phone Number" value={vPhone} onChangeText={setVPhone} keyboardType="phone-pad" colors={colors} />

              <View style={styles.modalButtons}>
                <Button title="Cancel" variant="outline" colors={colors} onPress={() => setVendorModalVisible(false)} style={styles.modalBtn} />
                <Button title="Save Vendor" colors={colors} onPress={submitVendor} style={styles.modalBtn} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listPadding: {
    padding: 16,
    paddingBottom: 80,
  },
  entryCard: {
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  itemsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  noteText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    zIndex: 10,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 36,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  vendorSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  selectorChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    width: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  modalBtn: {
    flex: 0.48,
  },
});
export default LaundryLedgerScreen;
