"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";

export default function FeaturedProducts() {
  const router = useRouter();
  
  // Query 10 products for the main homepage grid
  const dbProducts = useQuery(api.products.getProductsForCards, { limit: 10 });

  // Real database products to show as fallback
  const fallbackProducts = [
    {
      _id: "fp1",
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
      _id: "fp2",
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
      _id: "fp3",
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
      _id: "fp4",
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
      _id: "fp5",
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
      _id: "fp6",
      itemId: "WD2026-037",
      name: "Adidas Adizero Pro-4",
      category: "Sports",
      price: 3799,
      originalPrice: 5000,
      discount: 24,
      mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779015432350.png",
      availableSizes: ["7", "8", "9", "10"]
    },
    {
      _id: "fp7",
      itemId: "WD2026-067",
      name: "Crocs Lite Ride 360",
      category: "Crocs",
      price: 1699,
      originalPrice: 3000,
      discount: 43,
      mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779103484599.png",
      availableSizes: ["5", "6", "7", "8", "9"]
    },
    {
      _id: "fp8",
      itemId: "WD2026-065",
      name: "Crocs Crush",
      category: "Crocs",
      price: 2599,
      originalPrice: 4000,
      discount: 35,
      mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779103143411.png",
      availableSizes: ["5", "6", "7", "8", "9"]
    },
    {
      _id: "fp9",
      itemId: "WD2026-062",
      name: "Crocs Hikers",
      category: "Crocs",
      price: 2399,
      originalPrice: 3500,
      discount: 31,
      mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779101794905.png",
      availableSizes: ["6", "7", "8", "9"]
    },
    {
      _id: "fp10",
      itemId: "WD2026-033",
      name: "Puma Magmax",
      category: "Sports",
      price: 3599,
      originalPrice: 5000,
      discount: 28,
      mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779014572832.png",
      availableSizes: ["7", "8", "9", "10"]
    }
  ];

  const displayProducts = dbProducts && dbProducts.length >= 3
    ? dbProducts.slice(0, 10).map((p, idx) => {
        // Calculate deterministic discounts/original prices for DB products
        const discountOptions = [24, 28, 27, 24, 30, 24, 43, 35, 31, 28];
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
    <section className="py-20 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-serif text-gray-900 tracking-wide font-light">Our Collection</h2>
        </div>

        {/* 10-Product Grid (5 columns on desktop, 2 on mobile) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-12">
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
              {/* Product Image & Badge */}
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
