// app/metadata.js - Shared metadata configuration
export const homeMetadata = {
  title: "Home - Premium Footwear Store in Patna",
  description: "Discover the latest footwear trends at Walkdrobe, Patna. Shop sneakers, boots, sandals, and more with fast shipping and easy returns.",
  keywords: ["footwear store", "buy shoes online", "sneakers Patna", "boots", "sandals", "premium footwear", "online shopping India"],
  openGraph: {
    title: "Walkdrobe - Premium Footwear Store in Patna",
    description: "Discover the latest footwear trends at Walkdrobe. Shop premium shoes with fast shipping.",
    type: "website",
    images: ["/og-home.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Walkdrobe - Premium Footwear Store in Patna",
    description: "Discover the latest footwear trends at Walkdrobe.",
  },
};

export const shopMetadata = {
  title: "Shop All Footwear - Sneakers, Boots, Sandals & More",
  description: "Browse our complete collection of premium footwear. Filter by category, size, and price to find your perfect pair.",
  openGraph: {
    title: "Shop All Footwear | Walkdrobe",
    description: "Browse our complete collection of premium footwear.",
    type: "website",
  },
};

export const generateProductMetadata = (product) => {
  if (!product) return {};
  
  return {
    title: `${product.name} - ${product.category} | Buy Online`,
    description: `Buy ${product.name} online. ${product.description || `Premium ${product.category} footwear available in multiple sizes.`} Price: ₹${product.price}. Fast shipping and easy returns.`,
    keywords: [product.name, product.category, product.brand, "buy online", "footwear", "shoes"].filter(Boolean),
    openGraph: {
      title: `${product.name} | Walkdrobe`,
      description: `Buy ${product.name} - ${product.category}. Price: ₹${product.price}`,
      type: "website",
      siteName: "Walkdrobe",
      images: [
        {
          url: product.mainImage,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Walkdrobe`,
      description: `Buy ${product.name} - ${product.category}. Price: ₹${product.price}`,
      images: [product.mainImage],
    },
  };
};
