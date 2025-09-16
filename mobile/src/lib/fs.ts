// mobile/src/lib/fs.ts
import * as FileSystem from 'expo-file-system/legacy';

export async function deleteFileIfExists(uri: string) {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore; idempotent handles most cases
  }
}