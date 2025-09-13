import React, { useState, useEffect } from "react";
import { Memory, AlbumMembership, User } from "@/entities/all";
import { Heart, MessageCircle, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

import MemoryCard from "../components/memories/MemoryCard";
import EmptyState from "../components/shared/EmptyState";

export default function Home() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

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
        setMemories([]);
        setLoading(false);
        return;
      }

      // Get memories from all user's albums
      const albumIds = memberships.map(m => m.album_id);
      const allMemories = await Memory.list("-created_date");
      
      // Filter memories that belong to user's albums
      const userMemories = allMemories.filter(memory => 
        albumIds.includes(memory.album_id)
      );
      
      setMemories(userMemories);
    } catch (error) {
      console.error("Error loading memories:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="h-64 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <EmptyState
        title="No memories yet"
        description="Join an album or create your first memory to get started"
        actionText="Create Memory"
        actionLink="CreateMemory"
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Recent Memories</h2>
        <p className="text-sage-400">Catch up on your family's latest moments</p>
      </div>

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
              onUpdate={loadData}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}