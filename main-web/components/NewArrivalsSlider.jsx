"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProductCard from "./ProductCard";
import { motion } from "framer-motion";

import { useRouter } from "next/navigation";

export default function NewArrivalsSlider() {
  const [visible, setVisible] = useState(4);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef(null);
  const router = useRouter();
  // Fetch products from Convex - get all products ordered by creation date (newest first)
  const products = useQuery(api.products.getAll);

  useEffect(() => {
    const handleResize = () => {
      setVisible(window.innerWidth < 768 ? 2 : 4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Track scroll position for dots and handle infinite loop
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !products || products.length === 0) return;
    
    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const scrollWidth = el.scrollWidth;
      const clientWidth = el.clientWidth;
      const halfWidth = scrollWidth / 2;
      
      // When reaching the end, jump back to the start
      if (scrollLeft >= halfWidth - clientWidth) {
        el.scrollLeft = scrollLeft - halfWidth;
      }
      // When reaching the start (scrolling backwards), jump to the end
      else if (scrollLeft <= 0) {
        el.scrollLeft = halfWidth;
      }
      
      const page = Math.round(el.scrollLeft / el.clientWidth);
      setCurrentPage(page % Math.ceil(products.length / visible));
    };
    
    el.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, [visible, products]);

  const scrollToPage = (idx) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  };
  const handleClickProduct = (productId) => {
    sessionStorage.setItem("homeScroll", window.scrollY);
    router.push(`/product/${productId}`);
  };

  return (
    <section className="w-full flex flex-col items-center pt-1">
      {/* Heading */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg md:text-xl font-medium tracking-wide text-gray-800">
          NEW ARRIVALS
        </h2>
      </div>

      <div className="relative w-full md:max-w-[74%] mx-auto">
        {/* Desktop: Horizontal scroll */}
        <div className="hidden md:block">
          <div
            ref={scrollRef}
            className="w-full overflow-x-auto scrollbar-hide product-slider"
          >
            <div className="flex flex-nowrap gap-6 px-4 sm:px-6 lg:px-8">
              {/* Loading Skeleton */}
              {products === undefined &&
                Array.from({ length: visible }).map((_, idx) => (
                  <ProductCard key={`skeleton-${idx}`} loading />
                ))}

              {/* Empty state */}
              {products?.length === 0 && (
                <div className="flex w-full justify-center items-center py-12">
                  <p className="text-gray-500">
                    No new arrivals available at the moment.
                  </p>
                </div>
              )}

              {/* Real products - duplicated for infinite loop */}
              {products?.map((p, idx) => (
                <motion.div
                  key={`first-${p._id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  onClick={() => handleClickProduct(p._id)}
                >
                  <ProductCard
                    productId={p.itemId || p._id}
                    img={p.mainImage || "/products/placeholder.jpg"}
                    name={p.name}
                    category={p.category}
                    price={p.price}
                  />
                </motion.div>
              ))}
              
              {/* Duplicate products for seamless loop */}
              {products?.map((p, idx) => (
                <motion.div
                  key={`second-${p._id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  onClick={() => handleClickProduct(p._id)}
                >
                  <ProductCard
                    productId={p.itemId || p._id}
                    img={p.mainImage || "/products/placeholder.jpg"}
                    name={p.name}
                    category={p.category}
                    price={p.price}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: 2 column grid */}
        <div className="">
          {/* Loading Skeleton */}
          {products === undefined && (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <ProductCard key={`skeleton-${idx}`} loading />
              ))}
            </div>
          )}

          {/* Empty state */}
          {products?.length === 0 && (
            <div className="flex w-full justify-center items-center py-12">
              <p className="text-gray-500">
                No new arrivals available at the moment.
              </p>
            </div>
          )}

          {/* Real products in 2 column grid */}
          {products && products.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {products.map((p, idx) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  onClick={() => handleClickProduct(p._id)}
                >
                  <ProductCard
                    productId={p.itemId || p._id}
                    img={p.mainImage || "/products/placeholder.jpg"}
                    name={p.name}
                    category={p.category}
                    price={p.price}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination Dots */}
    
    </section>
  );
}
