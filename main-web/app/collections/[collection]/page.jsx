"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import Navbar, { NavbarMobile } from "@/components/Navbar";

export default function CollectionPage() {
  const params = useParams();
  const router = useRouter();
  const collectionSlug = params.collection;

  // Fetch collection data and products dynamically
  const collectionData = useQuery(api.collections.getCollectionBySlug, { 
    slug: collectionSlug 
  });
  
  const products = useQuery(api.collections.getCollectionProducts, { 
    slug: collectionSlug 
  }) ?? [];

  const handleClickProduct = (productId) => {
    sessionStorage.setItem("collectionScroll", window.scrollY);
    router.push(`/product/${productId}`);
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen relative bg-gray-50 p-6 md:p-12">
      <div className="md:hidden top-0 h-[60px]"></div>
      <div className="absolute top-0 left-0 md:hidden">
        <NavbarMobile />
      </div>
      <div className="hidden absolute md:block">
        <Navbar />
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        {collectionData ? (
          <>
            <h1 className="text-2xl font-light mb-2">{collectionData.name}</h1>
            {collectionData.description && (
              <p className="text-sm font-light text-gray-600">{collectionData.description}</p>
            )}
            <p className="text-xs font-light text-gray-500 mt-2">
              {products.length} {products.length === 1 ? "item" : "items"}
            </p>
          </>
        ) : (
          <h1 className="text-2xl font-light mb-2">Collection</h1>
        )}
      </div>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No products found in this collection yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
            {products.map((product, idx) => (
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
        )}
      </section>
    </div>
  );
}
