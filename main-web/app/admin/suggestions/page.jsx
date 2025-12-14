"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Calendar, Trash2, RefreshCw } from "lucide-react";

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/suggest");
      const data = await response.json();
      
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
      setError(null);
    } catch (err) {
      setError("Failed to load suggestions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light text-gray-900 mb-2">
              User Suggestions
            </h1>
            <p className="text-sm font-light text-gray-600">
              {suggestions.length} total suggestions
            </p>
          </div>
          
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && suggestions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-light text-gray-600">Loading suggestions...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-light text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && suggestions.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-base font-light text-gray-600 mb-2">
              No suggestions yet
            </p>
            <p className="text-xs font-light text-gray-500">
              User suggestions will appear here
            </p>
          </div>
        )}

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-light text-gray-900 leading-relaxed mb-3">
                      {suggestion.text}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs font-light text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(suggestion.ts)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-light text-gray-400">
                      #{suggestions.length - index}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
