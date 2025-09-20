export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  familyRole?: string;
  bio?: string;
  profileImage?: string | null;
  notificationPrefs: {
    newMemories: boolean;
    newComments: boolean;
  };
  createdAt: number;
};

export type Album = {
  id: string;
  title: string;
  description?: string;
  coverImage?: string | null;
  inviteCode: string;
  createdByEmail: string;
  createdByName: string;
  createdAt: number;
  memberCount: number;
};

export type AlbumMembership = {
  id: string;
  albumId: string;
  albumTitle: string;
  userEmail: string;
  userName: string;
  role: "owner" | "member";
  joinedDate: number;
};

export type Memory = {
  id: string;
  albumId: string;
  albumTitle: string;
  title: string;
  caption?: string;
  memoryDate: string;
  mediaType: "photo" | "video" | "voice" | "text";
  mediaUri?: string | null;
  locationName?: string | null;
  tags: string[];
  authorName: string;
  authorEmail: string;
  reactionCount: number;
  commentCount: number;
  createdAt: number;
  createdDate: string;
};

export type NewMemory = {
  id?: string;
  albumId: string;
  albumTitle: string;
  title: string;
  caption?: string;
  memoryDate: string;
  mediaType: Memory["mediaType"];
  mediaUri?: string | null;
  locationName?: string | null;
  tags?: string[];
  authorName: string;
  authorEmail: string;
};

export type Comment = {
  id: string;
  memoryId: string;
  text: string;
  authorName: string;
  authorEmail: string;
  createdAt: number;
};

export type Reaction = {
  id: string;
  memoryId: string;
  reactionType: "heart";
  authorName: string;
  authorEmail: string;
  createdAt: number;
};
