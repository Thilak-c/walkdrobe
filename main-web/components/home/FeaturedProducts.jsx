"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowRight } from "lucide-react";

export default function FeaturedProducts() {
  const router = useRouter();
  const products = useQuery(api.products.getProductsForCards, { limit: 8 });  // Only load 8 for homepage

  const handleProductClick = (productId) => {
    router.push(`/product/${productId}`);
  };

  return (
    <section className="py-12 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-6 md:mb-12"
        >
          <div>
            <p className="text-gray-400 tracking-[0.2em] text-xs md:text-sm mb-1 md:mb-4 font-medium">CURATED</p>
            <h2 className="text-xl md:text-4xl font-bold text-gray-900">Featured</h2>
          </div>
          <Link href="/shop" className="text-gray-500 hover:text-black transition-colors flex items-center gap-1 text-xs md:text-base font-medium">
            View All <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {!products ? (
            [...Array(8)].map((_, idx) => (
              <div key={idx} className="aspect-[3/4] bg-gray-200 rounded-lg md:rounded-xl animate-pulse" />
            ))
          ) : (
            products.map((product, idx) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => handleProductClick(product.itemId)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[3/4] bg-gray-100 rounded-lg md:rounded-xl overflow-hidden mb-2 md:mb-4">
                  {product.mainImage ? (
                    <img
                      src={product.mainImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                </div>

                <div>
                  <p className="text-gray-400 text-[10px] md:text-xs tracking-wider mb-0.5 uppercase">{product.category}</p>
                  <h3 className="text-gray-900 text-xs md:text-base font-medium mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-black text-sm md:text-base font-semibold">₹{product.price?.toLocaleString()}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
