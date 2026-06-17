import React, { useMemo, useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { useTracker } from '@context/TrackerContext';
import { useSettings } from '@context/SettingsContext';
import { useTheme } from '@hooks/useTheme';
import { TYPOGRAPHY } from '@theme/colors';
import { BabyLog, DiaperLog, FeedLog, SleepLog } from '../types/tracker';
import { DashboardHeader } from './DashboardHeader';
import { AddBabyModal } from '@modals/AddBabyModal';
import { NotesModal } from '@modals/NotesModal';
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

function colorForLog(log: BabyLog, colors: ReturnType<typeof useTheme>): string {
  switch (log.type) {
    case 'sleep': return colors.sleep;
    case 'feed': return colors.feed;
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

  return (
    <View style={styles.card}>
      <View style={[styles.cardStrip, { backgroundColor: colorForLog(log, COLORS) }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardLabel}>{labelForLog(log)}</Text>
        <Text style={styles.cardTime}>{formatTime(log.timestamp, timeFormat === '12h')}</Text>
        {duration.length > 0 && (
          <Text style={[styles.cardDuration, isInProgress && styles.cardDurationActive]}>
            {duration}
          </Text>
        )}
        {log.notes.length > 0 && <Text style={styles.cardNotes}>{log.notes}</Text>}
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
          paddingTop: 16,
          paddingBottom: 8,
          backgroundColor: COLORS.background,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        feedRow: {
          flexDirection: 'row',
          gap: 10,
          marginBottom: 12,
        },
        sectionLabel: {
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 8,
          fontSize: TYPOGRAPHY.size.xs,
          fontWeight: 'bold',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        list: { flex: 1, paddingHorizontal: 24 },
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
    stopSleep,
    removeLog,
    toggleBreastFeed,
    saveBreastFeed,
    logBottle,
    logSolids,
    logDiaper,
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

  // Fade between card grid and active sleep view using RN Animated
  const sleepOpacity = useRef(new Animated.Value(isSleeping ? 1 : 0)).current;
  const gridOpacity = useRef(new Animated.Value(isSleeping ? 0 : 1)).current;

  useEffect(() => {
    const config = { duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true };
    if (isSleeping) {
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
  }, [isSleeping, sleepOpacity, gridOpacity]);

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
      setSleepNotesVisible(true);
    } else {
      startSleep();
    }
  };

  const handleSaveNotes = async (notes: string): Promise<void> => {
    await stopSleep(notes);
    setSleepNotesVisible(false);
    maybeTriggerNudge('sleep');
  };

  const handleDiaperSave = async (
    status: DiaperLog['status'],
    timestamp: number,
  ): Promise<void> => {
    await logDiaper(status, undefined, timestamp);
    setDiaperModalVisible(false);
    maybeTriggerNudge('diaper');
  };

  const handleBottleSave = async (amountMl: number): Promise<void> => {
    await logBottle(amountMl);
    setFeedModalVisible(false);
    maybeTriggerNudge('feed');
  };

  const handleNursingSave = async (): Promise<void> => {
    await saveBreastFeed();
    setFeedModalVisible(false);
    maybeTriggerNudge('feed');
  };

  const handleSolidsSave = async (notes: string): Promise<void> => {
    await logSolids(notes);
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
        {/* Active sleep view — fades in when sleeping */}
        <Animated.View style={{ opacity: sleepOpacity, display: isSleeping ? 'flex' : 'none' }}>
          {active.sleepStart !== null && (
            <ActiveSleepView
              sleepStart={active.sleepStart}
              onStop={() => setSleepNotesVisible(true)}
            />
          )}
        </Animated.View>

        {/* Card grid — fades in when not sleeping */}
        <Animated.View style={{ opacity: gridOpacity, display: isSleeping ? 'none' : 'flex' }}>
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
            onPress={() => { void handleSolidsSave(''); }}
            onLongPress={() => setSolidsModalVisible(true)}
          />
          <DiaperCard lastLog={lastDiaperLog} onPress={() => setDiaperModalVisible(true)} />
        </Animated.View>
      </View>

      {/* Today's log list */}
      <Text style={styles.sectionLabel}>Today</Text>
      <ScrollView
        style={styles.list}
        contentContainerStyle={logs.length === 0 ? styles.listEmpty : styles.listContent}
      >
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No logs yet today.</Text>
        ) : (
          logs.map(log => <LogCard key={log.id} log={log} onDelete={removeLog} />)
        )}
      </ScrollView>

      {/* Modals */}
      <SettingsModal visible={settingsVisible} onDismiss={() => setSettingsVisible(false)} />
      <AddBabyModal visible={showAddBaby} onDismiss={() => setShowAddBaby(false)} />
      <NotesModal
        visible={sleepNotesVisible}
        title="End Sleep Session"
        onSave={handleSaveNotes}
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
        onSaveNursing={handleNursingSave}
        onSaveBottle={handleBottleSave}
        onDismiss={() => setFeedModalVisible(false)}
      />
      <SolidsModal
        visible={solidsModalVisible}
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
