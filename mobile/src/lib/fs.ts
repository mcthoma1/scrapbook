// mobile/src/lib/fs.ts
// File-system helpers for *local-only* media storage.
// We deliberately use the legacy shim so we can keep idempotent deletes.
import * as FileSystem from 'expo-file-system/legacy';

/** App-private media directory inside the sandbox. */
const MEDIA_DIR =
  `${(FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory}media/`;

/** Make sure the media directory exists before we write into it. */
async function ensureMediaDir() {
  if (!MEDIA_DIR) throw new Error('No writable base directory available');
  await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
}

/** Best-effort delete that never throws if the file is already gone. */
export async function deleteFileIfExists(uri: string) {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore errors; idempotent covers most cases
  }
}

function pickExt(nameHint?: string, mime?: string) {
  const fromNameExt = nameHint && nameHint.includes('.') ? nameHint.split('.').pop() : undefined;
  const fromMimeExt = mime && mime.includes('/') ? mime.split('/').pop() : undefined;
  return (fromNameExt || fromMimeExt || 'jpg').toLowerCase();
}

/**
 * Copy a picked asset into the app-private media folder and return the dest URI.
 * This keeps user media strictly on-device (no uploads).
 */
export async function copyIntoMediaDir(params: {
  uri: string;
  fileName?: string;
  mimeType?: string;
}): Promise<string> {
  await ensureMediaDir();
  const ext = pickExt(params.fileName, params.mimeType);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const to = MEDIA_DIR + filename;
  await FileSystem.copyAsync({ from: params.uri, to });
  return to;
}

// (Optional) Export the absolute media directory for debugging or future features.
export { MEDIA_DIR };
