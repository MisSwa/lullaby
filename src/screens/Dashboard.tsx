import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTracker } from '@context/TrackerContext';
import { useSettings } from '@context/SettingsContext';
import { useTheme } from '@hooks/useTheme';
import { TYPOGRAPHY } from '@theme/colors';
import { BabyLog, DiaperLog, FeedLog, SleepLog } from '../types/tracker';
import { DashboardHeader } from './DashboardHeader';
import { AddBabyModal } from '@modals/AddBabyModal';
import { SleepSummaryModal } from '@modals/SleepSummaryModal';
import { SettingsModal } from '@modals/SettingsModal';
import { DiaperModal } from '@modals/DiaperModal';
import { FeedModal } from '@modals/FeedModal';
import { SleepCard } from '../components/cards/SleepCard';
import { NursingCard } from '../components/cards/NursingCard';
import { BottleCard } from '../components/cards/BottleCard';
import { DiaperCard } from '../components/cards/DiaperCard';
import { SolidsCard } from '../components/cards/SolidsCard';
import { ActiveSleepView } from '../components/ActiveSleepView';
import { SolidsModal } from '@modals/SolidsModal';
import { NudgeSheet } from '../components/NudgeSheet';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(ts: number, hour12: boolean): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12 });
}

function timeRangeForLog(log: BabyLog, hour12: boolean): string {
  if (log.type === 'sleep') {
    const s = log as SleepLog;
    const start = formatTime(s.timestamp, hour12);
    if (s.endTime) return `${start} → ${formatTime(s.endTime, hour12)}`;
    return `${start} → ongoing`;
  }
  return formatTime(log.timestamp, hour12);
}

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatFeedElapsed(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function formatDateLabel(dateMs: number, todayStart: number, dayMs: number): string {
  if (dateMs >= todayStart) return 'Today';
  if (dateMs >= todayStart - dayMs) return 'Yesterday';
  return new Date(dateMs).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function colorForLog(log: BabyLog, colors: ReturnType<typeof useTheme>): string {
  switch (log.type) {
    case 'sleep': return colors.sleep;
    case 'feed': {
      const feedLog = log as FeedLog;
      if (feedLog.feedType === 'breast') return colors.nursing;
      if (feedLog.feedType === 'bottle') return colors.bottle;
      return colors.solids;
    }
    case 'diaper': return colors.diaper;
    default: {
      const _exhaustive: never = log;
      throw new Error(`Unhandled log type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

function labelForLog(log: BabyLog): string {
  switch (log.type) {
    case 'sleep': return 'SLEEP';
    case 'feed': {
      const f = log as FeedLog;
      if (f.feedType === 'breast') return 'FEED · Breast';
      if (f.feedType === 'bottle') return 'FEED · Bottle';
      return 'FEED · Solids';
    }
    case 'diaper': {
      const d = log as DiaperLog;
      return `DIAPER · ${d.status.charAt(0).toUpperCase()}${d.status.slice(1)}`;
    }
    default: {
      const _exhaustive: never = log;
      throw new Error(`Unhandled log type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

function durationForLog(log: BabyLog): string {
  if (log.type === 'sleep') {
    const s = log as SleepLog;
    if (!s.endTime) return 'In progress';
    return formatElapsed(Math.floor((s.endTime - s.timestamp) / 1000));
  }
  if (log.type === 'feed') {
    const f = log as FeedLog;
    if (f.feedType === 'breast') {
      const parts: string[] = [];
      if (f.leftDuration > 0) parts.push(`L ${formatFeedElapsed(f.leftDuration)}`);
      if (f.rightDuration > 0) parts.push(`R ${formatFeedElapsed(f.rightDuration)}`);
      return parts.join(' · ');
    }
    if (f.feedType === 'bottle') return `${f.amountMl}ml`;
    if (f.feedType === 'solids') {
      try {
        const parsed = JSON.parse(f.notes) as { items?: Array<{ food: string; amount: string }> };
        if (parsed.items && Array.isArray(parsed.items)) {
          return parsed.items
            .filter(i => i.food.trim())
            .map(i => (i.amount.trim() ? `${i.food.trim()} (${i.amount.trim()})` : i.food.trim()))
            .join(', ');
        }
        return ''; // JSON parsed but no items array
      } catch {
        // old plain-text format: first line is food name
        return f.notes.split('\n')[0].trim();
      }
    }
    return '';
  }
  return '';
}

// ─── LogCard ────────────────────────────────────────────────────────────────

interface LogCardProps {
  log: BabyLog;
  onDelete: (id: string) => void;
}

const LogCard: React.FC<LogCardProps> = ({ log, onDelete }) => {
  const COLORS = useTheme();
  const { timeFormat } = useSettings();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          backgroundColor: COLORS.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          marginBottom: 10,
          overflow: 'hidden',
          minHeight: 64,
        },
        cardStrip: { width: 6 },
        cardBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
        cardLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
        },
        cardTime: { fontSize: TYPOGRAPHY.size.xs, color: COLORS.textMuted, marginTop: 2 },
        cardDuration: { fontSize: TYPOGRAPHY.size.xs, color: COLORS.textMuted, marginTop: 2 },
        cardDurationActive: { color: COLORS.active },
        cardNotes: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textPrimary,
          fontStyle: 'italic',
          marginTop: 6,
        },
        deleteZone: {
          width: 50,
          justifyContent: 'center',
          alignItems: 'center',
          borderLeftWidth: 1,
          borderLeftColor: COLORS.border,
        },
        deleteIcon: { fontSize: TYPOGRAPHY.size.base, color: COLORS.textMuted },
      }),
    [COLORS],
  );

  const duration = durationForLog(log);
  const isInProgress = log.type === 'sleep' && !(log as SleepLog).endTime;

  // For solids: food + amounts are shown via durationForLog. Only show session notes here.
  const notesDisplay = useMemo((): string => {
    if (log.type === 'feed' && (log as FeedLog).feedType === 'solids') {
      try {
        const parsed = JSON.parse(log.notes) as { notes?: string };
        return parsed.notes?.trim() ?? '';
      } catch {
        // old plain-text format: skip first line (food name)
        return log.notes.split('\n').slice(1).join('\n').trim();
      }
    }
    return log.notes;
  }, [log]);

  return (
    <View style={styles.card}>
      <View style={[styles.cardStrip, { backgroundColor: colorForLog(log, COLORS) }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardLabel}>{labelForLog(log)}</Text>
        <Text style={styles.cardTime}>{timeRangeForLog(log, timeFormat === '12h')}</Text>
        {duration.length > 0 && (
          <Text style={[styles.cardDuration, isInProgress && styles.cardDurationActive]}>
            {duration}
          </Text>
        )}
        {notesDisplay.length > 0 && <Text style={styles.cardNotes}>{notesDisplay}</Text>}
      </View>
      <TouchableOpacity style={styles.deleteZone} onPress={() => onDelete(log.id)}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Dashboard ──────────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const COLORS = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: COLORS.background },
        cardZone: {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
          backgroundColor: COLORS.background,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        feedRow: {
          flexDirection: 'row',
          gap: 10,
          marginBottom: 8,
        },
        dateNavRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          backgroundColor: COLORS.surface,
        },
        dateNavBtn: {
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 8,
        },
        dateNavLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        list: { flex: 1, paddingHorizontal: 16 },
        listContent: { paddingBottom: 32 },
        listEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        emptyText: { fontSize: TYPOGRAPHY.size.base, color: COLORS.textMuted },
      }),
    [COLORS],
  );

  const {
    logs,
    active,
    startSleep,
    cancelSleep,
    stopSleep,
    removeLog,
    toggleBreastFeed,
    adjustFeedStart,
    saveBreastFeed,
    logBreastFeedManual,
    logBottle,
    logSolids,
    logDiaper,
    solidsFoodHistory,
    historyLogs,
    loadHistoryDate,
    clearHistory,
    updateSleepStart,
  } = useTracker();

  const { hasSeenNudge, markNudgeSeen } = useSettings();

  const [showAddBaby, setShowAddBaby] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [sleepNotesVisible, setSleepNotesVisible] = useState(false);
  const [diaperModalVisible, setDiaperModalVisible] = useState(false);
  const [feedModalVisible, setFeedModalVisible] = useState(false);
  const [feedModalTab, setFeedModalTab] = useState<'nursing' | 'bottle'>('nursing');
  const [solidsModalVisible, setSolidsModalVisible] = useState(false);
  const [nudgeType, setNudgeType] = useState<'sleep' | 'feed' | 'diaper' | 'solids' | null>(null);

  const isSleeping = active.sleepStart !== null;
  const [sleepExpanded, setSleepExpanded] = useState(false);

  // ─── History date navigation ─────────────────────────────────────────────────
  const DAY_MS = 24 * 60 * 60 * 1000;
  const todayStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }, []);

  const [selectedDate, setSelectedDate] = useState<number>(todayStart);
  const isViewingToday = selectedDate >= todayStart;

  useEffect(() => {
    if (isViewingToday) {
      clearHistory();
    } else {
      void loadHistoryDate(selectedDate);
    }
  }, [selectedDate, isViewingToday, loadHistoryDate, clearHistory]);

  const displayedLogs = isViewingToday ? logs : historyLogs;

  const goBack = useCallback((): void => {
    setSelectedDate(prev => prev - DAY_MS);
  }, [DAY_MS]);

  const goForward = useCallback((): void => {
    setSelectedDate(prev => Math.min(prev + DAY_MS, todayStart));
  }, [DAY_MS, todayStart]);

  // Auto-expand when a sleep session starts; reset when it ends
  useEffect(() => {
    if (isSleeping) setSleepExpanded(true);
    else setSleepExpanded(false);
  }, [isSleeping]);

  const showSleepView = isSleeping && sleepExpanded;

  // Fade between card grid and active sleep view using RN Animated
  const sleepOpacity = useRef(new Animated.Value(showSleepView ? 1 : 0)).current;
  const gridOpacity = useRef(new Animated.Value(showSleepView ? 0 : 1)).current;

  useEffect(() => {
    const config = { duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true };
    if (showSleepView) {
      Animated.parallel([
        Animated.timing(gridOpacity, { ...config, toValue: 0 }),
        Animated.timing(sleepOpacity, { ...config, toValue: 1 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sleepOpacity, { ...config, toValue: 0 }),
        Animated.timing(gridOpacity, { ...config, toValue: 1 }),
      ]).start();
    }
  }, [showSleepView, sleepOpacity, gridOpacity]);

  // Derive the most recent log of each type from today's log list
  const lastSleepLog = (logs.find(l => l.type === 'sleep') ?? null) as SleepLog | null;
  const lastBreastLog = (logs.find(
    l => l.type === 'feed' && (l as FeedLog).feedType === 'breast',
  ) ?? null) as FeedLog | null;
  const lastBottleLog = (logs.find(
    l => l.type === 'feed' && (l as FeedLog).feedType === 'bottle',
  ) ?? null) as FeedLog | null;
  const lastDiaperLog = (logs.find(l => l.type === 'diaper') ?? null) as DiaperLog | null;
  const lastSolidsLog = (logs.find(
    l => l.type === 'feed' && (l as FeedLog).feedType === 'solids',
  ) ?? null) as FeedLog | null;

  const maybeTriggerNudge = (type: 'sleep' | 'feed' | 'diaper' | 'solids'): void => {
    if (!hasSeenNudge[type]) setNudgeType(type);
  };

  const handleSleepPress = (): void => {
    if (isSleeping) {
      if (sleepExpanded) {
        setSleepNotesVisible(true);
      } else {
        setSleepExpanded(true);
      }
    } else {
      startSleep();
    }
  };

  const handleSaveSleep = async (notes: string, endTime: number): Promise<void> => {
    await stopSleep(notes, endTime);
    setSleepNotesVisible(false);
    maybeTriggerNudge('sleep');
  };

  const handleDiaperSave = async (
    status: DiaperLog['status'],
    timestamp: number,
    notes: string,
  ): Promise<void> => {
    await logDiaper(status, notes, timestamp);
    setDiaperModalVisible(false);
    maybeTriggerNudge('diaper');
  };

  const handleBottleSave = async (amountMl: number, timestamp: number): Promise<void> => {
    await logBottle(amountMl, undefined, timestamp);
    setFeedModalVisible(false);
    maybeTriggerNudge('feed');
  };

  const handleNursingSave = async (timestamp: number): Promise<void> => {
    await saveBreastFeed(undefined, timestamp);
    setFeedModalVisible(false);
    maybeTriggerNudge('feed');
  };

  const handleNursingSaveManual = async (
    leftSecs: number,
    rightSecs: number,
    timestamp: number,
  ): Promise<void> => {
    await logBreastFeedManual(leftSecs, rightSecs, timestamp);
    setFeedModalVisible(false);
    maybeTriggerNudge('feed');
  };

  const handleSolidsSave = async (notes: string, timestamp: number): Promise<void> => {
    await logSolids(notes, timestamp);
    setSolidsModalVisible(false);
    maybeTriggerNudge('solids');
  };

  const openNursingModal = (): void => {
    setFeedModalTab('nursing');
    setFeedModalVisible(true);
  };

  const openBottleModal = (): void => {
    setFeedModalTab('bottle');
    setFeedModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.root}>
      <DashboardHeader
        onAddBaby={() => setShowAddBaby(true)}
        onSettingsPress={() => setSettingsVisible(true)}
      />

      {/* Tracking cards / active sleep */}
      <View style={styles.cardZone}>
        {/* Active sleep view — fades in when sleeping and expanded */}
        <Animated.View style={{ opacity: sleepOpacity, display: showSleepView ? 'flex' : 'none' }}>
          {active.sleepStart !== null && (
            <ActiveSleepView
              sleepStart={active.sleepStart}
              onStop={() => setSleepNotesVisible(true)}
              onDiscard={cancelSleep}
              onMinimize={() => setSleepExpanded(false)}
            />
          )}
        </Animated.View>

        {/* Card grid — visible when not sleeping or when sleep is minimized */}
        <Animated.View style={{ opacity: gridOpacity, display: showSleepView ? 'none' : 'flex' }}>
          <SleepCard
            lastLog={lastSleepLog}
            sleepStart={active.sleepStart}
            onPress={handleSleepPress}
          />
          <View style={styles.feedRow}>
            <NursingCard
              lastLog={lastBreastLog}
              feedLeftStart={active.feedLeftStart}
              feedRightStart={active.feedRightStart}
              feedLeftElapsed={active.feedLeftElapsed}
              feedRightElapsed={active.feedRightElapsed}
              onPress={openNursingModal}
            />
            <BottleCard lastLog={lastBottleLog} onPress={openBottleModal} />
          </View>
          <SolidsCard
            lastLog={lastSolidsLog}
            onPress={() => setSolidsModalVisible(true)}
            onLongPress={() => setSolidsModalVisible(true)}
          />
          <DiaperCard lastLog={lastDiaperLog} onPress={() => setDiaperModalVisible(true)} />
        </Animated.View>
      </View>

      {/* Date navigation header */}
      <View style={styles.dateNavRow}>
        <TouchableOpacity style={styles.dateNavBtn} onPress={goBack}>
          <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Text style={styles.dateNavLabel}>{formatDateLabel(selectedDate, todayStart, DAY_MS)}</Text>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={goForward}
          disabled={isViewingToday}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isViewingToday ? COLORS.border : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Log list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={displayedLogs.length === 0 ? styles.listEmpty : styles.listContent}
      >
        {displayedLogs.length === 0 ? (
          <Text style={styles.emptyText}>No logs for this day.</Text>
        ) : (
          displayedLogs.map(log => (
            <LogCard
              key={log.id}
              log={log}
              onDelete={isViewingToday ? removeLog : () => undefined}
            />
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <SettingsModal visible={settingsVisible} onDismiss={() => setSettingsVisible(false)} />
      <AddBabyModal visible={showAddBaby} onDismiss={() => setShowAddBaby(false)} />
      <SleepSummaryModal
        visible={sleepNotesVisible}
        sleepStart={active.sleepStart ?? Date.now()}
        onUpdateStart={updateSleepStart}
        onSave={handleSaveSleep}
        onDismiss={() => setSleepNotesVisible(false)}
      />
      <DiaperModal
        visible={diaperModalVisible}
        onSave={handleDiaperSave}
        onDismiss={() => setDiaperModalVisible(false)}
      />
      <FeedModal
        visible={feedModalVisible}
        initialTab={feedModalTab}
        feedLeftStart={active.feedLeftStart}
        feedRightStart={active.feedRightStart}
        feedLeftElapsed={active.feedLeftElapsed}
        feedRightElapsed={active.feedRightElapsed}
        onToggleSide={toggleBreastFeed}
        onAdjustFeedStart={adjustFeedStart}
        onSaveNursing={handleNursingSave}
        onSaveNursingManual={handleNursingSaveManual}
        onSaveBottle={handleBottleSave}
        onDismiss={() => setFeedModalVisible(false)}
      />
      <SolidsModal
        visible={solidsModalVisible}
        suggestions={solidsFoodHistory}
        onSave={handleSolidsSave}
        onDismiss={() => setSolidsModalVisible(false)}
      />
      <NudgeSheet
        visible={nudgeType !== null}
        logType={nudgeType ?? 'feed'}
        onSkip={async () => {
          if (nudgeType !== null) await markNudgeSeen(nudgeType);
          setNudgeType(null);
        }}
        onSetupReminders={async () => {
          if (nudgeType !== null) await markNudgeSeen(nudgeType);
          setNudgeType(null);
          setSettingsVisible(true);
        }}
      />
    </SafeAreaView>
  );
};
