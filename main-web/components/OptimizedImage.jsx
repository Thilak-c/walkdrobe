"use client";
import Image from "next/image";

/**
 * Optimized Image component that bypasses Next.js optimization for external images
 * to avoid 500 errors from slow external servers
 */
export default function OptimizedImage({ src, alt, ...props }) {
  // Check if image is from external domain (insys.walkdrobe.in)
  const isExternal = src?.includes('insys.walkdrobe.in');
  
  if (isExternal) {
    // Use regular img tag for external images to avoid optimization timeout
    return (
      <img
        src={src}
        alt={alt}
        {...props}
        className={props.className}
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
      />
    );
  }
  
  // Use Next.js Image for local images
  return <Image src={src} alt={alt} {...props} />;
}
