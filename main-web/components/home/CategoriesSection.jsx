"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CategoriesSection() {
  const dbCategories = useQuery(api.products.getCategoryStats);
  const categoryNames = ["All", "Sneakers", "Sports"];

  const displayCategories = dbCategories || categoryNames.map(name => ({
    name,
    image: null,
    count: 0
  }));


  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-16"
        >
          <p className="text-gray-400 tracking-[0.2em] text-xs md:text-sm mb-2 md:mb-4 font-medium">EXPLORE</p>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">Shop by Category</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {displayCategories.map((cat, idx) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link href={`/shop?ct=${cat.name.toLowerCase()}`}>
                <div className="group relative aspect-[4/5] md:aspect-[3/4] bg-gray-100 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-500">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 group-hover:scale-105 transition-transform duration-700" />
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 bg-gradient-to-t from-white via-white/95 to-transparent">
                    <p className="text-gray-400 text-[10px] md:text-xs tracking-widest mb-0.5">{cat.count} Styles</p>
                    <h3 className="text-gray-900 text-sm md:text-xl font-bold">{cat.name}</h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
