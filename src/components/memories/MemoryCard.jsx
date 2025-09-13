
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Comment, Reaction, Memory } from "@/entities/all";
import { Heart, MessageCircle, Calendar, Tag, MoreVertical, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MemoryCard({ memory, currentUser, onUpdate }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [reactions, setReactions] = useState([]);
  const [hasReacted, setHasReacted] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadEngagement = useCallback(async () => {
    try {
      const [commentsData, reactionsData] = await Promise.all([
        Comment.filter({ memory_id: memory.id }, "-created_date"),
        Reaction.filter({ memory_id: memory.id })
      ]);
      
      setComments(commentsData);
      setReactions(reactionsData);
      setHasReacted(reactionsData.some(r => r.author_email === currentUser.email));
    } catch (error) {
      console.error("Error loading engagement:", error);
    }
  }, [memory.id, currentUser.email]);

  useEffect(() => {
    loadEngagement();
  }, [loadEngagement]);

  const handleReaction = async () => {
    setLoading(true);
    try {
      if (hasReacted) {
        // Remove reaction
        const userReaction = reactions.find(r => r.author_email === currentUser.email);
        if (userReaction) {
          await Reaction.delete(userReaction.id);
        }
      } else {
        // Add reaction
        await Reaction.create({
          memory_id: memory.id,
          reaction_type: "heart",
          author_name: currentUser.full_name,
          author_email: currentUser.email
        });
      }
      
      // Update memory reaction count
      const newCount = hasReacted ? memory.reaction_count - 1 : memory.reaction_count + 1;
      await Memory.update(memory.id, { reaction_count: newCount });
      
      loadEngagement();
      onUpdate();
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
    setLoading(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      await Comment.create({
        memory_id: memory.id,
        text: newComment,
        author_name: currentUser.full_name,
        author_email: currentUser.email
      });
      
      // Update memory comment count
      await Memory.update(memory.id, { comment_count: memory.comment_count + 1 });
      
      setNewComment("");
      loadEngagement();
      onUpdate();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this memory forever?")) {
      try {
        setLoading(true);
        await Memory.delete(memory.id);
        onUpdate();
      } catch (error) {
        console.error("Error deleting memory:", error);
      }
      setLoading(false);
    }
  };

  const isAuthor = currentUser.email === memory.author_email;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-coral-100/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-coral-400 to-rose-400 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {memory.author_name?.charAt(0) || "M"}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{memory.author_name}</h3>
            <p className="text-xs text-sage-400">
              {memory.album_title} • {format(new Date(memory.memory_date), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-gray-50 rounded-full">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={createPageUrl(`EditMemory?id=${memory.id}`)} className="flex items-center gap-2 cursor-pointer">
                  <Edit className="w-4 h-4" />
                  <span>Edit Memory</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="flex items-center gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Memory</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Media */}
      {memory.media_url && memory.media_type !== "text" && (
        <div className="relative">
          {memory.media_type === "photo" && (
            <img
              src={memory.media_url}
              alt={memory.title}
              className="w-full aspect-square object-cover"
            />
          )}
          {memory.media_type === "video" && (
            <video
              src={memory.media_url}
              className="w-full aspect-square object-cover"
              controls
              preload="metadata"
            />
          )}
          {memory.media_type === "voice" && (
            <div className="p-8 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <audio src={memory.media_url} controls className="w-full max-w-xs" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-2">{memory.title}</h2>
        
        {memory.caption && (
          <p className="text-gray-700 mb-3 leading-relaxed">{memory.caption}</p>
        )}

        {memory.tags && memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {memory.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-coral-100 text-coral-600 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Engagement */}
        <div className="flex items-center justify-between pt-3 border-t border-coral-100/50">
          <div className="flex items-center gap-4">
            <button
              onClick={handleReaction}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ${
                hasReacted
                  ? "bg-red-50 text-red-500"
                  : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              <Heart className={`w-5 h-5 ${hasReacted ? "fill-current" : ""}`} />
              <span className="text-sm font-medium">{reactions.length}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{comments.length}</span>
            </button>
          </div>

          <div className="text-xs text-sage-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(memory.created_date), "h:mm a")}
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-coral-100/50">
            {/* Comment Form */}
            <form onSubmit={handleComment} className="flex gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-coral-400 to-rose-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-xs">
                  {currentUser.full_name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 p-2 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent text-sm"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="bg-coral-400 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-coral-500 transition-colors"
                >
                  Post
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-sage-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sage-600 font-semibold text-xs">
                      {comment.author_name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        {comment.author_name}
                      </p>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                    <p className="text-xs text-sage-400 mt-1 ml-3">
                      {format(new Date(comment.created_date), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
