import React from "react";
import { Heart } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-coral-400 to-rose-400 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <p className="text-sage-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}