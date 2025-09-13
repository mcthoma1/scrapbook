import React from "react";
import { Users, ChevronDown } from "lucide-react";

export default function AlbumSelector({ albums, selectedAlbum, onSelect }) {
  const selectedAlbumData = albums.find(a => a.id === selectedAlbum);

  return (
    <div className="bg-white rounded-2xl p-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Choose Album *
      </label>
      
      <div className="relative">
        <select
          value={selectedAlbum}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full p-3 border border-coral-200 rounded-xl focus:ring-2 focus:ring-coral-400 focus:border-transparent appearance-none bg-white"
          required
        >
          <option value="">Select an album...</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {selectedAlbumData && (
        <div className="mt-3 p-3 bg-coral-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-coral-500" />
            <span className="text-sm font-medium text-coral-700">
              {selectedAlbumData.title}
            </span>
          </div>
          {selectedAlbumData.description && (
            <p className="text-xs text-coral-600 mt-1">
              {selectedAlbumData.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}