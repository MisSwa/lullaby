import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTracker } from '@context/TrackerContext';
import { useLiveTick } from '@hooks/useLiveTick';
import { useTheme } from '@hooks/useTheme';
import { BabyLog, DiaperLog, FeedLog, SleepLog } from '../types/tracker';
import { ColorPalette, TYPOGRAPHY } from '@theme/colors';
import { DashboardHeader } from './DashboardHeader';
import { AddBabyModal } from '@modals/AddBabyModal';
import { BottleLogModal } from '@modals/BottleLogModal';
import { NotesModal } from '@modals/NotesModal';
import { SettingsModal } from '@modals/SettingsModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatFeedElapsed(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function formatAmount(ml: number): string {
  return ml % 1 === 0 ? `${Math.round(ml)}ml` : `${ml.toFixed(1)}ml`;
}

function colorForLog(log: BabyLog, colors: ColorPalette): string {
  switch (log.type) {
    case 'sleep':
      return colors.sleep;
    case 'feed':
      return colors.feed;
    case 'diaper':
      return colors.diaper;
    default: {
      const _exhaustive: never = log;
      throw new Error(`Unhandled log type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

function labelForLog(log: BabyLog): string {
  switch (log.type) {
    case 'sleep':
      return 'SLEEP';
    case 'feed': {
      const feedLog = log as FeedLog;
      if (feedLog.feedType === 'breast') return 'FEED · Breast';
      if (feedLog.feedType === 'bottle') return 'FEED · Bottle';
      return 'FEED · Solids';
    }
    case 'diaper': {
      const diaperLog = log as DiaperLog;
      const status = diaperLog.status;
      return `DIAPER · ${status.charAt(0).toUpperCase()}${status.slice(1)}`;
    }
    default: {
      const _exhaustive: never = log;
      throw new Error(`Unhandled log type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

function durationForLog(log: BabyLog): string {
  if (log.type === 'sleep') {
    const sleepLog = log as SleepLog;
    if (!sleepLog.endTime) return 'In progress';
    const secs = Math.floor((sleepLog.endTime - sleepLog.timestamp) / 1000);
    return formatElapsed(secs);
  }
  if (log.type === 'feed') {
    const feedLog = log as FeedLog;
    if (feedLog.feedType === 'breast') {
      const parts: string[] = [];
      if (feedLog.leftDuration > 0) parts.push(`L ${formatFeedElapsed(feedLog.leftDuration)}`);
      if (feedLog.rightDuration > 0) parts.push(`R ${formatFeedElapsed(feedLog.rightDuration)}`);
      return parts.join(' · ');
    }
    if (feedLog.feedType === 'bottle') {
      return formatAmount(feedLog.amountMl);
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
        cardStrip: {
          width: 6,
        },
        cardBody: {
          flex: 1,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        cardLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
        },
        cardTime: {
          fontSize: TYPOGRAPHY.size.xs,
          color: COLORS.textMuted,
          marginTop: 2,
        },
        cardDuration: {
          fontSize: TYPOGRAPHY.size.xs,
          color: COLORS.textMuted,
          marginTop: 2,
        },
        cardDurationActive: {
          color: COLORS.active,
        },
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
        deleteIcon: {
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textMuted,
        },
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
        <Text style={styles.cardTime}>{formatTime(log.timestamp)}</Text>
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
        root: {
          flex: 1,
          backgroundColor: COLORS.background,
        },
        actionZone: {
          paddingHorizontal: 24,
          paddingVertical: 20,
          backgroundColor: COLORS.surface,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        sleepButton: {
          height: 90,
          borderRadius: 16,
          backgroundColor: COLORS.sleep,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 2,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        sleepButtonActive: {
          backgroundColor: COLORS.active,
        },
        sleepButtonLabel: {
          fontSize: TYPOGRAPHY.size.lg,
          fontWeight: 'bold',
          color: COLORS.surface,
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
        list: {
          flex: 1,
          paddingHorizontal: 24,
        },
        listContent: {
          paddingBottom: 32,
        },
        listEmpty: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        emptyText: {
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textMuted,
        },
        feedRow: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 12,
        },
        feedButton: {
          flex: 1,
          height: 90,
          borderRadius: 12,
          backgroundColor: COLORS.feed,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 2,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        feedButtonActive: {
          backgroundColor: COLORS.active,
        },
        feedButtonSide: {
          fontSize: TYPOGRAPHY.size.lg,
          fontWeight: 'bold',
          color: COLORS.surface,
        },
        feedButtonElapsed: {
          fontSize: TYPOGRAPHY.size.xs,
          color: COLORS.surface,
          marginTop: 2,
        },
        feedSaveButton: {
          width: 70,
          height: 90,
          borderRadius: 12,
          backgroundColor: COLORS.primary,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 2,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        feedSaveButtonText: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: 'bold',
          color: COLORS.surface,
        },
        quickFeedRow: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 10,
        },
        quickFeedButton: {
          flex: 1,
          height: 54,
          borderRadius: 12,
          backgroundColor: COLORS.feed,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 2,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          opacity: 0.85,
        },
        quickFeedButtonLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.surface,
        },
        diaperRow: {
          flexDirection: 'row',
          gap: 8,
          marginTop: 10,
        },
        diaperButton: {
          flex: 1,
          height: 48,
          borderRadius: 12,
          backgroundColor: COLORS.diaper,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 2,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        diaperButtonLabel: {
          fontSize: TYPOGRAPHY.size.xs,
          fontWeight: '600',
          color: COLORS.surface,
        },
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
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [feedNotesVisible, setFeedNotesVisible] = useState(false);
  const [bottleModalVisible, setBottleModalVisible] = useState(false);
  const [pendingBottleNotes, setPendingBottleNotes] = useState('');
  const [bottleNotesVisible, setBottleNotesVisible] = useState(false);
  const [solidsNotesVisible, setSolidsNotesVisible] = useState(false);
  const [diaperNotesVisible, setDiaperNotesVisible] = useState(false);
  const [pendingDiaperStatus, setPendingDiaperStatus] = useState<DiaperLog['status'] | null>(null);

  const sleepElapsed = useLiveTick(active.sleepStart);
  const leftTick = useLiveTick(active.feedLeftStart);
  const rightTick = useLiveTick(active.feedRightStart);

  const isSleeping = active.sleepStart !== null;
  const totalLeftSecs = active.feedLeftElapsed + leftTick;
  const totalRightSecs = active.feedRightElapsed + rightTick;
  const isFeedRunning = active.feedLeftStart !== null || active.feedRightStart !== null;
  const showFeedSave = (totalLeftSecs > 0 || totalRightSecs > 0) && !isFeedRunning;

  const feedModalElapsed = (() => {
    const parts: string[] = [];
    if (active.feedLeftElapsed > 0) parts.push(`L ${formatFeedElapsed(active.feedLeftElapsed)}`);
    if (active.feedRightElapsed > 0) parts.push(`R ${formatFeedElapsed(active.feedRightElapsed)}`);
    return parts.join(' · ') || '0m 0s';
  })();

  const handleSleepPress = () => {
    if (isSleeping) {
      setNotesVisible(true);
    } else {
      startSleep();
    }
  };

  const handleSaveNotes = async (notes: string): Promise<void> => {
    await stopSleep(notes);
    setNotesVisible(false);
  };

  const handleSaveFeedNotes = async (notes: string): Promise<void> => {
    await saveBreastFeed(notes);
    setFeedNotesVisible(false);
  };

  const handleBottlePress = (): void => {
    setPendingBottleNotes('');
    setBottleModalVisible(true);
  };

  const handleBottleLongPress = (): void => {
    setBottleNotesVisible(true);
  };

  const handleBottleNoteSaved = async (notes: string): Promise<void> => {
    setPendingBottleNotes(notes);
    setBottleNotesVisible(false);
    setBottleModalVisible(true);
  };

  const handleBottleSave = async (amountMl: number): Promise<void> => {
    await logBottle(amountMl, pendingBottleNotes || undefined);
    setBottleModalVisible(false);
    setPendingBottleNotes('');
  };

  const handleSolidsPress = async (): Promise<void> => {
    await logSolids();
  };

  const handleSolidsLongPress = (): void => {
    setSolidsNotesVisible(true);
  };

  const handleSolidsNoteSaved = async (notes: string): Promise<void> => {
    await logSolids(notes);
    setSolidsNotesVisible(false);
  };

  const handleDiaperPress = async (status: DiaperLog['status']): Promise<void> => {
    await logDiaper(status);
  };

  const handleDiaperLongPress = (status: DiaperLog['status']): void => {
    setPendingDiaperStatus(status);
    setDiaperNotesVisible(true);
  };

  const handleDiaperNoteSaved = async (notes: string): Promise<void> => {
    if (pendingDiaperStatus === null) return;
    await logDiaper(pendingDiaperStatus, notes);
    setDiaperNotesVisible(false);
    setPendingDiaperStatus(null);
  };

  return (
    <SafeAreaView style={styles.root}>
      <DashboardHeader
        onAddBaby={() => setShowAddBaby(true)}
        onSettingsPress={() => setSettingsVisible(true)}
      />

      {/* Action zone */}
      <View style={styles.actionZone}>
        <TouchableOpacity
          style={[styles.sleepButton, isSleeping && styles.sleepButtonActive]}
          onPress={handleSleepPress}
        >
          <Text style={styles.sleepButtonLabel}>
            {isSleeping ? `Wake Up  ·  ${formatElapsed(sleepElapsed)}` : 'Track Sleep'}
          </Text>
        </TouchableOpacity>

        {/* Feed buttons */}
        <View style={styles.feedRow}>
          <TouchableOpacity
            style={[styles.feedButton, active.feedLeftStart !== null && styles.feedButtonActive]}
            onPress={() => toggleBreastFeed('left')}
            disabled={isSleeping}
          >
            <Text style={styles.feedButtonSide}>L</Text>
            <Text style={styles.feedButtonElapsed}>{formatFeedElapsed(totalLeftSecs)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.feedButton, active.feedRightStart !== null && styles.feedButtonActive]}
            onPress={() => toggleBreastFeed('right')}
            disabled={isSleeping}
          >
            <Text style={styles.feedButtonSide}>R</Text>
            <Text style={styles.feedButtonElapsed}>{formatFeedElapsed(totalRightSecs)}</Text>
          </TouchableOpacity>

          {showFeedSave && (
            <TouchableOpacity
              style={styles.feedSaveButton}
              onPress={() => setFeedNotesVisible(true)}
            >
              <Text style={styles.feedSaveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottle / Solids row */}
        <View style={styles.quickFeedRow}>
          <TouchableOpacity
            style={styles.quickFeedButton}
            onPress={handleBottlePress}
            onLongPress={handleBottleLongPress}
            delayLongPress={400}
          >
            <Text style={styles.quickFeedButtonLabel}>Bottle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickFeedButton}
            onPress={handleSolidsPress}
            onLongPress={handleSolidsLongPress}
            delayLongPress={400}
          >
            <Text style={styles.quickFeedButtonLabel}>Solids</Text>
          </TouchableOpacity>
        </View>

        {/* Diaper buttons */}
        <View style={styles.diaperRow}>
          {(['wet', 'dirty', 'mixed', 'dry'] as const).map(status => (
            <TouchableOpacity
              key={status}
              style={styles.diaperButton}
              onPress={() => handleDiaperPress(status)}
              onLongPress={() => handleDiaperLongPress(status)}
              delayLongPress={400}
            >
              <Text style={styles.diaperButtonLabel}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Log list */}
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
        visible={notesVisible}
        title="End Sleep Session"
        elapsed={formatElapsed(sleepElapsed)}
        onSave={handleSaveNotes}
        onDismiss={() => setNotesVisible(false)}
      />
      <NotesModal
        visible={feedNotesVisible}
        title="End Feed Session"
        elapsed={feedModalElapsed}
        onSave={handleSaveFeedNotes}
        onDismiss={() => setFeedNotesVisible(false)}
      />
      <NotesModal
        visible={bottleNotesVisible}
        title="Add Note — Bottle"
        onSave={handleBottleNoteSaved}
        onDismiss={() => setBottleNotesVisible(false)}
      />
      <NotesModal
        visible={solidsNotesVisible}
        title="Add Note — Solids"
        onSave={handleSolidsNoteSaved}
        onDismiss={() => setSolidsNotesVisible(false)}
      />
      <BottleLogModal
        visible={bottleModalVisible}
        prefillNotes={pendingBottleNotes}
        onSave={handleBottleSave}
        onDismiss={() => {
          setBottleModalVisible(false);
          setPendingBottleNotes('');
        }}
      />
      <NotesModal
        visible={diaperNotesVisible}
        title={`Add Note — ${pendingDiaperStatus !== null ? pendingDiaperStatus.charAt(0).toUpperCase() + pendingDiaperStatus.slice(1) : ''}`}
        onSave={handleDiaperNoteSaved}
        onDismiss={() => {
          setDiaperNotesVisible(false);
          setPendingDiaperStatus(null);
        }}
      />
    </SafeAreaView>
  );
};
