import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTracker } from '@context/TrackerContext';
import { useLiveTick } from '@hooks/useLiveTick';
import { BabyLog, FeedLog, SleepLog } from '../types/tracker';
import { DashboardHeader } from './DashboardHeader';
import { AddBabyModal } from '@modals/AddBabyModal';
import { NotesModal } from '@modals/NotesModal';
import { COLORS, TYPOGRAPHY } from '@theme/colors';

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

function colorForLog(log: BabyLog): string {
  switch (log.type) {
    case 'sleep':
      return COLORS.sleep;
    case 'feed':
      return COLORS.feed;
    case 'diaper':
      return COLORS.diaper;
  }
}

function labelForLog(log: BabyLog): string {
  switch (log.type) {
    case 'sleep':
      return 'SLEEP';
    case 'feed':
      return 'FEED';
    case 'diaper':
      return 'DIAPER';
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
    if (feedLog.feedType !== 'breast') return '';
    const parts: string[] = [];
    if (feedLog.leftDuration > 0) parts.push(`L ${formatFeedElapsed(feedLog.leftDuration)}`);
    if (feedLog.rightDuration > 0) parts.push(`R ${formatFeedElapsed(feedLog.rightDuration)}`);
    return parts.join(' · ');
  }
  return '';
}

// ─── LogCard ────────────────────────────────────────────────────────────────

interface LogCardProps {
  log: BabyLog;
  onDelete: (id: string) => void;
}

const LogCard: React.FC<LogCardProps> = ({ log, onDelete }) => {
  const duration = durationForLog(log);
  const isInProgress = log.type === 'sleep' && !(log as SleepLog).endTime;

  return (
    <View style={styles.card}>
      <View style={[styles.cardStrip, { backgroundColor: colorForLog(log) }]} />
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
  const { logs, active, startSleep, stopSleep, removeLog, toggleBreastFeed, saveBreastFeed } =
    useTracker();
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [feedNotesVisible, setFeedNotesVisible] = useState(false);

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

  return (
    <SafeAreaView style={styles.root}>
      <DashboardHeader onAddBaby={() => setShowAddBaby(true)} />

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
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Action zone
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
    shadowColor: '#000',
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
  // Log list
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
  // Log card
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
  // Feed buttons
  feedRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  feedButton: {
    flex: 1,
    height: 68,
    borderRadius: 12,
    backgroundColor: COLORS.feed,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
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
    height: 68,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  feedSaveButtonText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
});
