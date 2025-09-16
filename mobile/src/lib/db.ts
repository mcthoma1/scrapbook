// SUMMARY: Local SQLite helpers for media and albums with safe migrations & fallbacks.
// - ensure DB + schema (media + albums)
// - MIGRATION: add missing columns (title, note, albumId) on older DBs
// - SAFE FALLBACKS: queries fall back to legacy 3-column schema if needed
// - list/insert/get/delete media
// - list/create/get albums
// - list media by album

import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";
import type { MediaItem, Album } from "./types";

let db: SQLiteDatabase | null = null;

/** Open DB and ensure schema. Safe to call often. */
async function ensureDb() {
  if (!db) {
    db = openDatabaseSync("scrapbook.db");
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);
  }

  // Base table (original MVP fields)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY NOT NULL,
      uri TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);

  // Add any missing columns (migrate older installs)
  await migrateMediaTable();

  // Albums table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);

  // Helpful index (safe even if albumId was just added)
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_media_albumId ON media (albumId);`);
}

/** Figure out which columns the media table currently has. */
async function getMediaColumnNames(): Promise<Set<string>> {
  const cols = await db!.getAllAsync<{ name: string }>("PRAGMA table_info(media);");
  return new Set(cols.map((c) => c.name));
}

/** Add new columns to older DBs. */
async function migrateMediaTable() {
  const names = await getMediaColumnNames();
  if (!names.has("title"))   await db!.execAsync(`ALTER TABLE media ADD COLUMN title TEXT;`);
  if (!names.has("note"))    await db!.execAsync(`ALTER TABLE media ADD COLUMN note TEXT;`);
  if (!names.has("albumId")) await db!.execAsync(`ALTER TABLE media ADD COLUMN albumId INTEGER;`);
}

/** Try a "full" query; if it fails due to missing columns, migrate & retry; else fall back to legacy. */
async function getAllWithFallback<T>(
  fullSql: string,
  legacySql: string,
  params: any[] = []
): Promise<T[]> {
  try {
    return await db!.getAllAsync<T>(fullSql, params);
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes("no such column")) {
      try {
        await migrateMediaTable();
        return await db!.getAllAsync<T>(fullSql, params);
      } catch {
        // final fallback: legacy columns only
        return await db!.getAllAsync<T>(legacySql, params);
      }
    }
    throw e;
  }
}

/** Same idea for a single row fetch — NOTE: returns T | null (not undefined). */
async function getFirstWithFallback<T>(
  fullSql: string,
  legacySql: string,
  params: any[] = []
): Promise<T | null> {
  try {
    return await db!.getFirstAsync<T>(fullSql, params); // T | null
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes("no such column")) {
      try {
        await migrateMediaTable();
        return await db!.getFirstAsync<T>(fullSql, params); // T | null
      } catch {
        return await db!.getFirstAsync<T>(legacySql, params); // T | null
      }
    }
    throw e;
  }
}

/** MEDIA: list all photos, newest first. */
export async function listMemories(): Promise<MediaItem[]> {
  await ensureDb();

  const fullSql = `
    SELECT id, uri, createdAt, title, note, albumId
    FROM media
    ORDER BY createdAt DESC;
  `;
  const legacySql = `
    SELECT id, uri, createdAt
    FROM media
    ORDER BY createdAt DESC;
  `;

  const rows = await getAllWithFallback<any>(fullSql, legacySql);
  return rows.map((r: any) => ({
    id: r.id,
    uri: r.uri,
    createdAt: r.createdAt,
    title: r.title ?? null,
    note: r.note ?? null,
    albumId: r.albumId ?? null,
  }));
}

/** MEDIA: insert one row (uses full schema; legacy DB will be migrated first). */
export type NewMedia = {
  id: string;
  uri: string;
  createdAt: number;
  title?: string | null;
  note?: string | null;
  albumId?: number | null;
};

export async function insertMemory(item: NewMedia): Promise<void> {
  await ensureDb();
  await db!.runAsync(
    `INSERT INTO media (id, uri, createdAt, title, note, albumId)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [item.id, item.uri, item.createdAt, item.title ?? null, item.note ?? null, item.albumId ?? null]
  );
}

/** MEDIA: fetch one by id. */
export async function getMemoryById(id: string): Promise<MediaItem | null> {
  await ensureDb();

  const fullSql = `
    SELECT id, uri, createdAt, title, note, albumId
    FROM media
    WHERE id = ?;
  `;
  const legacySql = `
    SELECT id, uri, createdAt
    FROM media
    WHERE id = ?;
  `;

  const row = await getFirstWithFallback<any>(fullSql, legacySql, [id]);
  return row
    ? {
        id: row.id,
        uri: row.uri,
        createdAt: row.createdAt,
        title: row.title ?? null,
        note: row.note ?? null,
        albumId: row.albumId ?? null,
      }
    : null;
}

/** MEDIA: delete one row (file deletion happens outside). */
export async function deleteMemoryById(id: string): Promise<void> {
  await ensureDb();
  await db!.runAsync(`DELETE FROM media WHERE id = ?;`, [id]);
}

/** MEDIA: list photos in a given album. If albumId doesn't exist yet, return empty. */
export async function listMemoriesByAlbum(albumId: number): Promise<MediaItem[]> {
  await ensureDb();

  // If the column doesn't exist (very old DB), just return an empty list.
  const cols = await getMediaColumnNames();
  if (!cols.has("albumId")) return [];

  const rows = await db!.getAllAsync<any>(
    `SELECT id, uri, createdAt, title, note, albumId
     FROM media
     WHERE albumId = ?
     ORDER BY createdAt DESC;`,
    [albumId]
  );
  return rows.map((r: any) => ({
    id: r.id,
    uri: r.uri,
    createdAt: r.createdAt,
    title: r.title ?? null,
    note: r.note ?? null,
    albumId: r.albumId ?? null,
  }));
}

/** ALBUMS: create one; returns its id. */
export async function createAlbum(name: string): Promise<number> {
  await ensureDb();
  const createdAt = Date.now();
  await db!.runAsync(`INSERT INTO albums (name, createdAt) VALUES (?, ?);`, [name, createdAt]);
  const row = await db!.getFirstAsync<{ id: number }>(`SELECT last_insert_rowid() AS id;`);
  return row?.id ?? 0;
}

/** ALBUMS: list all. */
export async function listAlbums(): Promise<Album[]> {
  await ensureDb();
  const rows = await db!.getAllAsync<Album>(
    `SELECT id, name, createdAt FROM albums ORDER BY createdAt DESC;`
  );
  return rows.map((a) => ({ id: a.id, name: a.name, createdAt: a.createdAt }));
}

/** ALBUMS: get one. */
export async function getAlbumById(id: number): Promise<Album | null> {
  await ensureDb();
  const row = await db!.getFirstAsync<Album>(
    `SELECT id, name, createdAt FROM albums WHERE id = ?;`,
    [id]
  );
  return row ? { id: row.id, name: row.name, createdAt: row.createdAt } : null;
}

/** Escape hatch if needed. */
export function rawDb() {
  return db;
}
