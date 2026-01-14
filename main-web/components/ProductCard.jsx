import Image from "next/image";
import Link from "next/link";
import { Poppins, Inter } from "next/font/google";
import { useProductView } from "@/hooks/useProductView";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Skeleton shimmer component
function SkeletonBox({ className }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-200 rounded ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

export default function ProductCard({
  img,
  name,
  category,
  price,
  productId,
  className = "",
  loading = false,
}) {
  // Track views only if not loading
  if (!loading) {
    useProductView(productId);
  }

  if (loading) {
    return (
      <div className={`flex-shrink-0 w-full ${className}`}>
        {/* Image skeleton */}
        <SkeletonBox className="w-full aspect-[4/5] mb-3" />
        
        <div className="flex flex-col gap-1">
          {/* Name skeleton */}
          <SkeletonBox className="h-4 w-3/4" />
          {/* Price skeleton */}
          <SkeletonBox className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className={`block w-full cursor-pointer group ${className}`}>
      {/* Product Image - OPTIMIZED */}
      <div className="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden mb-1">
        <Image
          src={img || "/products/placeholder.jpg"}
          alt={name || "Product"}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k="
        />
      </div>
      
      {/* Product Info */}
      <div className="flex flex-col gap-1">
        {/* Product Name */}
        <h3 className={`${poppins.className} text-[11px] sm:text-[12px] font-light text-gray-900 line-clamp-2 leading-tight`}>
          {name}
        </h3>
        <h4 className={`${poppins.className} text-[9px] sm:text-[10px] font-extralight text-gray-600 line-clamp-2 leading-tight`}>
          {category}
        </h4>
        <div className="h-px bg-black/20 w-full">

        </div>
        {/* Product Price */}
        <p className={`${poppins.className} text-[11px] sm:text-[12px] font-light text-gray-700`}>
          ₹ {price.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
