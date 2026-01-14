"use client";
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import Header from "@/components/Header";
import FooterSimple from "@/components/FooterSimple";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// How many products to load per batch
const PRODUCTS_PER_PAGE = 6;

export default function MenWomenSneakersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [activeType, setActiveType] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const loadMoreRef = useRef(null);

  const categoryMap = {
    all: "All",
    sneakers: "Sneakers",
    sports: "Sports",
  };

  const ctParam = searchParams.get("ct")?.toLowerCase() || "all";
  const activeCategory = categoryMap[ctParam] || "All";
  const isAllCategory = activeCategory === "All";

  // OPTIMIZED: Use shop query - returns card fields + filter fields (subcategories, type)
  // For "All" category, fetch all products; otherwise filter by category
  const products = useQuery(
    isAllCategory ? api.products.getProductsForCards : api.products.getProductsForShop,
    isAllCategory 
      ? { limit: 100 }
      : { category: activeCategory, limit: 100 }
  ) ?? [];

  // Reset visible count when category/filters change
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [activeCategory, activeSubcategory, activeType]);

  const { subcategoryCards } = useMemo(() => {
    const subs = new Set(products.map((p) => p.subcategories).filter(Boolean));
    const subcats = ["All", ...Array.from(subs)];
    
    const cards = subcats.map((subcat) => {
      const subcatProducts = subcat === "All" 
        ? products 
        : products.filter(p => p.subcategories === subcat);
      
      return {
        name: subcat,
        image: subcatProducts[0]?.mainImage || "",
        count: subcatProducts.length
      };
    }).filter(card => card.count > 0);

    return { subcategoryCards: cards };
  }, [products]);

  const handleClickProduct = (productId) => {
    sessionStorage.setItem("homeScroll", window.scrollY);
    router.push(`/product/${productId}`);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSub =
        activeSubcategory === "All" || p.subcategories === activeSubcategory;
      const matchType =
        activeType === "All" || (p.type?.includes(activeType) ?? false);
      return matchSub && matchType;
    });
  }, [products, activeSubcategory, activeType]);

  // Only show visible products (lazy loading)
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const hasMore = visibleCount < filteredProducts.length;

  // Intersection Observer for infinite scroll
  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount(prev => prev + PRODUCTS_PER_PAGE);
    }
  }, [hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-16 md:pt-20 px-4 md:px-6">

      {/* Category Tabs */}
      <nav className="flex gap-4 mb-4 relative max-w-7xl mx-auto border-b border-gray-200">
        {Object.keys(categoryMap).map((key) => (
          <button
            key={key}
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("ct", key);
              router.replace(
                `${window.location.pathname}?${params.toString()}`
              );
            }}
            className={`relative text-sm font-normal pb-2 ${
              ctParam === key
                ? "text-black"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            {categoryMap[key].toUpperCase()}
            {ctParam === key && (
              <motion.span
                layoutId="underline"
                className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-full"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Subcategory Cards Section */}
      <section className="max-w-7xl mx-auto mb-6">
        <h2 className="text-base font-normal mb-4">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {subcategoryCards.map((card, idx) => (
            <motion.div
              key={card.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setActiveSubcategory(card.name)}
              className={`relative h-36 rounded-lg overflow-hidden cursor-pointer group ${
                activeSubcategory === card.name ? "ring-2 ring-black" : ""
              }`}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${card.image})` }}
              />
              
              {/* Overlay */}
              <div className={`absolute inset-0 transition-all duration-300 ${
                activeSubcategory === card.name
                  ? "bg-black/50"
                  : "bg-black/30 group-hover:bg-black/40"
              }`} />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-3">
                <h3 className="text-sm font-normal mb-0.5 text-center">{card.name}</h3>
                <p className="text-xs opacity-90">{card.count} items</p>
              </div>

              {/* Active Indicator */}
              {activeSubcategory === card.name && (
                <motion.div
                  layoutId="activeSubcategory"
                  className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                >
                  <div className="w-2.5 h-2.5 bg-black rounded-full" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <div className="w-full h-px bg-black max-w-7xl flex justify-center mx-auto blur-[2px] mb-3"></div>

      {/* Products Count */}
      <div className="max-w-7xl mx-auto mb-3 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Showing {visibleProducts.length} of {filteredProducts.length} products
        </p>
      </div>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {visibleProducts.length === 0 && products.length === 0
            ? Array.from({ length: PRODUCTS_PER_PAGE }).map((_, idx) => (
                <ProductCard key={`skeleton-${idx}`} loading />
              ))
            : visibleProducts.map((product, idx) => (
                <motion.div
                  key={product.itemId}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: (idx % PRODUCTS_PER_PAGE) * 0.05, duration: 0.4 }}
                  onClick={() => handleClickProduct(product.itemId)}
                >
                  <ProductCard
                    img={product.mainImage}
                    name={product.name}
                    category={product.category}
                    price={product.price}
                    productId={product.itemId}
                  />
                </motion.div>
              ))}
        </div>

        {/* Load More Trigger */}
        {hasMore && (
          <div 
            ref={loadMoreRef} 
            className="flex justify-center items-center py-8"
          >
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500 text-sm">Loading more...</span>
          </div>
        )}

        {/* End of products */}
        {!hasMore && filteredProducts.length > 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            You've seen all {filteredProducts.length} products
          </p>
        )}
      </section>
      </div>
      <FooterSimple />
    </div>
  );
}
