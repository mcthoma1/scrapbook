import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";
import type {
  Album,
  AlbumMembership,
  Comment,
  Memory,
  NewMemory,
  Reaction,
  UserProfile,
} from "./types";

let db: SQLiteDatabase | null = null;

function uuid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function generateUniqueInviteCode(): Promise<string> {
  await ensureDb();
  for (let attempt = 0; attempt < 10; attempt++) {
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    if (inviteCode.length < 6) {
      continue;
    }

    const existing = await db!.getFirstAsync<{ id: string }>(
      `SELECT id FROM albums WHERE inviteCode = ?;`,
      [inviteCode]
    );

    if (!existing) {
      return inviteCode;
    }
  }

  throw new Error("INVITE_CODE_GENERATION_FAILED");
}

async function ensureAlbumSchema() {
  if (!db) return;
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(albums);`);
  const columnNames = new Set(columns.map((column) => column.name));
  const addColumn = async (name: string, definition: string) => {
    if (columnNames.has(name)) return;
    await db!.execAsync(`ALTER TABLE albums ADD COLUMN ${name} ${definition};`);
    columnNames.add(name);
  };

  await addColumn("description", "TEXT");
  await addColumn("coverImage", "TEXT");
  await addColumn("inviteCode", "TEXT");
  await addColumn("createdByEmail", "TEXT");
  await addColumn("createdByName", "TEXT");

  await db!.execAsync(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_albums_inviteCode ON albums(inviteCode) WHERE inviteCode IS NOT NULL;`
  );
}

async function ensureAlbumMembershipSchema() {
  if (!db) return;
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(album_memberships);`);
  const columnNames = new Set(columns.map((column) => column.name));
  const addColumn = async (name: string, definition: string) => {
    if (columnNames.has(name)) return;
    await db!.execAsync(`ALTER TABLE album_memberships ADD COLUMN ${name} ${definition};`);
    columnNames.add(name);
  };

  await addColumn("albumTitle", "TEXT");
  await addColumn("userName", "TEXT");
  await addColumn("role", "TEXT DEFAULT 'member'");
  await addColumn("joinedDate", "INTEGER DEFAULT 0");
}

async function ensureDb() {
  if (!db) {
    db = openDatabaseSync("scrapbook.db");
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);
  }

  await db!.execAsync(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);

  await db!.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL,
      fullName TEXT,
      familyRole TEXT,
      bio TEXT,
      profileImage TEXT,
      notificationPrefs TEXT,
      createdAt INTEGER NOT NULL
    );
  `);

  await db!.execAsync(`
    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      coverImage TEXT,
      inviteCode TEXT UNIQUE,
      createdByEmail TEXT,
      createdByName TEXT,
      createdAt INTEGER NOT NULL
    );
  `);

  await db!.execAsync(`
    CREATE TABLE IF NOT EXISTS album_memberships (
      id TEXT PRIMARY KEY NOT NULL,
      albumId TEXT NOT NULL,
      albumTitle TEXT,
      userEmail TEXT NOT NULL,
      userName TEXT,
      role TEXT,
      joinedDate INTEGER NOT NULL,
      FOREIGN KEY (albumId) REFERENCES albums(id) ON DELETE CASCADE
    );
  `);

  await db!.execAsync(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY NOT NULL,
      albumId TEXT,
      albumTitle TEXT,
      title TEXT,
      caption TEXT,
      memoryDate TEXT,
      mediaType TEXT,
      mediaUri TEXT,
      locationName TEXT,
      tags TEXT,
      authorName TEXT,
      authorEmail TEXT,
      reactionCount INTEGER DEFAULT 0,
      commentCount INTEGER DEFAULT 0,
      createdAt INTEGER NOT NULL,
      createdDate TEXT
    );
  `);

  await db!.execAsync(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY NOT NULL,
      memoryId TEXT NOT NULL,
      text TEXT NOT NULL,
      authorName TEXT,
      authorEmail TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (memoryId) REFERENCES memories(id) ON DELETE CASCADE
    );
  `);

  await db!.execAsync(`
    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY NOT NULL,
      memoryId TEXT NOT NULL,
      reactionType TEXT NOT NULL,
      authorName TEXT,
      authorEmail TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (memoryId) REFERENCES memories(id) ON DELETE CASCADE
    );
  `);

  await ensureAlbumSchema();
  await ensureAlbumMembershipSchema();
}

async function getAppState(key: string): Promise<string | null> {
  await ensureDb();
  const row = await db!.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_state WHERE key = ?;`,
    [key]
  );
  return row?.value ?? null;
}

async function setAppState(key: string, value: string | null) {
  await ensureDb();
  if (value === null) {
    await db!.runAsync(`DELETE FROM app_state WHERE key = ?;`, [key]);
  } else {
    await db!.runAsync(
      `INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
      [key, value]
    );
  }
}

function mapUser(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName ?? "",
    familyRole: row.familyRole ?? "",
    bio: row.bio ?? "",
    profileImage: row.profileImage ?? null,
    notificationPrefs: row.notificationPrefs
      ? JSON.parse(row.notificationPrefs)
      : { newMemories: true, newComments: true },
    createdAt: row.createdAt,
  };
}

function mapAlbum(row: any, memberCount = 0): Album {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    coverImage: row.coverImage ?? null,
    inviteCode: row.inviteCode,
    createdByEmail: row.createdByEmail ?? "",
    createdByName: row.createdByName ?? "",
    createdAt: row.createdAt,
    memberCount,
  };
}

function mapMembership(row: any): AlbumMembership {
  return {
    id: row.id,
    albumId: row.albumId,
    albumTitle: row.albumTitle ?? "",
    userEmail: row.userEmail,
    userName: row.userName ?? "",
    role: (row.role as AlbumMembership["role"]) ?? "member",
    joinedDate: row.joinedDate,
  };
}

function mapMemory(row: any): Memory {
  return {
    id: row.id,
    albumId: row.albumId,
    albumTitle: row.albumTitle ?? "",
    title: row.title ?? "",
    caption: row.caption ?? "",
    memoryDate: row.memoryDate ?? new Date(row.createdAt).toISOString().split("T")[0],
    mediaType: row.mediaType ?? "photo",
    mediaUri: row.mediaUri ?? null,
    locationName: row.locationName ?? null,
    tags: row.tags ? JSON.parse(row.tags) : [],
    authorName: row.authorName ?? "",
    authorEmail: row.authorEmail ?? "",
    reactionCount: row.reactionCount ?? 0,
    commentCount: row.commentCount ?? 0,
    createdAt: row.createdAt,
    createdDate: row.createdDate ?? new Date(row.createdAt).toISOString(),
  };
}

function mapComment(row: any): Comment {
  return {
    id: row.id,
    memoryId: row.memoryId,
    text: row.text,
    authorName: row.authorName ?? "",
    authorEmail: row.authorEmail ?? "",
    createdAt: row.createdAt,
  };
}

function mapReaction(row: any): Reaction {
  return {
    id: row.id,
    memoryId: row.memoryId,
    reactionType: (row.reactionType as Reaction["reactionType"]) ?? "heart",
    authorName: row.authorName ?? "",
    authorEmail: row.authorEmail ?? "",
    createdAt: row.createdAt,
  };
}

async function ensureDemoUser(): Promise<UserProfile> {
  const existing = await getAppState("current_user_id");
  if (existing) {
    const row = await db!.getFirstAsync<any>(`SELECT * FROM users WHERE id = ?;`, [existing]);
    if (row) return mapUser(row);
  }

  const id = uuid();
  const createdAt = Date.now();
  const email = "demo@example.com";
  const fullName = "Demo User";
  await db!.runAsync(
    `INSERT INTO users (id, email, fullName, familyRole, bio, profileImage, notificationPrefs, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      email,
      fullName,
      "",
      "",
      null,
      JSON.stringify({ newMemories: true, newComments: true }),
      createdAt,
    ]
  );
  await setAppState("current_user_id", id);
  return {
    id,
    email,
    fullName,
    familyRole: "",
    bio: "",
    profileImage: null,
    notificationPrefs: { newMemories: true, newComments: true },
    createdAt,
  };
}

export async function getCurrentUser(): Promise<UserProfile> {
  await ensureDb();
  const stored = await getAppState("current_user_id");
  if (stored) {
    const row = await db!.getFirstAsync<any>(`SELECT * FROM users WHERE id = ?;`, [stored]);
    if (row) return mapUser(row);
  }
  return ensureDemoUser();
}

export async function login(): Promise<UserProfile> {
  return getCurrentUser();
}

export async function logout(): Promise<void> {
  await ensureDb();
  await setAppState("current_user_id", null);
}

export async function updateCurrentUser(data: Partial<UserProfile>): Promise<UserProfile> {
  await ensureDb();
  const user = await getCurrentUser();
  const merged = {
    ...user,
    ...data,
    notificationPrefs: {
      ...user.notificationPrefs,
      ...(data.notificationPrefs ?? {}),
    },
  };
  await db!.runAsync(
    `UPDATE users SET fullName = ?, familyRole = ?, bio = ?, profileImage = ?, notificationPrefs = ? WHERE id = ?;`,
    [
      merged.fullName,
      merged.familyRole ?? "",
      merged.bio ?? "",
      merged.profileImage ?? null,
      JSON.stringify(merged.notificationPrefs),
      user.id,
    ]
  );
  return merged;
}

export async function createAlbum(params: {
  title: string;
  description?: string;
  coverImage?: string | null;
  createdBy: UserProfile;
}): Promise<{ album: Album; membership: AlbumMembership }> {
  await ensureDb();
  const id = uuid();
  const createdAt = Date.now();

  let inviteCode: string | null = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      inviteCode = await generateUniqueInviteCode();
      await db!.runAsync(
        `INSERT INTO albums (id, title, description, coverImage, inviteCode, createdByEmail, createdByName, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          params.title,
          params.description ?? "",
          params.coverImage ?? null,
          inviteCode,
          params.createdBy.email,
          params.createdBy.fullName,
          createdAt,
        ]
      );
      break;
    } catch (error: any) {
      const message = typeof error?.message === "string" ? error.message : "";
      if (message.includes("UNIQUE constraint failed: albums.inviteCode")) {
        inviteCode = null;
        continue;
      }
      throw error;
    }
  }

  if (!inviteCode) {
    throw new Error("INVITE_CODE_GENERATION_FAILED");
  }

  const membershipId = uuid();
  const joinedDate = createdAt;
  await db!.runAsync(
    `INSERT INTO album_memberships (id, albumId, albumTitle, userEmail, userName, role, joinedDate)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      membershipId,
      id,
      params.title,
      params.createdBy.email,
      params.createdBy.fullName,
      "owner",
      joinedDate,
    ]
  );

  const albumRow = await db!.getFirstAsync<any>(`SELECT * FROM albums WHERE id = ?;`, [id]);
  const memberCountRow = await db!.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM album_memberships WHERE albumId = ?;`,
    [id]
  );

  return {
    album: mapAlbum(albumRow, memberCountRow?.count ?? 1),
    membership: mapMembership({
      id: membershipId,
      albumId: id,
      albumTitle: params.title,
      userEmail: params.createdBy.email,
      userName: params.createdBy.fullName,
      role: "owner",
      joinedDate,
    }),
  };
}

export async function listAlbumsForUser(userEmail: string): Promise<AlbumMembership[]> {
  await ensureDb();
  const rows = await db!.getAllAsync<any>(
    `SELECT * FROM album_memberships WHERE userEmail = ? ORDER BY joinedDate DESC;`,
    [userEmail]
  );
  return rows.map(mapMembership);
}

export async function getAlbumById(id: string): Promise<Album | null> {
  await ensureDb();
  const row = await db!.getFirstAsync<any>(`SELECT * FROM albums WHERE id = ?;`, [id]);
  if (!row) return null;
  const members = await db!.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM album_memberships WHERE albumId = ?;`,
    [id]
  );
  return mapAlbum(row, members?.count ?? 0);
}

export async function listAlbumMembers(albumId: string): Promise<AlbumMembership[]> {
  await ensureDb();
  const rows = await db!.getAllAsync<any>(
    `SELECT * FROM album_memberships WHERE albumId = ? ORDER BY joinedDate ASC;`,
    [albumId]
  );
  return rows.map(mapMembership);
}

export async function joinAlbumByCode(inviteCode: string, user: UserProfile): Promise<{ album: Album; membership: AlbumMembership }> {
  await ensureDb();
  const albumRow = await db!.getFirstAsync<any>(
    `SELECT * FROM albums WHERE inviteCode = ?;`,
    [inviteCode.toUpperCase()]
  );
  if (!albumRow) {
    throw new Error("INVALID_CODE");
  }

  const existing = await db!.getFirstAsync<any>(
    `SELECT id FROM album_memberships WHERE albumId = ? AND userEmail = ?;`,
    [albumRow.id, user.email]
  );
  if (existing) {
    throw new Error("ALREADY_MEMBER");
  }

  const membershipId = uuid();
  const joinedDate = Date.now();
  await db!.runAsync(
    `INSERT INTO album_memberships (id, albumId, albumTitle, userEmail, userName, role, joinedDate)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      membershipId,
      albumRow.id,
      albumRow.title,
      user.email,
      user.fullName,
      "member",
      joinedDate,
    ]
  );

  const memberCountRow = await db!.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM album_memberships WHERE albumId = ?;`,
    [albumRow.id]
  );

  return {
    album: mapAlbum(albumRow, memberCountRow?.count ?? 0),
    membership: mapMembership({
      id: membershipId,
      albumId: albumRow.id,
      albumTitle: albumRow.title,
      userEmail: user.email,
      userName: user.fullName,
      role: "member",
      joinedDate,
    }),
  };
}

async function listAlbumIdsForUser(userEmail: string): Promise<string[]> {
  const memberships = await listAlbumsForUser(userEmail);
  return memberships.map((m) => m.albumId);
}

export async function listMemoriesForUser(userEmail: string): Promise<Memory[]> {
  await ensureDb();
  const albumIds = await listAlbumIdsForUser(userEmail);
  if (albumIds.length === 0) return [];
  const placeholders = albumIds.map(() => "?").join(",");
  const rows = await db!.getAllAsync<any>(
    `SELECT * FROM memories WHERE albumId IN (${placeholders}) ORDER BY createdAt DESC;`,
    albumIds
  );
  return rows.map(mapMemory);
}

export async function listMemoriesByAlbum(albumId: string): Promise<Memory[]> {
  await ensureDb();
  const rows = await db!.getAllAsync<any>(
    `SELECT * FROM memories WHERE albumId = ? ORDER BY createdAt DESC;`,
    [albumId]
  );
  return rows.map(mapMemory);
}

export async function getMemoryById(id: string): Promise<Memory | null> {
  await ensureDb();
  const row = await db!.getFirstAsync<any>(`SELECT * FROM memories WHERE id = ?;`, [id]);
  return row ? mapMemory(row) : null;
}

export async function createMemory(data: NewMemory): Promise<Memory> {
  await ensureDb();
  const createdAt = Date.now();
  const memoryId = data.id ?? uuid();
  await db!.runAsync(
    `INSERT INTO memories (id, albumId, albumTitle, title, caption, memoryDate, mediaType, mediaUri, locationName, tags, authorName, authorEmail, reactionCount, commentCount, createdAt, createdDate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?);`,
    [
      memoryId,
      data.albumId,
      data.albumTitle,
      data.title,
      data.caption ?? "",
      data.memoryDate,
      data.mediaType,
      data.mediaUri ?? null,
      data.locationName ?? null,
      JSON.stringify(data.tags ?? []),
      data.authorName,
      data.authorEmail,
      createdAt,
      new Date(createdAt).toISOString(),
    ]
  );
  const row = await db!.getFirstAsync<any>(`SELECT * FROM memories WHERE id = ?;`, [memoryId]);
  return mapMemory(row);
}

export async function updateMemory(id: string, updates: Partial<Memory>): Promise<void> {
  await ensureDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.caption !== undefined) {
    fields.push("caption = ?");
    values.push(updates.caption ?? "");
  }
  if (updates.memoryDate !== undefined) {
    fields.push("memoryDate = ?");
    values.push(updates.memoryDate);
  }
  if (updates.tags !== undefined) {
    fields.push("tags = ?");
    values.push(JSON.stringify(updates.tags));
  }
  if (updates.reactionCount !== undefined) {
    fields.push("reactionCount = ?");
    values.push(updates.reactionCount);
  }
  if (updates.commentCount !== undefined) {
    fields.push("commentCount = ?");
    values.push(updates.commentCount);
  }
  if (updates.albumTitle !== undefined) {
    fields.push("albumTitle = ?");
    values.push(updates.albumTitle);
  }
  if (updates.locationName !== undefined) {
    fields.push("locationName = ?");
    values.push(updates.locationName ?? null);
  }

  if (fields.length === 0) return;

  values.push(id);
  await db!.runAsync(
    `UPDATE memories SET ${fields.join(", ")} WHERE id = ?;`,
    values
  );
}

export async function deleteMemory(id: string): Promise<void> {
  await ensureDb();
  await db!.runAsync(`DELETE FROM comments WHERE memoryId = ?;`, [id]);
  await db!.runAsync(`DELETE FROM reactions WHERE memoryId = ?;`, [id]);
  await db!.runAsync(`DELETE FROM memories WHERE id = ?;`, [id]);
}

export async function listComments(memoryId: string): Promise<Comment[]> {
  await ensureDb();
  const rows = await db!.getAllAsync<any>(
    `SELECT * FROM comments WHERE memoryId = ? ORDER BY createdAt DESC;`,
    [memoryId]
  );
  return rows.map(mapComment);
}

export async function createComment(data: {
  memoryId: string;
  text: string;
  authorName: string;
  authorEmail: string;
}): Promise<Comment> {
  await ensureDb();
  const id = uuid();
  const createdAt = Date.now();
  await db!.runAsync(
    `INSERT INTO comments (id, memoryId, text, authorName, authorEmail, createdAt)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [id, data.memoryId, data.text, data.authorName, data.authorEmail, createdAt]
  );
  await db!.runAsync(
    `UPDATE memories SET commentCount = commentCount + 1 WHERE id = ?;`,
    [data.memoryId]
  );
  const row = await db!.getFirstAsync<any>(`SELECT * FROM comments WHERE id = ?;`, [id]);
  return mapComment(row);
}

export async function listReactions(memoryId: string): Promise<Reaction[]> {
  await ensureDb();
  const rows = await db!.getAllAsync<any>(
    `SELECT * FROM reactions WHERE memoryId = ? ORDER BY createdAt DESC;`,
    [memoryId]
  );
  return rows.map(mapReaction);
}

export async function toggleReaction(params: {
  memoryId: string;
  reactionType?: Reaction["reactionType"];
  authorName: string;
  authorEmail: string;
}): Promise<boolean> {
  await ensureDb();
  const reaction = await db!.getFirstAsync<any>(
    `SELECT * FROM reactions WHERE memoryId = ? AND authorEmail = ?;`,
    [params.memoryId, params.authorEmail]
  );

  if (reaction) {
    await db!.runAsync(`DELETE FROM reactions WHERE id = ?;`, [reaction.id]);
    await db!.runAsync(
      `UPDATE memories SET reactionCount = CASE WHEN reactionCount > 0 THEN reactionCount - 1 ELSE 0 END WHERE id = ?;`,
      [params.memoryId]
    );
    return false;
  }

  const id = uuid();
  const createdAt = Date.now();
  await db!.runAsync(
    `INSERT INTO reactions (id, memoryId, reactionType, authorName, authorEmail, createdAt)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      id,
      params.memoryId,
      params.reactionType ?? "heart",
      params.authorName,
      params.authorEmail,
      createdAt,
    ]
  );
  await db!.runAsync(
    `UPDATE memories SET reactionCount = reactionCount + 1 WHERE id = ?;`,
    [params.memoryId]
  );
  return true;
}

export async function getAlbumInviteCode(albumId: string): Promise<string | null> {
  await ensureDb();
  const row = await db!.getFirstAsync<{ inviteCode: string }>(
    `SELECT inviteCode FROM albums WHERE id = ?;`,
    [albumId]
  );
  return row?.inviteCode ?? null;
}

export async function listAlbums(): Promise<Album[]> {
  await ensureDb();
  const rows = await db!.getAllAsync<any>(`SELECT * FROM albums ORDER BY createdAt DESC;`);
  const memberCounts = await db!.getAllAsync<{ albumId: string; count: number }>(
    `SELECT albumId, COUNT(*) as count FROM album_memberships GROUP BY albumId;`
  );
  const lookup = new Map(memberCounts.map((m) => [m.albumId, m.count]));
  return rows.map((row) => mapAlbum(row, lookup.get(row.id) ?? 0));
}

export async function removeMembership(albumId: string, userEmail: string) {
  await ensureDb();
  await db!.runAsync(
    `DELETE FROM album_memberships WHERE albumId = ? AND userEmail = ?;`,
    [albumId, userEmail]
  );
}

export function rawDb() {
  return db;
}
