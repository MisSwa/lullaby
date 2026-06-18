import React, { useMemo, useState, useCallback } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useSettings } from '@context/SettingsContext';
import { TYPOGRAPHY } from '@theme/colors';

const COMMON_FOODS = [
  'Avocado', 'Banana', 'Carrot', 'Sweet potato', 'Pear',
  'Peas', 'Broccoli', 'Mango', 'Oatmeal', 'Rice cereal',
  'Squash', 'Yogurt', 'Apple', 'Potato', 'Lentils',
];

const MAX_RETROACTIVE_MS = 12 * 60 * 60 * 1000;
const STAR_COLOR = '#F59E0B';
const MAX_ITEMS = 6;

interface SolidsItem {
  food: string;
  amount: string;
}

interface SuggestionItem {
  name: string;
  isFavorite: boolean;
}

interface SolidsModalProps {
  visible: boolean;
  suggestions: string[];          // all-time history from TrackerContext
  onSave: (notes: string, timestamp: number) => Promise<void>;
  onDismiss: () => void;
}

export const SolidsModal: React.FC<SolidsModalProps> = ({
  visible,
  suggestions,
  onSave,
  onDismiss,
}) => {
  const COLORS = useTheme();
  const { timeFormat, solidsFavorites, toggleSolidsFavorite } = useSettings();

  const [items, setItems] = useState<SolidsItem[]>([{ food: '', amount: '' }]);
  const [focusedItemIdx, setFocusedItemIdx] = useState(0);
  const [extraNotes, setExtraNotes] = useState('');
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [showPicker, setShowPicker] = useState(false);
  const [timeError, setTimeError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleShow = (): void => {
    setItems([{ food: '', amount: '' }]);
    setFocusedItemIdx(0);
    setExtraNotes('');
    setTimestamp(Date.now());
    setShowPicker(false);
    setTimeError('');
    setSaving(false);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selected?: Date): void => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (!selected) return;
    const now = Date.now();
    const ms = selected.getTime();
    if (ms > now) {
      setTimeError('Time cannot be in the future.');
      return;
    }
    if (now - ms > MAX_RETROACTIVE_MS) {
      setTimeError('Time cannot be more than 12 hours in the past.');
      return;
    }
    setTimeError('');
    setTimestamp(ms);
  };

  const updateItemFood = useCallback((idx: number, value: string): void => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, food: value } : item));
  }, []);

  const updateItemAmount = useCallback((idx: number, value: string): void => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, amount: value } : item));
  }, []);

  const addItem = useCallback((): void => {
    setItems(prev => {
      if (prev.length >= MAX_ITEMS) return prev;
      const next = [...prev, { food: '', amount: '' }];
      setFocusedItemIdx(next.length - 1);
      return next;
    });
  }, []);

  const removeItem = useCallback((idx: number): void => {
    setItems(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      setFocusedItemIdx(Math.min(idx, next.length - 1));
      return next;
    });
  }, []);

  const handleSave = async (): Promise<void> => {
    if (saving) return;
    const validItems = items.filter(i => i.food.trim());
    if (validItems.length === 0) return;
    setSaving(true);
    const payload = JSON.stringify({
      items: validItems.map(i => ({ food: i.food.trim(), amount: i.amount.trim() })),
      notes: extraNotes.trim(),
    });
    try {
      await onSave(payload, timestamp);
      setSaving(false);
    } catch (error) {
      console.error('Failed to save solids log:', error);
      setSaving(false);
    }
  };

  const handleDismiss = (): void => {
    setItems([{ food: '', amount: '' }]);
    setExtraNotes('');
    onDismiss();
  };

  // Whether any item has a non-empty food name (enables Save)
  const canSave = useMemo(() => items.some(i => i.food.trim().length > 0), [items]);

  // Build suggestion list: favorites first, then history, then common foods — no duplicates
  const allSuggestions = useMemo((): SuggestionItem[] => {
    const seen = new Set<string>();
    const result: SuggestionItem[] = [];

    for (const fav of solidsFavorites) {
      const key = fav.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push({ name: fav.trim(), isFavorite: true });
      }
    }

    for (const s of suggestions) {
      const key = s.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push({ name: s.trim(), isFavorite: false });
      }
    }

    for (const s of COMMON_FOODS) {
      const key = s.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ name: s, isFavorite: false });
      }
    }

    return result.slice(0, 20);
  }, [suggestions, solidsFavorites]);

  const handleChipPress = useCallback((name: string): void => {
    const current = items[focusedItemIdx]?.food.trim().toLowerCase();
    const tapped = name.toLowerCase();
    updateItemFood(focusedItemIdx, current === tapped ? '' : name);
  }, [items, focusedItemIdx, updateItemFood]);

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: COLORS.background },
        flex: { flex: 1 },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingVertical: 18,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          backgroundColor: COLORS.surface,
        },
        headerTitle: {
          fontSize: TYPOGRAPHY.size.lg,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
        },
        closeButton: {
          width: 44,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
        },
        closeText: {
          fontSize: TYPOGRAPHY.size.lg,
          color: COLORS.textMuted,
        },
        body: { flex: 1 },
        bodyContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
        timeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          marginBottom: 24,
        },
        timeLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textMuted,
        },
        timeValue: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: '600',
          color: COLORS.primary,
        },
        errorText: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.error,
          marginTop: -16,
          marginBottom: 16,
        },
        pickerWrapper: { marginBottom: 16 },
        sectionLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 10,
        },
        sectionLabelSpaced: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginTop: 20,
          marginBottom: 10,
        },
        // Per-item card
        itemCard: {
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          padding: 12,
          marginBottom: 10,
          backgroundColor: COLORS.surface,
        },
        itemHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        itemNumber: {
          fontSize: TYPOGRAPHY.size.xs,
          fontWeight: '700',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        },
        removeBtn: {
          width: 28,
          height: 28,
          justifyContent: 'center',
          alignItems: 'center',
        },
        foodRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        },
        foodInput: {
          flex: 1,
          height: 46,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textPrimary,
          backgroundColor: COLORS.background,
        },
        starBtn: {
          width: 44,
          height: 46,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.background,
        },
        amountInput: {
          height: 40,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textPrimary,
          backgroundColor: COLORS.background,
        },
        amountLabel: {
          fontSize: TYPOGRAPHY.size.xs,
          color: COLORS.textMuted,
          marginBottom: 4,
        },
        addItemBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 44,
          borderWidth: 1.5,
          borderColor: COLORS.solids,
          borderRadius: 12,
          borderStyle: 'dashed',
          marginBottom: 20,
        },
        addItemText: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.solids,
        },
        chipScroll: { marginBottom: 24 },
        chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: COLORS.solids,
          backgroundColor: COLORS.surface,
          gap: 4,
        },
        chipFavorite: {
          borderColor: STAR_COLOR,
        },
        chipSelected: {
          backgroundColor: COLORS.solids,
          borderColor: COLORS.solids,
        },
        chipFavoriteSelected: {
          backgroundColor: STAR_COLOR,
          borderColor: STAR_COLOR,
        },
        chipText: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.solids,
          fontWeight: '500',
        },
        chipFavoriteText: {
          color: STAR_COLOR,
        },
        chipTextSelected: {
          color: COLORS.surface,
        },
        notesInput: {
          height: 80,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingTop: 14,
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textPrimary,
          backgroundColor: COLORS.surface,
          textAlignVertical: 'top',
        },
        saveButton: {
          height: 52,
          borderRadius: 12,
          backgroundColor: COLORS.solids,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 28,
          marginBottom: 12,
        },
        saveButtonDisabled: { opacity: 0.45 },
        saveButtonText: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: 'bold',
          color: COLORS.surface,
        },
        cancelButton: {
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
        },
        cancelButtonText: {
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textMuted,
        },
      }),
    [COLORS],
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onShow={handleShow}
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Log Solids</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss} disabled={saving}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Retroactive time */}
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => setShowPicker(prev => !prev)}
              disabled={saving}
            >
              <Text style={styles.timeLabel}>When</Text>
              <Text style={styles.timeValue}>Today, {formattedTime} ›</Text>
            </TouchableOpacity>

            {timeError.length > 0 && <Text style={styles.errorText}>{timeError}</Text>}

            {showPicker && (
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={new Date(timestamp)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  minimumDate={new Date(Date.now() - MAX_RETROACTIVE_MS)}
                  onChange={handleTimeChange}
                />
              </View>
            )}

            {/* Food items */}
            <Text style={styles.sectionLabel}>What did they eat?</Text>

            {items.map((item, idx) => {
              const isFav = item.food.trim().length > 0 &&
                solidsFavorites.some(f => f.toLowerCase() === item.food.trim().toLowerCase());
              return (
                <View key={idx} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemNumber}>Item {idx + 1}</Text>
                    {items.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removeItem(idx)}
                        disabled={saving}
                      >
                        <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Food input + star */}
                  <View style={styles.foodRow}>
                    <TextInput
                      style={styles.foodInput}
                      value={item.food}
                      onChangeText={val => updateItemFood(idx, val)}
                      onFocus={() => setFocusedItemIdx(idx)}
                      placeholder="e.g. Mashed banana"
                      placeholderTextColor={COLORS.textMuted}
                      returnKeyType="next"
                      editable={!saving}
                    />
                    <TouchableOpacity
                      style={styles.starBtn}
                      onPress={() => {
                        if (item.food.trim()) void toggleSolidsFavorite(item.food.trim());
                      }}
                      disabled={!item.food.trim() || saving}
                    >
                      <Ionicons
                        name={isFav ? 'star' : 'star-outline'}
                        size={22}
                        color={isFav ? STAR_COLOR : COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Amount */}
                  <Text style={styles.amountLabel}>Amount (optional)</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={item.amount}
                    onChangeText={val => updateItemAmount(idx, val)}
                    placeholder="e.g. 3 tablespoons, half a jar"
                    placeholderTextColor={COLORS.textMuted}
                    returnKeyType="next"
                    editable={!saving}
                  />
                </View>
              );
            })}

            {/* Add food button */}
            {items.length < MAX_ITEMS && (
              <TouchableOpacity style={styles.addItemBtn} onPress={addItem} disabled={saving}>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.solids} />
                <Text style={styles.addItemText}>Add another food</Text>
              </TouchableOpacity>
            )}

            {/* Suggestion chips — fill the focused item's food field */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipRow}
              keyboardShouldPersistTaps="handled"
            >
              {allSuggestions.map(item => {
                const currentFood = items[focusedItemIdx]?.food.trim().toLowerCase();
                const isSelected = currentFood === item.name.toLowerCase();
                return (
                  <TouchableOpacity
                    key={item.name}
                    style={[
                      styles.chip,
                      item.isFavorite && styles.chipFavorite,
                      isSelected && (item.isFavorite ? styles.chipFavoriteSelected : styles.chipSelected),
                    ]}
                    onPress={() => handleChipPress(item.name)}
                    disabled={saving}
                  >
                    {item.isFavorite && (
                      <Ionicons
                        name="star"
                        size={11}
                        color={isSelected ? COLORS.surface : STAR_COLOR}
                      />
                    )}
                    <Text
                      style={[
                        styles.chipText,
                        item.isFavorite && styles.chipFavoriteText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Session notes */}
            <Text style={styles.sectionLabelSpaced}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={extraNotes}
              onChangeText={setExtraNotes}
              placeholder="Loved it? First time? Any reactions?"
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={200}
              editable={!saving}
            />

            <TouchableOpacity
              style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!canSave || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.surface} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleDismiss}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};
