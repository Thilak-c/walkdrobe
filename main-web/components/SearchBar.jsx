"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import Link from "next/link";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search products using Convex
  const searchResults = useQuery(
    api.products.searchProducts,
    debouncedQuery.length >= 1 ? { query: debouncedQuery, limit: 8 } : "skip"
  );

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowResults(value.length >= 1);
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page or handle search
      setShowResults(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle result click
  const handleResultClick = () => {
    setShowResults(false);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={searchRef} className="z-50 relative">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative flex items-center border border-white/20 rounded-full px-3 py-1 w-72 bg-white/10 backdrop-blur-sm text-white">
        <input
          ref={inputRef}
          type="text"
          placeholder="What are you looking for?"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            if (searchQuery.length >= 1) {
              setShowResults(true);
            }
          }}
          className="outline-none flex-1 bg-transparent text-sm placeholder-black/60 text-black"
        />
        <button 
          type="submit" 
          className=" absolute right-0 z-50 cursor-pointer"
        >
          <img
            src="/icons/search.png"
            alt="Search"
            width={20}
            height={20}
            className="opacity-70"
          />
        </button>
      </form>

      {/* Search Results Dropdown */}
      {showResults && searchResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((product) => (
                <Link
                  key={product._id}
                  href={`/product/${product.itemId}`}
                  onClick={handleResultClick}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 relative flex-shrink-0">
                    <img
                      src={product.mainImage}
                      alt={product.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {product.category}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{product.price}
                    </p>
                  </div>
                </Link>
              ))}
              
              {/* View All Results Link */}
              {searchResults.length >= 8 && (
                <div className="border-t border-gray-200 pt-2">
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={handleResultClick}
                    className="block w-full text-center py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    View all results for "{searchQuery}"
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 px-3 text-center text-gray-500 text-sm">
              No products found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
