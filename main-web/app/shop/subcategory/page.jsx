"use client";
import React, { useState, useMemo, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import CustomDropdown from "@/components/CustomDropdown";
import { useSearchParams, useRouter } from "next/navigation";

export default function SubcategoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeType, setActiveType] = useState("All");
  const [localSubcategory, setLocalSubcategory] = useState(null);

  // Normalize subcategory string for better matching
  const normalizeSubcategory = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .toLowerCase()
      .replace(/[-_\s]+/g, "") // Remove hyphens, underscores, spaces
      .replace(/s$/, "")        // Remove trailing 's' for plural handling
      .trim();
  };

  // Map URL query to subcategory with multiple variations
  const subcategoryMap = {
    // Men's Low Top Sneakers - all variations
    "menlowropsneaker": "Men Low Top Sneakers",
    "menlowropsneakers": "Men Low Top Sneakers",
    "men-low-top-sneaker": "Men Low Top Sneakers",
    "men-low-top-sneakers": "Men Low Top Sneakers",
    "menlowrop": "Men Low Top Sneakers",

    // T-Shirts - all variations
    "tshirt": "T-shirt",
    "t-shirt": "T-shirt",
    "tshirts": "T-shirt",
    "t-shirts": "T-shirt",

    // Hoodies - all variations (singular and plural)
    "hoodie": "Hoodies",
    "hoodies": "Hoodies",

    // Sweatshirts - all variations
    "sweatshirt": "Sweatshirt",
    "sweatshirts": "Sweatshirt",
    "sweat-shirt": "Sweatshirt",
    "sweat-shirts": "Sweatshirt",

    // Pants - all variations
    "pant": "Pants",
    "pants": "Pants",

    // Women's Sneakers - all variations
    "womensneaker": "Women Sneakers",
    "womensneakers": "Women Sneakers",
    "women-sneaker": "Women Sneakers",
    "women-sneakers": "Women Sneakers",

    // Jerseys - all variations
    "jersey": "Jerseys",
    "jerseys": "Jerseys",
  };

  // Query all products and available subcategories
  const allProducts = useQuery(api.category.getAllProducts) ?? [];
  const availableSubcategories = useQuery(api.category.getAllSubcategories) ?? [];
  const isLoading = allProducts === undefined;

  // Helper function to find subcategory match from database
  const findSubcategoryMatch = (urlParam, availableSubs) => {
    if (!urlParam || !availableSubs.length) return null;

    const normalized = normalizeSubcategory(urlParam);

    // Try exact normalized match
    for (const sub of availableSubs) {
      if (normalizeSubcategory(sub) === normalized) {
        return sub;
      }
    }

    return null;
  };

  // Get active subcategory from URL or local state
  const subParam = searchParams.get("sub");
  const normalizedParam = subParam ? normalizeSubcategory(subParam) : "menlowropsneaker";

  // Try static map first, then dynamic discovery
  let urlSubcategory = subcategoryMap[normalizedParam];
  if (!urlSubcategory && subParam) {
    // Fallback to dynamic discovery
    urlSubcategory = findSubcategoryMatch(subParam, availableSubcategories);
  }

  // Default to first available subcategory if nothing found and no param
  if (!urlSubcategory && !subParam && availableSubcategories.length > 0) {
    urlSubcategory = availableSubcategories[0];
  }

  // Use local state if set, otherwise use URL
  const activeSubcategory = localSubcategory || urlSubcategory;

  // Update local state when URL changes
  useEffect(() => {
    if (urlSubcategory) {
      setLocalSubcategory(urlSubcategory);
    }
  }, [urlSubcategory]);

  // Filter products by subcategory with better matching
  const products = useMemo(() => {
    if (!activeSubcategory || !allProducts.length) return [];

    return allProducts.filter((p) => {
      if (!p.subcategories) return false;

      // Try exact match first
      if (p.subcategories === activeSubcategory) return true;

      // Then try normalized comparison
      const productSubNormalized = normalizeSubcategory(p.subcategories);
      const activeSubNormalized = normalizeSubcategory(activeSubcategory);

      return productSubNormalized === activeSubNormalized;
    });
  }, [allProducts, activeSubcategory]);

  // Get unique types from filtered products
  const types = useMemo(() => {
    const allTypes = products.flatMap((p) => p.type ?? []);
    return ["All", ...Array.from(new Set(allTypes))];
  }, [products]);

  const handleClickProduct = (productId) => {
    sessionStorage.setItem("subcategoryScroll", window.scrollY);
    router.push(`/product/${productId}`);
  };

  // Restore scroll position on mount
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("subcategoryScroll");
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll));
      sessionStorage.removeItem("subcategoryScroll");
    }
  }, []);

  // Filter by type
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchType =
        activeType === "All" || (p.type?.includes(activeType) ?? false);
      return matchType;
    });
  }, [products, activeType]);

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="md:block h-[80px] md:h-[100px]"></div>
      <div className="md:hidden">
        <NavbarMobile />
      </div>
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Error State - Invalid Subcategory */}
      {!activeSubcategory && !isLoading && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-red-800 mb-2 text-center">
              Subcategory Not Found
            </h2>
            <p className="text-red-600 mb-6 text-center">
              The subcategory "{subParam}" doesn't exist.
            </p>

            {availableSubcategories.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Available Subcategories:
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableSubcategories.map((sub) => {
                    // Convert to URL-friendly format
                    const urlFormat = normalizeSubcategory(sub);
                    return (
                      <button
                        key={sub}
                        onClick={() => router.push(`/shop/subcategory?sub=${urlFormat}`)}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition text-left"
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeSubcategory && (
        <>
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {activeSubcategory}
            </h1>
            <p className="text-gray-600">
              {isLoading
                ? "Loading products..."
                : `${filteredProducts.length} ${filteredProducts.length === 1 ? "product" : "products"} found`
              }
            </p>
          </div>

          {/* Subcategory Tabs */}
          <nav className="flex gap-6 mb-6 relative max-w-7xl mx-auto border-b border-gray-200 overflow-x-auto">
            {availableSubcategories.map((subcategory) => {
              const isActive = activeSubcategory === subcategory;
              const urlFormat = normalizeSubcategory(subcategory);

              return (
                <button
                  key={subcategory}
                  onClick={() => {
                    // Update local state without page reload
                    setLocalSubcategory(subcategory);
                    setActiveType("All");
                    // Update URL with canonical format
                    window.history.pushState({}, '', `/shop/subcategory?sub=${urlFormat}`);
                  }}
                  className={`relative text-sm md:text-lg font-semibold pb-2 whitespace-nowrap ${isActive
                    ? "text-black"
                    : "text-gray-400 hover:text-gray-700"
                    }`}
                >
                  {subcategory.toUpperCase()}
                  {isActive && (
                    <motion.span
                      layoutId="underline"
                      className="absolute bottom-0 left-0 w-full h-1 bg-black rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Filters */}
          {types.length > 1 && (
            <div className="flex gap-4 my-4 max-w-7xl mx-auto">
              <CustomDropdown
                label="Type"
                options={types}
                selected={activeType}
                onSelect={setActiveType}
              />
            </div>
          )}

          <div className="w-full h-[1px] bg-black max-w-7xl flex justify-center self-center-safe mx-auto blur-[2px] mb-4"></div>

          {/* Products Grid */}
          <section className="max-w-7xl mx-auto">
            {/* Empty State */}
            {!isLoading && filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                  No Products Found
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your filters or check back later.
                </p>
                <button
                  onClick={() => setActiveType("All")}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
              {isLoading
                ? Array.from({ length: 8 }).map((_, idx) => (
                  <ProductCard key={`skeleton-${idx}`} loading />
                ))
                : filteredProducts.map((product, idx) => (
                  <motion.div
                    key={product.itemId}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    onClick={() => handleClickProduct(product.itemId)}
                  >
                    <ProductCard
                      img={product.mainImage}
                      hoverImg={product.otherImages?.[0]}
                      name={product.name}
                      category={product.category}
                      price={product.price}
                      productId={product.itemId}
                    />
                  </motion.div>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}