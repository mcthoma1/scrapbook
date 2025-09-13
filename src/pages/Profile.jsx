import React, { useState, useEffect } from "react";
import { User } from "@/entities/all";
import { Camera, Settings, Heart, LogOut } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    family_role: "",
    bio: ""
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        family_role: userData.family_role || "",
        bio: userData.bio || ""
      });
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await User.updateMyUserData(formData);
      await loadUser();
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (!user) {
    return (
      <div className="p-4">
        <div className="max-w-sm mx-auto text-center mt-20">
          <div className="animate-pulse">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 text-center">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 bg-gradient-to-br from-coral-400 to-rose-400 rounded-full flex items-center justify-center mx-auto">
            {user.profile_image ? (
              <img
                src={user.profile_image}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {user.full_name?.charAt(0) || "U"}
              </span>
            )}
          </div>
          <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border border-coral-200">
            <Camera className="w-4 h-4 text-coral-500" />
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Your name"
              className="w-full p-3 border border-coral-200 rounded-xl text-center focus:ring-2 focus:ring-coral-400"
            />
            <input
              type="text"
              value={formData.family_role}
              onChange={(e) => setFormData(prev => ({ ...prev, family_role: e.target.value }))}
              placeholder="Your family role (Mom, Dad, etc.)"
              className="w-full p-3 border border-coral-200 rounded-xl text-center focus:ring-2 focus:ring-coral-400"
            />
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell your family a bit about yourself..."
              rows={3}
              className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 resize-none"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-coral-400 to-rose-400 text-white py-3 rounded-xl font-medium"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              {user.full_name}
            </h2>
            {user.family_role && (
              <p className="text-coral-500 font-medium mb-2">
                {user.family_role}
              </p>
            )}
            {user.bio && (
              <p className="text-gray-600 mb-4 leading-relaxed">
                {user.bio}
              </p>
            )}
            <button
              onClick={() => setEditing(true)}
              className="bg-coral-100 text-coral-600 px-6 py-2 rounded-xl font-medium hover:bg-coral-200 transition-colors"
            >
              Edit Profile
            </button>
          </>
        )}
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-coral-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h3>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">New Memory Notifications</h4>
              <p className="text-sm text-gray-500">Get notified when family adds memories</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={user.notification_preferences?.new_memories !== false}
              className="w-5 h-5 text-coral-500 rounded focus:ring-coral-400"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Comment Notifications</h4>
              <p className="text-sm text-gray-500">Get notified about new comments</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={user.notification_preferences?.new_comments !== false}
              className="w-5 h-5 text-coral-500 rounded focus:ring-coral-400"
            />
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl p-4">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-800">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Member since</span>
            <span className="font-medium text-gray-800">
              {new Date(user.created_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>

      {/* App Info */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-coral-400" />
          <span className="text-sm text-gray-500">Family Memories</span>
        </div>
        <p className="text-xs text-gray-400">
          Capturing precious moments, one memory at a time
        </p>
      </div>
    </div>
  );
}