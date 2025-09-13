import React, { useState } from "react";
import { Album, AlbumMembership } from "@/entities/all";
import { X, Users, Lock } from "lucide-react";

export default function CreateAlbumModal({ onClose, onSuccess, currentUser }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cover_image: ""
  });
  const [loading, setLoading] = useState(false);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const inviteCode = generateInviteCode();
      
      // Create album
      const album = await Album.create({
        ...formData,
        invite_code: inviteCode,
        is_private: true,
        created_by_name: currentUser.full_name,
        member_count: 1
      });

      // Add creator as owner
      await AlbumMembership.create({
        album_id: album.id,
        album_title: formData.title,
        user_email: currentUser.email,
        user_name: currentUser.full_name,
        role: "owner",
        joined_date: new Date().toISOString().split('T')[0]
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating album:", error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Create New Album</h2>
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
              Album Name *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Family Vacation 2024"
              className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="A special place for our family memories..."
              rows={3}
              className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-sage-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-sage-500" />
              <span className="text-sm font-medium text-sage-700">Privacy</span>
            </div>
            <p className="text-xs text-sage-600 leading-relaxed">
              Your album will be private by default. Only people with your invite code can join.
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
              disabled={loading || !formData.title.trim()}
              className="flex-1 bg-gradient-to-r from-coral-400 to-rose-400 text-white py-3 rounded-xl font-medium disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? "Creating..." : "Create Album"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}