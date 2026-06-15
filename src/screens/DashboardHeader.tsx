import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, FlatList, StyleSheet } from 'react-native';
import { useTracker } from '@context/TrackerContext';
import { Baby } from '../types/baby';
import { COLORS, TYPOGRAPHY } from '@theme/colors';

interface DashboardHeaderProps {
  onAddBaby: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onAddBaby }) => {
  const { babies, activeBabyId, setActiveBabyId } = useTracker();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const activeBaby = babies.find(b => b.id === activeBabyId);
  const activeName = activeBaby?.name ?? '—';

  const handleSelectBaby = (baby: Baby) => {
    setActiveBabyId(baby.id);
    setDropdownVisible(false);
  };

  const handleAddBaby = () => {
    setDropdownVisible(false);
    onAddBaby();
  };

  return (
    <View style={styles.header}>
      <Text style={styles.appName}>Lullaby</Text>

      <TouchableOpacity
        style={styles.switcher}
        onPress={() => setDropdownVisible(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.switcherText}>{activeName} ▾</Text>
      </TouchableOpacity>

      <Modal
        transparent
        visible={dropdownVisible}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setDropdownVisible(false)}>
          <View style={styles.dropdownCard}>
            <FlatList
              data={babies}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.dropdownRow} onPress={() => handleSelectBaby(item)}>
                  <Text style={styles.dropdownRowText}>{item.name}</Text>
                  {item.id === activeBabyId && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              ListFooterComponent={
                <TouchableOpacity style={styles.dropdownRow} onPress={handleAddBaby}>
                  <Text style={[styles.dropdownRowText, styles.addBabyText]}>+ Add Baby</Text>
                </TouchableOpacity>
              }
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  appName: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  switcher: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  switcherText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 72,
    paddingRight: 16,
  },
  dropdownCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 180,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 44,
  },
  dropdownRowText: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textPrimary,
  },
  checkmark: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  addBabyText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
