"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  X, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Star,
  TrendingUp,
  Clock,
  Tag
} from "lucide-react";

export default function EnhancedSearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    priceMin: "",
    priceMax: "",
    inStock: undefined,
    sortBy: "relevance"
  });
  const [searchHistory, setSearchHistory] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // Search products using Convex with enhanced filters
  const searchResults = useQuery(
    api.products.searchProducts,
    debouncedQuery.length >= 2 ? { 
      query: debouncedQuery, 
      limit: 12,
      category: filters.category || undefined,
      priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
      priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
      sortBy: filters.sortBy,
      inStock: filters.inStock
    } : "skip"
  );

  // Get categories for filter dropdown
  const categories = useQuery(api.products.getProductCategories);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }
  }, []);

  // Save search to history
  const saveSearchToHistory = useCallback((query) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 20);
    setSearchHistory(newHistory);
    setRecentSearches(newHistory.slice(0, 5));
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  }, [searchHistory]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowResults(value.length >= 2);
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveSearchToHistory(searchQuery);
      setShowResults(false);
      setIsOpen(false);
      // Navigate to search results page
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      if (filters.category) params.set('category', filters.category);
      if (filters.priceMin) params.set('priceMin', filters.priceMin);
      if (filters.priceMax) params.set('priceMax', filters.priceMax);
      if (filters.inStock !== undefined) params.set('inStock', filters.inStock);
      if (filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy);
      
      window.location.href = `/search?${params.toString()}`;
    }
  };

  // Handle quick search from history
  const handleQuickSearch = (query) => {
    setSearchQuery(query);
    saveSearchToHistory(query);
    setShowResults(false);
    setIsOpen(false);
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
        setIsOpen(false);
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle result click
  const handleResultClick = (product) => {
    setShowResults(false);
    setIsOpen(false);
    setSearchQuery("");
    // Track search result click
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setShowResults(false);
    inputRef.current?.focus();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      category: "",
      priceMin: "",
      priceMax: "",
      inStock: undefined,
      sortBy: "relevance"
    });
  };

  // Get sort icon
  const getSortIcon = (sortBy) => {
    switch (sortBy) {
      case "price-low":
        return <SortAsc className="w-4 h-4" />;
      case "price-high":
        return <SortDesc className="w-4 h-4" />;
      case "newest":
        return <Clock className="w-4 h-4" />;
      case "popular":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center border border-white/20 rounded-full px-4 py-2 w-full bg-white/10 backdrop-blur-sm text-white">
          <Search className="w-5 h-5 text-black/60 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for products, brands, categories..."
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              setIsOpen(true);
              if (searchQuery.length >= 2) {
                setShowResults(true);
              }
            }}
            className="outline-none flex-1 bg-transparent text-sm placeholder-black/60 text-black"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-black/60" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <Filter className="w-4 h-4 text-black/60" />
          </button>
          <button 
            type="submit" 
            className="ml-2 p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
          >
            <Search className="w-4 h-4 text-black/60" />
          </button>
        </div>
      </form>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories?.map(cat => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Stock Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select
                  value={filters.inStock === undefined ? "" : filters.inStock ? "inStock" : "outOfStock"}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    inStock: e.target.value === "" ? undefined : e.target.value === "inStock"
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">All Products</option>
                  <option value="inStock">In Stock</option>
                  <option value="outOfStock">Out of Stock</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Filters
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto"
          >
            {searchResults === undefined ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-2 text-sm">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {/* Search Results */}
                {searchResults.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={`/product/${product.itemId}`}
                      onClick={() => handleResultClick(product)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-12 h-12 relative flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={product.mainImage}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {product.category}
                          </span>
                          {product.buys && product.buys > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-500">{product.buys} sold</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          ₹{product.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        {getSortIcon(filters.sortBy)}
                      </div>
                    </Link>
                  </motion.div>
                ))}
                
                {/* View All Results Link */}
                <div className="border-t border-gray-200 pt-2">
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setShowResults(false)}
                    className="block w-full text-center py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                  >
                    View all results for "{searchQuery}" ({searchResults.length}+)
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-4 px-3 text-center text-gray-500 text-sm">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No products found for "{searchQuery}"</p>
                <p className="text-xs text-gray-400 mt-1">Try different keywords or check your spelling</p>
              </div>
            )}

            {/* Recent Searches */}
            {!searchQuery && recentSearches.length > 0 && (
              <div className="border-t border-gray-200 pt-2">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(search)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    {search}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
