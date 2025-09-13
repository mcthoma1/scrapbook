
import React, { useState, useEffect, useCallback } from "react";
import { Album, Memory, AlbumMembership, User } from "@/entities/all";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Users,
  Calendar,
  Share2,
  Copy,
  Plus,
  Lock,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

import MemoryCard from "../components/memories/MemoryCard";
import EmptyState from "../components/shared/EmptyState";
import LoadingSpinner from "../components/shared/LoadingSpinner";

export default function AlbumDetail() {
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [memories, setMemories] = useState([]);
  const [members, setMembers] = useState([]);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadAlbumData = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');

    if (!albumId) {
      navigate(createPageUrl("Albums"));
      return;
    }

    try {
      const userData = await User.me();
      setUser(userData);

      // Load album details
      const albums = await Album.list();
      const albumData = albums.find(a => a.id === albumId);

      if (!albumData) {
        navigate(createPageUrl("Albums"));
        return;
      }

      // Check if user is a member
      const memberships = await AlbumMembership.filter({ album_id: albumId });
      const userMembership = memberships.find(m => m.user_email === userData.email);

      if (!userMembership) {
        navigate(createPageUrl("Albums"));
        return;
      }

      setAlbum(albumData);
      setUserRole(userMembership.role);
      setMembers(memberships);

      // Load memories for this album
      const allMemories = await Memory.list("-created_date");
      const albumMemories = allMemories.filter(memory => memory.album_id === albumId);
      setMemories(albumMemories);

    } catch (error) {
      console.error("Error loading album data:", error);
    }
    setLoading(false);
  }, [navigate]); // Added navigate to useCallback dependencies

  useEffect(() => {
    loadAlbumData();
  }, [loadAlbumData]); // Added loadAlbumData to useEffect dependencies

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(album.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const handleCreateMemory = () => {
    navigate(createPageUrl("CreateMemory"));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!album) {
    return (
      <div className="p-4 text-center mt-20">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Album not found</h2>
        <button
          onClick={() => navigate(createPageUrl("Albums"))}
          className="bg-coral-400 text-white px-6 py-3 rounded-xl"
        >
          Back to Albums
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-coral-200/30 sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(createPageUrl("Albums"))}
              className="p-2 hover:bg-coral-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800">{album.title}</h1>
              <p className="text-sage-400 text-sm">
                {memories.length} {memories.length === 1 ? 'memory' : 'memories'} • {members.length} {members.length === 1 ? 'member' : 'members'}
              </p>
            </div>
            {userRole === 'owner' && (
              <button className="p-2 hover:bg-coral-50 rounded-xl transition-colors">
                <Settings className="w-6 h-6 text-sage-400" />
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCreateMemory}
              className="flex-1 bg-gradient-to-r from-coral-400 to-rose-400 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Add Memory
            </button>

            <button
              onClick={() => setShowInviteCode(!showInviteCode)}
              className="bg-white text-sage-500 border-2 border-sage-200 px-4 py-3 rounded-xl flex items-center gap-2 font-semibold hover:border-coral-300 hover:text-coral-500 transition-all duration-200"
            >
              <Share2 className="w-5 h-5" />
              Invite
            </button>
          </div>

          {/* Invite Code Section */}
          {showInviteCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-coral-50 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-coral-500" />
                <span className="text-sm font-medium text-coral-700">Album Invite Code</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white rounded-lg p-3 border border-coral-200">
                  <code className="font-mono text-lg font-bold text-gray-800 tracking-widest">
                    {album.invite_code}
                  </code>
                </div>
                <button
                  onClick={copyInviteCode}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    copiedCode
                      ? "bg-green-100 text-green-600"
                      : "bg-coral-100 text-coral-600 hover:bg-coral-200"
                  }`}
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-coral-600 mt-2">
                Share this code with family members so they can join your album
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Album Info */}
        {album.description && (
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-coral-100/50">
            <p className="text-gray-700 leading-relaxed">{album.description}</p>
            <div className="flex items-center gap-4 text-sm text-sage-400 mt-3 pt-3 border-t border-coral-100/50">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created {format(new Date(album.created_date), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                By {album.created_by_name}
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-coral-100/50">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Album Members ({members.length})
          </h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-coral-400 to-rose-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {member.user_name?.charAt(0) || "M"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{member.user_name}</p>
                    <p className="text-xs text-sage-400">
                      Joined {format(new Date(member.joined_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {member.role === 'owner' && (
                  <span className="bg-coral-100 text-coral-600 px-2 py-1 rounded-full text-xs font-medium">
                    Owner
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Memories Section */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Album Memories
          </h3>

          {memories.length === 0 ? (
            <EmptyState
              title="No memories yet"
              description={`Be the first to add a memory to ${album.title}!`}
              actionText="Add First Memory"
              onAction={handleCreateMemory}
            />
          ) : (
            <div className="space-y-6">
              {memories.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MemoryCard
                    memory={memory}
                    currentUser={user}
                    onUpdate={loadAlbumData}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
