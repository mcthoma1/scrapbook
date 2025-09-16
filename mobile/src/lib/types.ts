// mobile/src/lib/types.ts
export type MediaItem = {
    id: string;
    uri: string;
    createdAt: number;
    // room to grow:
    title?: string | null;
    note?: string | null;
    albumId?: string | null;
  };