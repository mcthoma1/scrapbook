import React, { useState } from "react";
import { Album, AlbumMembership } from "@/entities/all";
import { X, Users, AlertCircle } from "lucide-react";

export default function JoinAlbumModal({ onClose, onSuccess, currentUser }) {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError("");
    
    try {
      // Find album by invite code
      const albums = await Album.filter({ invite_code: inviteCode.toUpperCase() });
      
      if (albums.length === 0) {
        setError("Invalid invite code. Please check and try again.");
        setLoading(false);
        return;
      }

      const album = albums[0];

      // Check if already a member
      const existingMembership = await AlbumMembership.filter({
        album_id: album.id,
        user_email: currentUser.email
      });

      if (existingMembership.length > 0) {
        setError("You're already a member of this album!");
        setLoading(false);
        return;
      }

      // Add user as member
      await AlbumMembership.create({
        album_id: album.id,
        album_title: album.title,
        user_email: currentUser.email,
        user_name: currentUser.full_name,
        role: "member",
        joined_date: new Date().toISOString().split('T')[0]
      });

      // Update album member count
      await Album.update(album.id, {
        member_count: album.member_count + 1
      });

      onSuccess();
    } catch (error) {
      console.error("Error joining album:", error);
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Join Album</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setError("");
              }}
              placeholder="Enter 6-character code"
              className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent uppercase text-center font-mono text-lg tracking-widest"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-coral-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-coral-500" />
              <span className="text-sm font-medium text-coral-700">How it works</span>
            </div>
            <p className="text-xs text-coral-600 leading-relaxed">
              Ask a family member for their album's invite code. Once you join, you can view and add memories to their album.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="flex-1 bg-gradient-to-r from-coral-400 to-rose-400 text-white py-3 rounded-xl font-medium disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? "Joining..." : "Join Album"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}