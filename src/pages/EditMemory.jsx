import React, { useState, useEffect, useCallback } from "react";
import { Memory } from "@/entities/all";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import LoadingSpinner from "../components/shared/LoadingSpinner";

export default function EditMemory() {
  const navigate = useNavigate();
  const [memory, setMemory] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    memory_date: "",
    tags: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memoryId, setMemoryId] = useState(null);

  const loadMemory = useCallback(async (id) => {
    try {
      const memories = await Memory.list();
      const memoryData = memories.find(m => m.id === id);
      
      if (memoryData) {
        setMemory(memoryData);
        setFormData({
          title: memoryData.title,
          caption: memoryData.caption || "",
          memory_date: memoryData.memory_date,
          tags: memoryData.tags || []
        });
      } else {
        navigate(createPageUrl("Home"));
      }
    } catch (error) {
      console.error("Error loading memory:", error);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    setMemoryId(id);

    if (id) {
      loadMemory(id);
    } else {
      navigate(createPageUrl("Home"));
    }
  }, [navigate, loadMemory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Memory.update(memoryId, formData);
      navigate(createPageUrl(`AlbumDetail?id=${memory.album_id}`));
    } catch (error) {
      console.error("Error updating memory:", error);
    }
    setSaving(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!memory) {
    return (
      <div className="p-4 text-center mt-20">
        <h2 className="text-xl font-bold text-gray-800">Memory not found</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-coral-200/30 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(createPageUrl(`AlbumDetail?id=${memory.album_id}`))}
            className="p-2 hover:bg-coral-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Edit Memory</h1>
            <p className="text-sage-400 text-sm">Fine-tune your precious moment</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Memory Preview */}
          {memory.media_url && memory.media_type !== "text" && (
            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Original Media</h3>
              {memory.media_type === "photo" && (
                <img src={memory.media_url} alt="Memory preview" className="w-full h-48 object-cover rounded-xl" />
              )}
              {memory.media_type === "video" && (
                <video src={memory.media_url} className="w-full h-48 object-cover rounded-xl" controls />
              )}
              {memory.media_type === "voice" && (
                <audio src={memory.media_url} controls className="w-full" />
              )}
              <p className="text-xs text-gray-400 mt-2 text-center">Media content cannot be changed.</p>
            </div>
          )}

          {/* Title */}
          <div className="bg-white rounded-2xl p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent"
              required
            />
          </div>

          {/* Caption */}
          <div className="bg-white rounded-2xl p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
            <textarea
              value={formData.caption}
              onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
              rows={4}
              className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent resize-none"
            />
          </div>

          {/* Date */}
          <div className="bg-white rounded-2xl p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" /> Date
            </label>
            <input
              type="date"
              value={formData.memory_date}
              onChange={(e) => setFormData(prev => ({ ...prev, memory_date: e.target.value }))}
              className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" /> Tags
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                setFormData(prev => ({ ...prev, tags }));
              }}
              placeholder="family, vacation, birthday"
              className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-coral-400 to-rose-400 text-white py-4 rounded-2xl font-semibold disabled:opacity-50 shadow-lg"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}