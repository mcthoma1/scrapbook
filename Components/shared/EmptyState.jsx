import React from "react";
import { Heart, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EmptyState({ 
  title, 
  description, 
  actionText, 
  actionLink,
  onAction 
}) {
  return (
    <div className="text-center py-20">
      <div className="max-w-sm mx-auto">
        <div className="w-20 h-20 bg-gradient-to-br from-coral-100 to-rose-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <Heart className="w-10 h-10 text-coral-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {title}
        </h2>
        <p className="text-sage-400 mb-8 leading-relaxed">
          {description}
        </p>
        {(actionText && (actionLink || onAction)) && (
          onAction ? (
            <button
              onClick={onAction}
              className="bg-gradient-to-r from-coral-400 to-rose-400 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              {actionText}
            </button>
          ) : (
            <Link
              to={createPageUrl(actionLink)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-coral-400 to-rose-400 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              {actionText}
            </Link>
          )
        )}
      </div>
    </div>
  );
}