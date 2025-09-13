import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/all";
import { 
  Home, 
  FolderHeart, 
  Plus, 
  Settings,
  Heart,
  MessageCircle
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      // User not logged in
    }
  };

  const navigationItems = [
    {
      title: "Home",
      url: createPageUrl("Home"),
      icon: Home,
    },
    {
      title: "Albums",
      url: createPageUrl("Albums"),
      icon: FolderHeart,
    },
    {
      title: "Create",
      url: createPageUrl("CreateMemory"),
      icon: Plus,
      isCreate: true,
    },
    {
      title: "Profile",
      url: createPageUrl("Profile"),
      icon: Settings,
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gradient-to-br from-coral-400 to-rose-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Family Memories
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Create beautiful private albums to capture and share your family's precious moments
            </p>
            <button
              onClick={() => User.login()}
              className="bg-gradient-to-r from-coral-400 to-rose-400 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      <style>{`
        :root {
          --coral-50: #fef7f0;
          --coral-100: #fdeee5;
          --coral-200: #fbd5c2;
          --coral-300: #f8bc9e;
          --coral-400: #f59e72;
          --coral-500: #f28055;
          --sage-50: #f6f7f3;
          --sage-100: #e8eae3;
          --sage-200: #d1d5c7;
          --sage-300: #a8b299;
          --sage-400: #8a9478;
          --sage-500: #6b7560;
        }
        
        .coral-50 { background-color: var(--coral-50); }
        .coral-100 { background-color: var(--coral-100); }
        .coral-200 { background-color: var(--coral-200); }
        .coral-300 { background-color: var(--coral-300); }
        .coral-400 { background-color: var(--coral-400); }
        .coral-500 { background-color: var(--coral-500); }
        
        .text-coral-400 { color: var(--coral-400); }
        .text-coral-500 { color: var(--coral-500); }
        .border-coral-400 { border-color: var(--coral-400); }
        
        .sage-50 { background-color: var(--sage-50); }
        .sage-100 { background-color: var(--sage-100); }
        .sage-200 { background-color: var(--sage-200); }
        .sage-300 { background-color: var(--sage-300); }
        .sage-400 { background-color: var(--sage-400); }
        
        .text-sage-400 { color: var(--sage-400); }
        .text-sage-500 { color: var(--sage-500); }
        .border-sage-400 { border-color: var(--sage-400); }
      `}</style>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-coral-200/30 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-coral-400 to-rose-400 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Family Memories</h1>
            </Link>
            
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-sage-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto min-h-[calc(100vh-140px)] pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-coral-200/30">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-around">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                    item.isCreate
                      ? "bg-gradient-to-br from-coral-400 to-rose-400 text-white shadow-lg transform hover:scale-105"
                      : isActive
                      ? "text-coral-500 bg-coral-50"
                      : "text-sage-400 hover:text-coral-400"
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${item.isCreate ? "" : "mb-1"}`} />
                  {!item.isCreate && (
                    <span className="text-xs font-medium">{item.title}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}