// app/collections/[collection]/layout.jsx
export async function generateMetadata({ params }) {
  const { collection } = params;
  
  // Capitalize and format collection name
  const collectionName = collection
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${collectionName} Collection - Shop Latest Styles`,
    description: `Explore our ${collectionName} collection. Discover premium fashion, latest trends, and exclusive styles. Free shipping on orders over ₹999.`,
    keywords: [
      collectionName,
      `${collectionName} fashion`,
      `buy ${collectionName} online`,
      `${collectionName} clothing`,
      "fashion collection",
      "online shopping",
      "India"
    ],
    openGraph: {
      title: `${collectionName} Collection | AesthetX Ways`,
      description: `Shop the latest ${collectionName} collection with premium quality and fast shipping.`,
      type: "website",
      images: [
        {
          url: `/collections/${collection}-og.jpg`,
          width: 1200,
          height: 630,
          alt: `${collectionName} Collection`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${collectionName} Collection | AesthetX Ways`,
      description: `Shop the latest ${collectionName} collection.`,
    },
    alternates: {
      canonical: `https://aesthetxways.com/collections/${collection}`,
    },
  };
}

export default function CollectionLayout({ children }) {
  return children;
}
