"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CategoriesSection() {
  const router = useRouter();
  
  // Query 6 products for the best sellers grid
  const dbProducts = useQuery(api.products.getProductsForCards, { limit: 6 });

  // Real fallback products matching the database content
  const fallbackProducts = [
    {
      _id: "db1",
      itemId: "WD2026-074",
      name: "Magic FF Turbo",
      category: "Sports",
      price: 3399,
      originalPrice: 4500,
      discount: 24,
      mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779122453874.png",
      availableSizes: ["7", "8", "9", "10"]
    },
    {
      _id: "db2",
      itemId: "WD2026-073",
      name: "Nike Zoompro",
      category: "Sports",
      price: 3599,
      originalPrice: 5000,
      discount: 28,
      mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779122209478.png",
      availableSizes: ["7", "8", "9", "10"]
    },
    {
      _id: "db3",
      itemId: "WD2026-035",
      name: "Adidas Samba",
      category: "Sneakers",
      price: 2899,
      originalPrice: 4000,
      discount: 27,
      mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779015002093.png",
      availableSizes: ["6", "7", "8", "9", "10"]
    },
    {
      _id: "db4",
      itemId: "WD2026-070",
      name: "Magic Speed FF Turbo",
      category: "Sports",
      price: 3399,
      originalPrice: 4500,
      discount: 24,
      mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779121222389.png",
      availableSizes: ["7", "8", "9", "10"]
    },
    {
      _id: "db5",
      itemId: "WD2026-068",
      name: "Under Armour (Black)",
      category: "Sports",
      price: 3499,
      originalPrice: 5000,
      discount: 30,
      mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779119714389.png",
      availableSizes: ["7", "8", "9", "10"]
    },
    {
      _id: "db6",
      itemId: "WD2026-037",
      name: "Adidas Adizero Pro-4",
      category: "Sports",
      price: 3799,
      originalPrice: 5000,
      discount: 24,
      mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779015432350.png",
      availableSizes: ["7", "8", "9", "10"]
    }
  ];

  const displayProducts = dbProducts && dbProducts.length >= 3
    ? dbProducts.slice(0, 6).map((p, idx) => {
        // Calculate deterministic discounts/original prices for DB products
        const discountOptions = [24, 28, 27, 24, 30, 24];
        const discount = discountOptions[idx % discountOptions.length];
        const originalPrice = Math.round(p.price / (1 - discount / 100));
        return {
          ...p,
          discount,
          originalPrice,
          category: p.category || "Sports"
        };
      })
    : fallbackProducts;

  const handleProductClick = (productId) => {
    router.push(`/product/${productId}`);
  };

  return (
    <section className="pt-0 pb-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Categories Rectangular Grid */}
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-serif text-gray-900 my-6 tracking-wide font-light">Categories</h2>
          
          <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto justify-items-center">
            {/* Category 1: Sneakers */}
            <Link href="/categories/sneakers" className="group flex flex-col items-center text-center">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-gray-100/90 hover:bg-gray-100 border border-gray-200/40 overflow-hidden mb-3 flex items-center justify-center p-4 transition-all duration-300 group-hover:shadow-md">
                <img 
                  src="/test-removebg-preview__1_-removebg-preview.png" 
                  alt="Sneakers" 
                  className="w-[85%] h-[85%] object-contain transition-transform duration-[1200ms] group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-gray-400 mb-0.5 font-inter">Explore</span>
                <h3 className="text-base font-serif text-gray-900 tracking-wide font-bold">Sneakers</h3>
              </div>
            </Link>

            {/* Category 2: Sports Shoes */}
            <Link href="/categories/sports" className="group flex flex-col items-center text-center">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-gray-100/90 hover:bg-gray-100 border border-gray-200/40 overflow-hidden mb-3 flex items-center justify-center p-4 transition-all duration-300 group-hover:shadow-md">
                <img 
                  src="/haha-removebg-preview__1_-removebg-preview.png" 
                  alt="Sports Shoes" 
                  className="w-[85%] h-[85%] object-contain transition-transform duration-[1200ms] group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-gray-400 mb-0.5 font-inter">Explore</span>
                <h3 className="text-base font-serif text-gray-900 tracking-wide font-bold">Sports Shoes</h3>
              </div>
            </Link>
          </div>
        </div>

        {/* Best Seller Header */}
        <div className="text-center mt-0 mb-12 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-gray-900 mb-3 tracking-wide font-light">Best Sellers</h2>
          <p className="text-gray-400 text-xs md:text-sm leading-relaxed font-light font-inter max-w-lg mx-auto">
            Our best seller products combine premium quality, comfort, and style, loved by customers for durability and everyday performance.
          </p>
        </div>

        {/* Flat Borderless 6-Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-12">
          {displayProducts.map((product, idx) => (
            <motion.div 
              key={product._id} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              className="group flex flex-col bg-white overflow-hidden cursor-pointer"
              onClick={() => handleProductClick(product.itemId)}
            >
              {/* Product Image & Minimalist Tag */}
              <div className="relative overflow-hidden mb-4">
                {product.mainImage ? (
                  <img
                    src={product.mainImage}
                    alt={product.name}
                    className="w-full h-auto block transition-transform duration-[1200ms] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col flex-grow text-left">
                <h3 className="text-gray-800 font-medium text-xs md:text-sm tracking-wide line-clamp-1 mb-1 font-inter">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-900 text-xs md:text-sm font-semibold font-inter">
                    ₹{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-gray-400 text-[10px] md:text-xs line-through font-inter">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
