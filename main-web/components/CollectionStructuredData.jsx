// components/CollectionStructuredData.jsx
"use client";

export function CollectionStructuredData({ collectionName, products, description }) {
  if (!products || products.length === 0) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${collectionName} Collection`,
    description: description || `Shop our ${collectionName} collection featuring premium footwear.`,
    url: `https://walkdrobe.in/collections/${collectionName.toLowerCase().replace(/\s+/g, '-')}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 20).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          image: product.mainImage,
          url: `https://walkdrobe.in/product/${product.itemId}`,
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "INR",
            availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          }
        }
      }))
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function FAQStructuredData({ faqs }) {
  if (!faqs || faqs.length === 0) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
