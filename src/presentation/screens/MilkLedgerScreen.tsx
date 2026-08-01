import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { ThemeColors } from '../theme/theme';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { useAppSelector, useAppDispatch } from '../store';
import { addMilkEntry, addVendor, addRateChange, deleteMilkEntry } from '../store/milkSlice';
import { getSuggestedRate } from '../../application/RateCalculator';
import { MilkEntry, Vendor, RateChange } from '../../domain/types';

interface MilkLedgerScreenProps {
  colors: ThemeColors;
}

export const MilkLedgerScreen: React.FC<MilkLedgerScreenProps> = ({ colors }) => {
  const dispatch = useAppDispatch();
  const milkState = useAppSelector(state => state.milk);

  const [activeTab, setActiveTab] = useState<'deliveries' | 'vendors' | 'rates'>('deliveries');

  // Modals visibility
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [rateModalVisible, setRateModalVisible] = useState(false);

  // Add Entry Form state
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryVendorId, setEntryVendorId] = useState('');
  const [entryQty, setEntryQty] = useState('1.5');
  const [entryRate, setEntryRate] = useState('');
  const [entryPayMode, setEntryPayMode] = useState<'cash' | 'upi'>('upi');
  const [entryNote, setEntryNote] = useState('');

  // Add Vendor Form state
  const [vName, setVName] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vBaseRate, setVBaseRate] = useState('60');
  const [vSchedule, setVSchedule] = useState<'daily' | 'alternate' | 'custom'>('daily');

  // Add Rate Change Form state
  const [rcVendorId, setRcVendorId] = useState('');
  const [rcRate, setRcRate] = useState('62');
  const [rcEffective, setRcEffective] = useState(new Date().toISOString().split('T')[0]);

  // Handle vendor selection in delivery form to auto-fill suggest rate
  const handleVendorSelect = (vId: string, date: string) => {
    setEntryVendorId(vId);
    const vendor = milkState.vendors.find(v => v.id === vId);
    if (vendor) {
      const suggested = getSuggestedRate(vId, date, vendor.base_rate, milkState.rateChanges);
      setEntryRate(String(suggested));
    }
  };

  const handleDateChange = (date: string) => {
    setEntryDate(date);
    if (entryVendorId) {
      const vendor = milkState.vendors.find(v => v.id === entryVendorId);
      if (vendor) {
        const suggested = getSuggestedRate(entryVendorId, date, vendor.base_rate, milkState.rateChanges);
        setEntryRate(String(suggested));
      }
    }
  };

  // Submit handers
  const submitEntry = () => {
    if (!entryVendorId || !entryQty || !entryRate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const qty = parseFloat(entryQty);
    const rate = parseFloat(entryRate);

    const newEntry: MilkEntry = {
      id: 'me_' + Date.now(),
      date: entryDate,
      vendor_id: entryVendorId,
      quantity_ltr: qty,
      rate_per_ltr: rate,
      total: Math.round(qty * rate),
      payment_mode: entryPayMode,
      note: entryNote,
    };

    dispatch(addMilkEntry(newEntry));
    setEntryModalVisible(false);
    // Reset Form
    setEntryVendorId('');
    setEntryQty('1.5');
    setEntryRate('');
    setEntryNote('');
  };

  const submitVendor = () => {
    if (!vName || !vPhone || !vBaseRate) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Check duplicate vendor
    if (milkState.vendors.some(v => v.name.toLowerCase() === vName.toLowerCase())) {
      Alert.alert('Error', 'Vendor with this name already exists.');
      return;
    }

    const newVendor: Vendor = {
      id: 'v_milk_' + Date.now(),
      type: 'milk',
      name: vName,
      phone: vPhone,
      base_rate: parseFloat(vBaseRate),
      schedule: vSchedule,
      active: true,
    };

    dispatch(addVendor(newVendor));
    setVendorModalVisible(false);
    // Reset
    setVName('');
    setVPhone('');
    setVBaseRate('60');
  };

  const submitRateChange = () => {
    if (!rcVendorId || !rcRate || !rcEffective) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const newRateChange: RateChange = {
      id: 'rc_' + Date.now(),
      vendor_id: rcVendorId,
      effective_from: rcEffective,
      rate_per_ltr: parseFloat(rcRate),
    };

    dispatch(addRateChange(newRateChange));
    setRateModalVisible(false);
  };

  const getVendorName = (id: string) => {
    return milkState.vendors.find(v => v.id === id)?.name || 'Unknown Vendor';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sub Header Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'deliveries' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('deliveries')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'deliveries' ? colors.primary : colors.textMuted }]}>
            Deliveries
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
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rates' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('rates')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'rates' ? colors.primary : colors.textMuted }]}>
            Rate Adjust
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
      {activeTab === 'deliveries' && (
        <FlatList
          data={milkState.entries}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <EmptyState
              title="No Milk Logs Recorded"
              description="Keep track of daily milk counts, total amounts, and UPI/Cash payment methods."
              colors={colors}
              tip="Add a vendor first, then tap the floating (+) button to log today's milk delivery."
            />
          }
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <Card colors={colors} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View>
                  <Text style={[styles.vendorLabel, { color: colors.text }]}>{getVendorName(item.vendor_id)}</Text>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>{item.date}</Text>
                </View>
                <TouchableOpacity onPress={() => dispatch(deleteMilkEntry(item.id))}>
                  <Text style={{ color: colors.danger, fontSize: 13 }}>Delete</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.entryMeta, { borderTopColor: colors.border }]}>
                <Text style={[styles.metaText, { color: colors.text }]}>
                  Volume: <Text style={styles.bold}>{item.quantity_ltr} L</Text> @ ₹{item.rate_per_ltr}/L
                </Text>
                <Text style={[styles.metaAmount, { color: colors.primary }]}>₹{item.total}</Text>
              </View>
              {item.note && <Text style={[styles.noteText, { color: colors.textMuted }]}>Note: {item.note}</Text>}
            </Card>
          )}
        />
      )}

      {activeTab === 'vendors' && (
        <FlatList
          data={milkState.vendors}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <EmptyState
              title="No Vendors Added"
              description="Register your milk provider name, schedule, base rate, and phone."
              colors={colors}
            />
          }
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <Card colors={colors}>
              <View style={styles.entryHeader}>
                <View>
                  <Text style={[styles.vendorLabel, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>
                    📞 {item.phone} | {item.schedule.toUpperCase()} schedule
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.active ? colors.success + '20' : colors.textMuted + '20' }]}>
                  <Text style={{ color: item.active ? colors.success : colors.textMuted, fontSize: 11, fontWeight: 'bold' }}>
                    {item.active ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </View>
              </View>
              <View style={[styles.entryMeta, { borderTopColor: colors.border }]}>
                <Text style={{ color: colors.text }}>Base Rate: ₹{item.base_rate}/L</Text>
              </View>
            </Card>
          )}
        />
      )}

      {activeTab === 'rates' && (
        <FlatList
          data={milkState.rateChanges}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <EmptyState
              title="No Rate Adjustments"
              description="Log changes in vendor prices effective from a future or past date. Deliveries will auto-suggest rates based on these dates."
              colors={colors}
            />
          }
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <Card colors={colors}>
              <Text style={[styles.vendorLabel, { color: colors.text }]}>{getVendorName(item.vendor_id)}</Text>
              <Text style={[styles.dateLabel, { color: colors.textMuted }]}>
                Effective From: {item.effective_from}
              </Text>
              <Text style={[styles.metaAmount, { color: colors.primary, marginTop: 8 }]}>
                New Price: ₹{item.rate_per_ltr}/L
              </Text>
            </Card>
          )}
        />
      )}

      {/* Floating Add Buttons */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          if (activeTab === 'deliveries') setEntryModalVisible(true);
          if (activeTab === 'vendors') setVendorModalVisible(true);
          if (activeTab === 'rates') setRateModalVisible(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Delivery Entry Modal */}
      <Modal visible={entryModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Milk Entry</Text>
            <ScrollView>
              <Input
                label="Date (YYYY-MM-DD)"
                value={entryDate}
                onChangeText={handleDateChange}
                colors={colors}
              />
              <Text style={[styles.selectLabel, { color: colors.textMuted }]}>Select Vendor</Text>
              <View style={styles.vendorSelectorRow}>
                {milkState.vendors.filter(v => v.active).map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.selectorChip,
                      { borderColor: colors.border },
                      entryVendorId === v.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => handleVendorSelect(v.id, entryDate)}
                  >
                    <Text style={{ color: entryVendorId === v.id ? '#ffffff' : colors.text }}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Quantity (Litres)"
                value={entryQty}
                onChangeText={setEntryQty}
                keyboardType="numeric"
                colors={colors}
              />
              <Input
                label="Rate per Litre (₹)"
                value={entryRate}
                onChangeText={setEntryRate}
                keyboardType="numeric"
                colors={colors}
              />

              <Text style={[styles.selectLabel, { color: colors.textMuted }]}>Payment Mode</Text>
              <View style={styles.vendorSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.selectorChip,
                    { borderColor: colors.border },
                    entryPayMode === 'upi' && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEntryPayMode('upi')}
                >
                  <Text style={{ color: entryPayMode === 'upi' ? '#ffffff' : colors.text }}>UPI</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.selectorChip,
                    { borderColor: colors.border },
                    entryPayMode === 'cash' && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setEntryPayMode('cash')}
                >
                  <Text style={{ color: entryPayMode === 'cash' ? '#ffffff' : colors.text }}>Cash</Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Special Notes"
                value={entryNote}
                onChangeText={setEntryNote}
                colors={colors}
              />

              <View style={styles.modalButtons}>
                <Button title="Cancel" variant="outline" colors={colors} onPress={() => setEntryModalVisible(false)} style={styles.modalBtn} />
                <Button title="Save Entry" colors={colors} onPress={submitEntry} style={styles.modalBtn} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Vendor Modal */}
      <Modal visible={vendorModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Vendor</Text>
            <ScrollView>
              <Input label="Vendor Name" value={vName} onChangeText={setVName} colors={colors} />
              <Input label="Phone Number" value={vPhone} onChangeText={setVPhone} keyboardType="phone-pad" colors={colors} />
              <Input label="Base Rate per Litre (₹)" value={vBaseRate} onChangeText={setVBaseRate} keyboardType="numeric" colors={colors} />
              
              <Text style={[styles.selectLabel, { color: colors.textMuted }]}>Delivery Schedule</Text>
              <View style={styles.vendorSelectorRow}>
                {(['daily', 'alternate', 'custom'] as const).map(sch => (
                  <TouchableOpacity
                    key={sch}
                    style={[
                      styles.selectorChip,
                      { borderColor: colors.border },
                      vSchedule === sch && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setVSchedule(sch)}
                  >
                    <Text style={{ color: vSchedule === sch ? '#ffffff' : colors.text }}>{sch.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <Button title="Cancel" variant="outline" colors={colors} onPress={() => setVendorModalVisible(false)} style={styles.modalBtn} />
                <Button title="Save Vendor" colors={colors} onPress={submitVendor} style={styles.modalBtn} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Rate Change Modal */}
      <Modal visible={rateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Adjust Milk Rate</Text>
            <ScrollView>
              <Text style={[styles.selectLabel, { color: colors.textMuted }]}>Select Vendor</Text>
              <View style={styles.vendorSelectorRow}>
                {milkState.vendors.filter(v => v.active).map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.selectorChip,
                      { borderColor: colors.border },
                      rcVendorId === v.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setRcVendorId(v.id)}
                  >
                    <Text style={{ color: rcVendorId === v.id ? '#ffffff' : colors.text }}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input label="New Rate per Litre (₹)" value={rcRate} onChangeText={setRcRate} keyboardType="numeric" colors={colors} />
              <Input label="Effective From Date (YYYY-MM-DD)" value={rcEffective} onChangeText={setRcEffective} colors={colors} />

              <View style={styles.modalButtons}>
                <Button title="Cancel" variant="outline" colors={colors} onPress={() => setRateModalVisible(false)} style={styles.modalBtn} />
                <Button title="Save Rate Adjust" colors={colors} onPress={submitRateChange} style={styles.modalBtn} />
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
  },
  vendorLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaText: {
    fontSize: 14,
  },
  metaAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  bold: {
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
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
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
    marginTop: 12,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  modalBtn: {
    flex: 0.48,
  },
});
export default MilkLedgerScreen;
