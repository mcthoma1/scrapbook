import React, { useState, useEffect } from "react";
import { Album, AlbumMembership, User } from "@/entities/all";
import { Plus, Users, Lock, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";

import CreateAlbumModal from "../components/albums/CreateAlbumModal";
import JoinAlbumModal from "../components/albums/JoinAlbumModal";
import EmptyState from "../components/shared/EmptyState";

export default function Albums() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // Get user's album memberships
      const memberships = await AlbumMembership.filter({
        user_email: userData.email
      });
      
      if (memberships.length === 0) {
        setAlbums([]);
        setLoading(false);
        return;
      }

      // Get full album details
      const albumIds = memberships.map(m => m.album_id);
      const allAlbums = await Album.list();
      const userAlbums = allAlbums.filter(album => 
        albumIds.includes(album.id)
      );
      
      // Add role information
      const albumsWithRoles = userAlbums.map(album => ({
        ...album,
        role: memberships.find(m => m.album_id === album.id)?.role || 'member'
      }));
      
      setAlbums(albumsWithRoles);
    } catch (error) {
      console.error("Error loading albums:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-32 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-5 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Albums</h2>
          <p className="text-sage-400">Private spaces for family memories</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-coral-400 to-rose-400 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Create Album
        </button>
        
        <button
          onClick={() => setShowJoinModal(true)}
          className="bg-white text-sage-500 border-2 border-sage-200 p-4 rounded-2xl flex items-center justify-center gap-2 font-semibold hover:border-coral-300 hover:text-coral-500 transition-all duration-200"
        >
          <Users className="w-5 h-5" />
          Join Album
        </button>
      </div>

      {albums.length === 0 ? (
        <EmptyState
          title="No albums yet"
          description="Create your first family album or join an existing one to get started"
          actionText="Create Album"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="space-y-4">
          {albums.map((album, index) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={createPageUrl(`AlbumDetail?id=${album.id}`)}
                className="block"
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-coral-100/50 hover:shadow-lg hover:border-coral-200 transition-all duration-200 transform hover:scale-102">
                  {/* Cover Image */}
                  <div className="h-32 bg-gradient-to-br from-coral-100 to-rose-100 rounded-xl mb-4 flex items-center justify-center">
                    {album.cover_image ? (
                      <img
                        src={album.cover_image}
                        alt={album.title}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="text-center">
                        <Users className="w-10 h-10 text-coral-400 mx-auto mb-2" />
                        <span className="text-coral-400 font-medium">
                          {album.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Album Info */}
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {album.title}
                  </h3>
                  
                  {album.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {album.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-sage-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {album.member_count} members
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      Private
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(album.created_date), 'MMM yyyy')}
                    </div>
                  </div>

                  {/* Role Badge */}
                  {album.role === 'owner' && (
                    <div className="mt-3">
                      <span className="bg-coral-100 text-coral-600 px-3 py-1 rounded-full text-xs font-medium">
                        Owner
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateAlbumModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
          currentUser={user}
        />
      )}

      {showJoinModal && (
        <JoinAlbumModal
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => {
            setShowJoinModal(false);
            loadData();
          }}
          currentUser={user}
        />
      )}
    </div>
  );
}