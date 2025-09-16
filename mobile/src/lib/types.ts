// SUMMARY: App-wide types so every file agrees on the data shape used in DB.

// A single row in the local "media" table.
export type MediaItem = {
  id: string;            // unique id (e.g., Date.now().toString())
  uri: string;           // file location in the app's private folder
  createdAt: number;     // epoch ms

  // Optional metadata that db.ts already reads/writes.
  title?: string | null;
  note?: string | null;
  albumId?: number | null;
};

// (Used in Phase 2; kept here so imports won’t break)
export type Album = {
  id: number;
  name: string;
  createdAt: number;     // epoch ms
};
