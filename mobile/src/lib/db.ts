// mobile/src/lib/db.ts
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import type { MediaItem } from './types';

const db: SQLiteDatabase = openDatabaseSync('scrapbook.db');

// Create/upgrade table if needed
export async function ensureDb() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY NOT NULL,
      uri TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      title TEXT,
      note TEXT,
      albumId TEXT
    );
  `);
}

// Read one memory
export async function getMemoryById(id: string): Promise<MediaItem | null> {
  await ensureDb();
  const rows = await db.getAllAsync<MediaItem>(
    'SELECT id, uri, createdAt, title, note, albumId FROM media WHERE id = ? LIMIT 1;',
    [id]
  );
  return rows[0] ?? null;
}

// List (kept for future reuse)
export async function listMemories(): Promise<MediaItem[]> {
  await ensureDb();
  return db.getAllAsync<MediaItem>(
    'SELECT id, uri, createdAt, title, note, albumId FROM media ORDER BY createdAt DESC;'
  );
}

// Insert (matches what your index.tsx already does)
export async function insertMemory(item: MediaItem) {
  await ensureDb();
  await db.runAsync(
    'INSERT INTO media (id, uri, createdAt, title, note, albumId) VALUES (?, ?, ?, ?, ?, ?);',
    [item.id, item.uri, item.createdAt, item.title ?? null, item.note ?? null, item.albumId ?? null]
  );
}

// Delete one
export async function deleteMemoryById(id: string) {
  await ensureDb();
  await db.runAsync('DELETE FROM media WHERE id = ?;', [id]);
}

// Provide raw db if needed elsewhere
export function rawDb() {
  return db;
}