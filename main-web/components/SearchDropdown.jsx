"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import Link from "next/link";

export default function SearchDropdown({ searchTerm, isOpen, onClose }) {
  const dropdownRef = useRef(null);
  
  // Search products using the new Convex function
  const searchResults = useQuery(
    api.products.searchProductsForNavbar,
    searchTerm && searchTerm.trim().length >= 2 ? { searchTerm } : "skip"
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !searchTerm || searchTerm.trim().length < 2) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 z-50 max-h-96 overflow-y-auto"
    >
      {searchResults === undefined ? (
        // Loading state
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Searching...</p>
        </div>
      ) : searchResults.length === 0 ? (
        // No results
        <div className="p-4 text-center">
          <p className="text-gray-600">No products found for "{searchTerm}"</p>
        </div>
      ) : (
        // Search results
        <div className="py-2">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </div>
          {searchResults.map((product) => (
            <Link
              key={product._id}
              href={`/product/${product._id}`}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors border-b border-gray-100 last:border-b-0"
            >
              {/* Product Image */}
              <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={product.mainImage}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-product.png';
                  }}
                />
              </div>
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-black text-sm truncate">
                  {product.name}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                  {product.category} • ₹{product.price.toLocaleString()}
                </p>
                {product.description && (
                  <p className="text-xs text-gray-400 truncate mt-1">
                    {product.description}
                  </p>
                )}
              </div>
              
              {/* Arrow Icon */}
              <div className="text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
          
          {/* View All Results Link */}
          {searchResults.length >= 8 && (
            <div className="border-t border-gray-200 p-3">
              <Link
                href={`/search?q=${encodeURIComponent(searchTerm)}`}
                onClick={onClose}
                className="block w-full text-center py-2 px-4 bg-black text-white rounded-lg hover:bg-black/80 transition-colors text-sm font-medium"
              >
                View All Results
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
