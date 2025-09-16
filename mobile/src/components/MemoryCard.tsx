import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Video } from "expo-av";

import {
  createComment,
  listComments,
  listReactions,
  toggleReaction,
} from "../lib/db";
import type { Comment, Memory, Reaction, UserProfile } from "../lib/types";

const formatDate = (value: string | number) => {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (value: number) => {
  const date = new Date(value);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

type Props = {
  memory: Memory;
  currentUser: UserProfile;
  onRequestEdit?: (memory: Memory) => void;
  onRequestDelete?: (memory: Memory) => void;
  onUpdated?: () => void;
};

export default function MemoryCard({
  memory,
  currentUser,
  onRequestEdit,
  onRequestDelete,
  onUpdated,
}: Props) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);

  const isAuthor = currentUser.email === memory.authorEmail;
  const reacted = useMemo(
    () => reactions.some((r) => r.authorEmail === currentUser.email),
    [reactions, currentUser.email]
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [loadedComments, loadedReactions] = await Promise.all([
          listComments(memory.id),
          listReactions(memory.id),
        ]);
        if (mounted) {
          setComments(loadedComments);
          setReactions(loadedReactions);
        }
      } catch (error) {
        console.warn("load engagement error", error);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [memory.id]);

  const handleReaction = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const added = await toggleReaction({
        memoryId: memory.id,
        authorEmail: currentUser.email,
        authorName: currentUser.fullName,
      });
      const updatedReactions = await listReactions(memory.id);
      setReactions(updatedReactions);
      onUpdated?.();
      if (!added) {
        // reaction removed
      }
    } catch (error) {
      console.warn("toggle reaction error", error);
      Alert.alert("Oops", "Couldn't update your reaction. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await createComment({
        memoryId: memory.id,
        text: trimmed,
        authorEmail: currentUser.email,
        authorName: currentUser.fullName,
      });
      setCommentText("");
      const [loadedComments, loadedReactions] = await Promise.all([
        listComments(memory.id),
        listReactions(memory.id),
      ]);
      setComments(loadedComments);
      setReactions(loadedReactions);
      onUpdated?.();
    } catch (error) {
      console.warn("comment error", error);
      Alert.alert("Could not post comment", "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const avatarInitial = memory.authorName?.charAt(0) || "F";
  const memoryDate = formatDate(memory.memoryDate ?? memory.createdDate);
  const createdTime = formatTime(memory.createdAt);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{avatarInitial}</Text>
          </View>
          <View>
            <Text style={styles.author}>{memory.authorName || "Family Member"}</Text>
            <Text style={styles.meta}>{memory.albumTitle} • {memoryDate}</Text>
          </View>
        </View>

        {isAuthor && (
          <Pressable
            accessibilityLabel="Memory options"
            hitSlop={12}
            style={styles.menuBtn}
            onPress={() => {
              Alert.alert("Memory options", undefined, [
                {
                  text: "Edit",
                  onPress: () => onRequestEdit?.(memory),
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => onRequestDelete?.(memory),
                },
                { text: "Cancel", style: "cancel" },
              ]);
            }}
          >
            <Feather name="more-horizontal" size={20} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {memory.mediaType !== "text" && memory.mediaUri ? (
        <View style={styles.media}>
          {memory.mediaType === "photo" && (
            <Image source={{ uri: memory.mediaUri }} style={styles.image} resizeMode="cover" />
          )}
          {memory.mediaType === "video" && (
            <Video
              style={styles.image}
              source={{ uri: memory.mediaUri }}
              useNativeControls
              resizeMode="cover"
            />
          )}
          {memory.mediaType === "voice" && (
            <View style={styles.voiceContainer}>
              <Feather name="mic" size={20} color="#EF4444" />
              <Text style={styles.voiceLabel}>Voice note saved</Text>
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.body}>
        <Text style={styles.title}>{memory.title}</Text>
        {memory.caption ? <Text style={styles.caption}>{memory.caption}</Text> : null}

        {memory.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {memory.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Feather name="tag" size={12} color="#F97316" />
                <Text style={styles.tagLabel}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footerRow}>
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.actionBtn, reacted && styles.actionBtnActive]}
              onPress={handleReaction}
            >
            <Feather
              name="heart"
              size={18}
              color={reacted ? "#EF4444" : "#6B7280"}
            />
              <Text style={[styles.actionLabel, reacted && styles.actionLabelActive]}>
                {reactions.length}
              </Text>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => setShowComments((prev) => !prev)}
            >
              <Feather name="message-circle" size={18} color="#6B7280" />
              <Text style={styles.actionLabel}>{comments.length}</Text>
            </Pressable>
          </View>

          <View style={styles.timeRow}>
            <Feather name="clock" size={14} color="#9CA3AF" />
            <Text style={styles.timeLabel}>{createdTime}</Text>
          </View>
        </View>

        {showComments && (
          <View style={styles.commentsContainer}>
            <View style={styles.commentComposer}>
              <View style={[styles.avatar, styles.smallAvatar]}>
                <Text style={styles.avatarLabel}>{currentUser.fullName.charAt(0)}</Text>
              </View>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#9CA3AF"
                value={commentText}
                onChangeText={setCommentText}
                editable={!busy}
                onSubmitEditing={handleComment}
                returnKeyType="send"
              />
              <Pressable
                style={[styles.postBtn, (!commentText.trim() || busy) && styles.postBtnDisabled]}
                disabled={!commentText.trim() || busy}
                onPress={handleComment}
              >
                <Text style={styles.postLabel}>Post</Text>
              </Pressable>
            </View>

            <View style={{ gap: 12 }}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentRow}>
                  <View style={[styles.avatar, styles.tinyAvatar]}>
                    <Text style={styles.avatarLabel}>
                      {comment.authorName?.charAt(0) || "U"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                    <Text style={styles.commentMeta}>
                      {formatDate(comment.createdAt)} at {formatTime(comment.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
              {comments.length === 0 && (
                <Text style={styles.emptyComments}>No comments yet. Be the first!</Text>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(244, 114, 182, 0.2)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FB7185",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  author: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  meta: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  menuBtn: {
    padding: 6,
    borderRadius: 16,
  },
  media: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  voiceContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FDF2F8",
  },
  voiceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#EF4444",
  },
  body: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  caption: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFE4E6",
    borderRadius: 999,
  },
  tagLabel: {
    fontSize: 12,
    color: "#EA580C",
    fontWeight: "500",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F9FAFB",
  },
  actionBtnActive: {
    backgroundColor: "#FEE2E2",
  },
  actionLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  actionLabelActive: {
    color: "#EF4444",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  commentsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(244, 114, 182, 0.2)",
    gap: 16,
  },
  commentComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#111827",
    fontSize: 14,
  },
  postBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FB7185",
    borderRadius: 14,
  },
  postBtnDisabled: {
    backgroundColor: "#F3F4F6",
  },
  postLabel: {
    color: "#fff",
    fontWeight: "600",
  },
  commentRow: {
    flexDirection: "row",
    gap: 12,
  },
  tinyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentBubble: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  commentText: {
    fontSize: 13,
    color: "#4B5563",
  },
  commentMeta: {
    marginTop: 4,
    marginLeft: 8,
    fontSize: 11,
    color: "#9CA3AF",
  },
  emptyComments: {
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});
