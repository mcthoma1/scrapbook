import React, { useState, useEffect } from "react";
import { Memory, Album, AlbumMembership, User } from "@/entities/all";
import { UploadFile } from "@/integrations/Core";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Camera, 
  Image as ImageIcon, 
  FileText, 
  Mic, 
  Calendar,
  Tag,
  MapPin,
  ArrowLeft
} from "lucide-react";

import MediaCapture from "../components/create/MediaCapture";
import AlbumSelector from "../components/create/AlbumSelector";
import LoadingSpinner from "../components/shared/LoadingSpinner";

export default function CreateMemory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [step, setStep] = useState(1); // 1: Select Type, 2: Capture/Upload, 3: Add Details
  const [memoryData, setMemoryData] = useState({
    title: "",
    caption: "",
    album_id: "",
    memory_date: new Date().toISOString().split('T')[0],
    media_type: "",
    media_url: "",
    tags: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // Get user's albums
      const memberships = await AlbumMembership.filter({
        user_email: userData.email
      });
      
      const albumIds = memberships.map(m => m.album_id);
      const allAlbums = await Album.list();
      const userAlbums = allAlbums.filter(album => 
        albumIds.includes(album.id)
      );
      
      setAlbums(userAlbums);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleMediaCapture = async (mediaFile, mediaType) => {
    setLoading(true);
    try {
      const { file_url } = await UploadFile({ file: mediaFile });
      setMemoryData(prev => ({
        ...prev,
        media_type: mediaType,
        media_url: file_url
      }));
      setStep(3);
    } catch (error) {
      console.error("Error uploading media:", error);
    }
    setLoading(false);
  };

  const handleTextMemory = () => {
    setMemoryData(prev => ({
      ...prev,
      media_type: "text"
    }));
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memoryData.album_id || !memoryData.title) return;
    
    setLoading(true);
    try {
      const selectedAlbum = albums.find(a => a.id === memoryData.album_id);
      
      await Memory.create({
        ...memoryData,
        album_title: selectedAlbum.title,
        author_name: user.full_name
      });
      
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error creating memory:", error);
    }
    setLoading(false);
  };

  if (loading && step !== 2) {
    return <LoadingSpinner />;
  }

  if (albums.length === 0) {
    return (
      <div className="p-4 text-center mt-20">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-coral-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <ImageIcon className="w-8 h-8 text-coral-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Create an Album First
          </h2>
          <p className="text-sage-400 mb-6 leading-relaxed">
            You need to be part of an album to create memories. Create one or ask for an invite!
          </p>
          <button
            onClick={() => navigate(createPageUrl("Albums"))}
            className="bg-gradient-to-r from-coral-400 to-rose-400 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg"
          >
            Go to Albums
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-coral-200/30 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate(createPageUrl("Home"))}
            className="p-2 hover:bg-coral-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Create Memory</h1>
            <p className="text-sage-400 text-sm">
              Step {step} of 3
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Step 1: Select Memory Type */}
        {step === 1 && (
          <div className="space-y-6 mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                What kind of memory?
              </h2>
              <p className="text-sage-400">
                Choose how you'd like to capture this moment
              </p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => setStep(2)}
                className="bg-white p-6 rounded-2xl border border-coral-100 hover:border-coral-300 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-coral-100 rounded-xl flex items-center justify-center">
                    <Camera className="w-6 h-6 text-coral-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">Photo or Video</h3>
                    <p className="text-sage-400 text-sm">Capture a visual moment</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleTextMemory}
                className="bg-white p-6 rounded-2xl border border-coral-100 hover:border-coral-300 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-sage-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">Text Story</h3>
                    <p className="text-sage-400 text-sm">Write about a memory</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStep(2)}
                className="bg-white p-6 rounded-2xl border border-coral-100 hover:border-coral-300 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Mic className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">Voice Note</h3>
                    <p className="text-sage-400 text-sm">Record your thoughts</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Media Capture */}
        {step === 2 && (
          <MediaCapture
            memoryType={memoryData.media_type}
            onCapture={handleMediaCapture}
            loading={loading}
          />
        )}

        {/* Step 3: Add Details */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Album Selection */}
            <AlbumSelector
              albums={albums}
              selectedAlbum={memoryData.album_id}
              onSelect={(albumId) => setMemoryData(prev => ({ ...prev, album_id: albumId }))}
            />

            {/* Memory Preview */}
            {memoryData.media_url && memoryData.media_type !== "text" && (
              <div className="bg-white rounded-2xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Preview</h3>
                {memoryData.media_type === "photo" && (
                  <img 
                    src={memoryData.media_url} 
                    alt="Memory preview" 
                    className="w-full h-48 object-cover rounded-xl"
                  />
                )}
                {memoryData.media_type === "video" && (
                  <video 
                    src={memoryData.media_url} 
                    className="w-full h-48 object-cover rounded-xl" 
                    controls
                  />
                )}
                {memoryData.media_type === "voice" && (
                  <audio src={memoryData.media_url} controls className="w-full" />
                )}
              </div>
            )}

            {/* Title */}
            <div className="bg-white rounded-2xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={memoryData.title}
                onChange={(e) => setMemoryData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Give this memory a title..."
                className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent"
                required
              />
            </div>

            {/* Caption */}
            <div className="bg-white rounded-2xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caption
              </label>
              <textarea
                value={memoryData.caption}
                onChange={(e) => setMemoryData(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="Tell the story behind this memory..."
                rows={4}
                className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent resize-none"
              />
            </div>

            {/* Date */}
            <div className="bg-white rounded-2xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                When did this happen?
              </label>
              <input
                type="date"
                value={memoryData.memory_date}
                onChange={(e) => setMemoryData(prev => ({ ...prev, memory_date: e.target.value }))}
                className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent"
              />
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags (optional)
              </label>
              <input
                type="text"
                placeholder="family, vacation, birthday (comma separated)"
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                  setMemoryData(prev => ({ ...prev, tags }));
                }}
                className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !memoryData.album_id || !memoryData.title}
              className="w-full bg-gradient-to-r from-coral-400 to-rose-400 text-white py-4 rounded-2xl font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {loading ? "Creating Memory..." : "Share Memory"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}