"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TrendingSection() {
  const router = useRouter();
  const trendingProducts = useQuery(api.views.getMostViewedProducts, {
    limit: 6,
    category: "Sneakers",
  });

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-gray-500 tracking-[0.3em] text-sm mb-4 font-medium">HOT RIGHT NOW</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Trending Sneakers</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {!trendingProducts ? (
            [...Array(6)].map((_, idx) => (
              <div key={idx} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            ))
          ) : trendingProducts.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              No trending products yet
            </div>
          ) : (
            trendingProducts.map((product, idx) => (
              <motion.div
                key={product.itemId}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => router.push(`/product/${product.itemId}`)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-shadow">
                  {product.mainImage ? (
                    <img
                      src={product.mainImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}

                  <div className="absolute top-4 left-4 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="font-bold text-sm">#{idx + 1}</span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white font-semibold mb-1">{product.name}</h3>
                      <p className="text-white font-bold">₹{product.price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
