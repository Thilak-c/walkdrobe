"use client";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import CustomDropdown from "@/components/CustomDropdown";
import { motion } from "framer-motion";
import { Search, Filter, X, Loader2 } from "lucide-react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(query);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    subcategory: searchParams.get("subcategory") || "",
    sortBy: searchParams.get("sortBy") || "relevance",
  });

  // Get search results
  const searchResults = useQuery(
    api.products.searchProducts,
    searchQuery.length >= 2
      ? {
        query: searchQuery,
        limit: 50,
        sortBy: filters.sortBy,
      }
      : "skip"
  );

  // Filter results by subcategory on the client side
  const filteredResults = searchResults?.filter(product =>
    !filters.subcategory || product.subcategories === filters.subcategory
  );

  // Get all subcategories for filter
  const allProducts = useQuery(api.products.getAllProducts, { limit: 1000 });
  const subcategories = allProducts
    ?.map(p => p.subcategories)
    ?.filter(Boolean)
    ?.filter((v, i, a) => a.indexOf(v) === i) || [];

  // Update search query when URL changes
  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  const handleClickProduct = (productId) => {
    router.push(`/product/${productId}`);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);

    // Update URL
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "") {
      newParams.set(filterType, value);
    } else {
      newParams.delete(filterType);
    }
    window.history.replaceState({}, "", `${window.location.pathname}?${newParams.toString()}`);
  };

  const clearFilters = () => {
    setFilters({ subcategory: "", sortBy: "relevance" });
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("subcategory");
    newParams.delete("sortBy");
    window.history.replaceState({}, "", `${window.location.pathname}?${newParams.toString()}`);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-[#fff]">
      {/* Navbar */}
      <div className="xl:block hidden h-[80px] xl:h-[100px]"></div>
      <div className="xl:hidden mb-14">
        <NavbarMobile />
      </div>
      <div className="hidden xl:block">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="md:max-w-[74%] mx-auto px-4 lg:px-8 py-8">
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {searchQuery ? `Search Results for "${searchQuery}"` : "Search Products"}
          </h1>
          {filteredResults && (
            <p className="text-gray-600 text-sm md:text-base">
              {filteredResults.length} {filteredResults.length === 1 ? "product" : "products"} found
            </p>
          )}
        </motion.div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </button>

          {/* Active Filters */}
          {filters.subcategory && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-full text-sm">
              <span>{filters.subcategory}</span>
              <button
                onClick={() => handleFilterChange("subcategory", "")}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {filters.sortBy !== "relevance" && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-full text-sm">
              <span>
                {filters.sortBy === "price_asc"
                  ? "Price: Low to High"
                  : filters.sortBy === "price_desc"
                    ? "Price: High to Low"
                    : filters.sortBy === "newest"
                      ? "Newest First"
                      : "Most Popular"}
              </span>
              <button
                onClick={() => handleFilterChange("sortBy", "relevance")}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {(filters.subcategory || filters.sortBy !== "relevance") && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear all
            </button>
          )}
        </motion.div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-6 border border-gray-200 rounded-xl bg-gray-50"
          >
            <div className="flex flex-wrap gap-6">
              {/* Subcategory Filter */}
              <CustomDropdown
                label="Subcategory"
                options={["All Subcategories", ...subcategories]}
                selected={filters.subcategory || "All Subcategories"}
                onSelect={(value) => handleFilterChange("subcategory", value === "All Subcategories" ? "" : value)}
              />

              {/* Sort By Filter */}
              <CustomDropdown
                label="Sort By"
                options={[
                  "Relevance",
                  "Newest First",
                  "Most Popular",
                  "Price: Low to High",
                  "Price: High to Low",
                ]}
                selected={
                  filters.sortBy === "relevance"
                    ? "Relevance"
                    : filters.sortBy === "newest"
                      ? "Newest First"
                      : filters.sortBy === "popular"
                        ? "Most Popular"
                        : filters.sortBy === "price_asc"
                          ? "Price: Low to High"
                          : filters.sortBy === "price_desc"
                            ? "Price: High to Low"
                            : "Relevance"
                }
                onSelect={(value) => {
                  const sortMap = {
                    "Relevance": "relevance",
                    "Newest First": "newest",
                    "Most Popular": "popular",
                    "Price: Low to High": "price_asc",
                    "Price: High to Low": "price_desc",
                  };
                  handleFilterChange("sortBy", sortMap[value]);
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Results Grid */}
        {!searchResults && searchQuery.length >= 2 ? (
          // Loading State
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-600">Searching products...</p>
          </div>
        ) : searchQuery.length < 2 ? (
          // No Query State
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Start searching for products</p>
            <p className="text-gray-500 text-sm">Enter at least 2 characters to search</p>
          </div>
        ) : filteredResults && filteredResults.length === 0 ? (
          // No Results State
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg mb-2">No products found</p>
            <p className="text-gray-500 text-sm mb-4">Try different keywords or filters</p>
            {(filters.subcategory || filters.sortBy !== "relevance") && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          // Products Grid
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {filteredResults?.map((product) => (
              <motion.div
                key={product._id}
                variants={itemVariants}
                onClick={() => handleClickProduct(product.itemId)}
              >
                <ProductCard
                  img={product.mainImage}
                  name={product.name}
                  category={product.category}
                  price={product.price}
                  productId={product.itemId}
                  className="transition-all duration-300"
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
