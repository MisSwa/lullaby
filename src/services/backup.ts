import * as FileSystem from 'expo-file-system/legacy';
import { SQLiteDatabase } from 'expo-sqlite';

// ─── Row types matching SQLite column shapes ─────────────────────────────────

interface BabyRow {
  id: string;
  name: string;
  dob: number;
  created_at: number;
}

interface BabyLogRow {
  id: string;
  baby_id: string;
  type: string;
  timestamp: number;
  notes: string | null;
  endTime: number | null;
  feedType: string | null;
  leftDuration: number | null;
  rightDuration: number | null;
  amountMl: number | null;
  status: string | null;
}

interface BackupPayload {
  exportedAt: number;
  babies: BabyRow[];
  logs: BabyLogRow[];
}

// Drive API response shapes

interface DriveFile {
  id: string;
}

interface DriveFileList {
  files: DriveFile[];
}

interface DriveFileInfo {
  size: string; // Drive API returns size as a string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildBackupFileName(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `lullaby_backup_${yyyy}-${mm}-${dd}.json`;
}

// ─── exportSnapshot ───────────────────────────────────────────────────────────

export async function exportSnapshot(db: SQLiteDatabase): Promise<string> {
  try {
    const babies = await db.getAllAsync<BabyRow>('SELECT * FROM babies ORDER BY created_at ASC;');
    const logs = await db.getAllAsync<BabyLogRow>(
      'SELECT * FROM baby_logs ORDER BY timestamp DESC;',
    );
    const payload: BackupPayload = { exportedAt: Date.now(), babies, logs };
    return JSON.stringify(payload);
  } catch (error) {
    console.error('exportSnapshot failed:', error);
    throw error;
  }
}

// ─── iOS iCloud write ─────────────────────────────────────────────────────────

export async function writeBackupIOS(json: string): Promise<void> {
  try {
    const fileName = buildBackupFileName();
    const path = `${FileSystem.documentDirectory ?? ''}${fileName}`;
    await FileSystem.writeAsStringAsync(path, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    console.warn('Backup written to:', path);

    // Readback confirmation
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      console.warn('Backup confirmed — size:', info.size, 'bytes');
    }
  } catch (error) {
    console.error('iOS backup write failed:', error);
    // Do not rethrow — fire-and-forget contract
  }
}

// ─── Android Google Drive write ───────────────────────────────────────────────

export async function writeBackupAndroid(json: string, accessToken: string): Promise<void> {
  const fileName = buildBackupFileName();
  const boundary = 'lullaby_bkp_boundary';
  const metadata = JSON.stringify({ name: fileName, mimeType: 'application/json' });

  const authHeader = `Bearer ${accessToken}`;

  const buildBody = (): string =>
    [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      json,
      `--${boundary}--`,
    ].join('\r\n');

  const multipartHeaders = {
    Authorization: authHeader,
    'Content-Type': `multipart/related; boundary=${boundary}`,
  };

  try {
    // Search for an existing file with today's name so we can overwrite it
    const searchUrl =
      `https://www.googleapis.com/drive/v3/files` +
      `?q=name%3D'${encodeURIComponent(fileName)}'&spaces=drive&fields=files(id)`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: authHeader },
    });
    const searchData = (await searchRes.json()) as DriveFileList;

    let fileId: string;

    if (searchData.files.length > 0) {
      // Overwrite existing file
      fileId = searchData.files[0].id;
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
        { method: 'PATCH', headers: multipartHeaders, body: buildBody() },
      );
    } else {
      // Create new file
      const createRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        { method: 'POST', headers: multipartHeaders, body: buildBody() },
      );
      const created = (await createRes.json()) as DriveFile;
      fileId = created.id;
    }

    console.warn('Backup uploaded to Drive — file ID:', fileId);

    // Readback confirmation
    const infoRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=size`, {
      headers: { Authorization: authHeader },
    });
    const infoData = (await infoRes.json()) as DriveFileInfo;
    console.warn('Drive backup confirmed — size:', infoData.size, 'bytes');
  } catch (error) {
    console.error('Android Drive backup failed:', error);
    // Do not rethrow — fire-and-forget contract
  }
}
