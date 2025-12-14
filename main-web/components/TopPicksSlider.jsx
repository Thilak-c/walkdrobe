"use client";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import Router from "next/router";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
// Direct Convex client approach while API generation is fixed
import { convex } from "../convexClient";

export default function TopPicksSlider() {
  const scrollRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  // Fetch products using direct Convex client
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);

        const debugData = await convex.query("products:debugProducts");

        const result = await convex.query("products:getTopPicks");
        setProducts(result || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err);
        // Fallback mock data
        const fallbackProducts = [
          {
            _id: "1",
            mainImage: "/products/kurukshetra.jpg",
            name: "TSS Originals: Kurukshetra",
            category: "Oversized T-Shirts",
            price: 1799,
          },
          {
            _id: "2",
            mainImage: "/products/nautical.jpg",
            name: "Cotton Linen Stripes: Nautical",
            category: "Shirts",
            price: 1499,
          },
        ];
        setProducts(fallbackProducts);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      // Products loaded successfully
    }
  }, [products]);

  const hasProducts = products && products.length > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !products || products.length === 0) return;

    const updatePages = () => {
      setPageCount(Math.ceil(el.scrollWidth / el.clientWidth));
    };

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
      setCurrentPage(page % products.length);
    };

    updatePages();
    handleScroll();

    window.addEventListener("resize", updatePages);
    el.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", updatePages);
      el.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const handleClickProduct = (productId) => {
    sessionStorage.setItem("homeScroll", window.scrollY);
    router.push(`/product/${productId}`);
  };
  const scrollToPage = (idx) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section className="w-full flex flex-col items-center py-12 ">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg md:text-xl font-medium tracking-wide text-gray-800">
          TOP PICKS OF THE WEEK
        </h2>
        <p className="text-xs font-light text-gray-600 mt-2">
          {hasProducts ? `` : isLoading ? "..." : ""}
          {error && (
            <>
              <br />
              <span className="text-xs text-orange-600">
                ⚠️ Using fallback data - database connection issue
              </span>
            </>
          )}
        </p>
      </div>

      <div className="relative w-full md:max-w-[74%] mx-auto">
        {/* Desktop: Horizontal scroll */}
        <div className="hidden md:block">
          <div
            ref={scrollRef}
            className="w-full overflow-x-auto scrollbar-hide product-slider"
          >
            <div className="flex flex-nowrap gap-6 px-4 sm:px-6 lg:px-8">
              {isLoading ? (
                // Skeleton loader (show 4 placeholder cards)
                Array.from({ length: 4 }).map((_, idx) => (
                  <ProductCard key={`skeleton-${idx}`} loading />
                ))
              ) : error ? (
                <div className="flex flex-col items-center justify-center w-full py-8 gap-3">
                  <div className="text-red-500">Failed to load top picks.</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-800 text-white r hover:bg-gray-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : hasProducts ? (
                <>
                  {products.map((p, idx) => (
                    <motion.div
                      key={`first-${p._id}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ delay: idx * 0.1, duration: 0.4 }}
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
                  {/* Duplicate for infinite loop */}
                  {products.map((p, idx) => (
                    <motion.div
                      key={`second-${p._id}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ delay: idx * 0.1, duration: 0.4 }}
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
                </>
              ) : (
                <div className="flex items-center justify-center w-full py-8">
                  <div className="text-gray-500">No top picks available.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: 2 column grid */}
        <div className="">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <ProductCard key={`skeleton-${idx}`} loading />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center w-full py-8 gap-3">
              <div className="text-red-500">Failed to load top picks.</div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : hasProducts ? (
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
          ) : (
            <div className="flex items-center justify-center w-full py-8">
              <div className="text-gray-500">No top picks available.</div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {hasProducts &&
          pageCount > 1 &&
          Array.from({ length: pageCount }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToPage(idx)}
              className={`w-1 h-1 rounded-full transition-colors duration-200 ${currentPage === idx ? "bg-gray-800" : "bg-gray-300"
                }`}
              aria-label={`Go to slide ${idx + 1}`}
              disabled={currentPage === idx}
            />
          ))}
      </div>
    </section>
  );
}
