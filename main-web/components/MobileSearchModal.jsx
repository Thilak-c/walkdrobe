"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import Link from "next/link";
import { X, Search } from "lucide-react";

export default function MobileSearchModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Search products using the Convex function
  const searchResults = useQuery(
    api.products.searchProductsForNavbar,
    searchTerm && searchTerm.trim().length >= 2 ? { searchTerm } : "skip"
  );

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearching(value.trim().length >= 2);
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchTerm.trim())}`;
    }
  };

  // Handle result click
  const handleResultClick = () => {
    onClose();
    setSearchTerm("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="fixed inset-x-0 top-0 bg-white rounded-b-3xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={inputRef}
                type="text"
                placeholder="What are you looking for?"
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full text-black placeholder-gray-500 outline-none focus:bg-white focus:ring-2 focus:ring-black/20 transition-all"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!isSearching ? (
            // Initial state - show suggestions or recent searches
            <div className="p-4">
              <div className="space-y-2">
                <div className="text-gray-500 text-sm text-center">
                  Start typing to search for products...
                </div>
              </div>
            </div>
          ) : searchResults === undefined ? (
            // Loading state
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
              <p className="text-gray-600 mt-2">Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            // No results
            <div className="p-4 text-center">
              <div className="text-gray-400 mb-2">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600 mb-2">No products found for "{searchTerm}"</p>
              <p className="text-sm text-gray-500">Try different keywords or check spelling</p>
            </div>
          ) : (
            // Search results
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </h3>
                <Link
                  href={`/search?q=${encodeURIComponent(searchTerm)}`}
                  onClick={handleResultClick}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All
                </Link>
              </div>
              
              <div className="space-y-3">
                {searchResults.map((product) => (
                  <Link
                    key={product._id}
                    href={`/product/${product.itemId}`}
                    onClick={handleResultClick}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.png';
                        }}
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500 mb-1">
                        {product.category}
                      </p>
                      <p className="text-sm font-semibold text-black">
                        ₹{product.price.toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Arrow Icon */}
                    <div className="text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
