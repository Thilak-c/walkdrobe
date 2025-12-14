import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { X, ChevronRight, User, LogOut } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function SidebarDrawer({ open, onClose, width = "w-4/5 max-w-sm" }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [token, setToken] = useState(null);

  // Get token from cookies
  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  // Fetch user data
  const me = useQuery(api.users.meByToken, token ? { token } : "skip");

  // Fetch all products to extract categories and subcategories
  const products = useQuery(api.category.getAllProducts) ?? [];

  // Fetch dynamic collections from database
  const collections = useQuery(api.collections.getAllCollections) ?? [];

  // Handle logout
  const handleLogout = () => {
    document.cookie = "sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/";
  };

  // Extract unique categories and their subcategories
  const categoriesData = useMemo(() => {
    const categoryMap = {};

    products.forEach((product) => {
      const category = product.category;
      const subcategory = product.subcategories;

      if (category) {
        if (!categoryMap[category]) {
          categoryMap[category] = new Set();
        }
        if (subcategory) {
          categoryMap[category].add(subcategory);
        }
      }
    });

    // Convert to array format
    return Object.keys(categoryMap).map((category) => ({
      name: category,
      subcategories: Array.from(categoryMap[category]).sort(),
    }));
  }, [products]);

  // Extract all unique subcategories across all categories
  const allSubcategories = useMemo(() => {
    const subcategoryMap = {};

    products.forEach((product) => {
      const category = product.category;
      const subcategory = product.subcategories;

      if (subcategory && category) {
        if (!subcategoryMap[subcategory]) {
          subcategoryMap[subcategory] = category;
        }
      }
    });

    // Convert to array and sort
    return Object.keys(subcategoryMap).sort().map(sub => ({
      name: sub,
      category: subcategoryMap[sub]
    }));
  }, [products]);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full ${width} text-[13px/] bg-white z-[9999] transition-transform duration-300 overflow-y-auto ${open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header with Logo and Close */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <Link href="/" onClick={onClose}>
            <img src="/logo.png" alt="Logo" className="h-8" />
          </Link>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-700" />
          </button>
        </div>



        {/* Navigation Menu */}
        <nav className="py-2">
          {/* Home */}
          <Link href="/" onClick={onClose}>
            <div className="px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
              <span className="text-sm font-normal text-gray-900">Home</span>
            </div>
          </Link>

          {/* Wishlist - Only show if user is logged in */}
          {me && (
            <Link href="/wishlist" onClick={onClose}>
              <div className="px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-sm font-normal text-gray-900">Wishlist</span>
              </div>
            </Link>
          )}

          {/* Categories are now only shown in the Categories dropdown below */}

          {/* Divider */}
          <div className="my-1 mx-4 border-t border-gray-200"></div>

          {/* Categories Section - Dynamic from Database with Subcategories */}
          {categoriesData.length > 0 && (
            <>
              <div>
                <button
                  onClick={() => toggleSection('categories')}
                  className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-normal text-gray-900">Categories</span>
                  <ChevronRight
                    size={16}
                    className={`text-gray-500 transition-transform ${expandedSection === 'categories' ? 'rotate-90' : ''
                      }`}
                  />
                </button>
                {expandedSection === 'categories' && (
                  <div className="bg-gray-50 py-1">
                    {categoriesData.map((category) => (
                      <div key={category.name}>
                        <button
                          onClick={() => toggleCategory(category.name)}
                          className="w-full px-8 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-sm font-normal text-gray-600">{category.name}</span>
                          <ChevronRight
                            size={14}
                            className={`text-gray-500 transition-transform ${expandedCategory === category.name ? 'rotate-90' : ''
                              }`}
                          />
                        </button>
                        {expandedCategory === category.name && (
                          <div className="bg-gray-100 py-1">
                            {/* All items link */}
                            <Link href={`/shop?ct=${category.name.toLowerCase()}`} onClick={onClose}>
                              <div className="px-12 py-1.5 hover:bg-gray-200 transition-colors cursor-pointer">
                                <span className="text-[11.5px] font-normal text-gray-600">All {category.name}</span>
                              </div>
                            </Link>

                            {/* Subcategories */}
                            {category.subcategories.map((subcategory) => (
                              <Link
                                key={subcategory}
                                href={`/shop/subcategory?ct=${category.name.toLowerCase()}&sub=${encodeURIComponent(subcategory)}`}
                                onClick={onClose}
                              >
                                <div className="px-12 py-1.5 hover:bg-gray-200 transition-colors cursor-pointer">
                                  <span className="text-[11.5px]  font-normal text-gray-600">{subcategory}</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="my-1 mx-4 border-t border-gray-200"></div>
            </>
          )}

          {/* Subcategories Section - All subcategories from all categories */}
          {allSubcategories.length > 0 && (
            <>
              <div>
                <button
                  onClick={() => toggleSection('subcategories')}
                  className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-normal text-gray-900">Subcategories</span>
                  <ChevronRight
                    size={16}
                    className={`text-gray-500 transition-transform ${expandedSection === 'subcategories' ? 'rotate-90' : ''
                      }`}
                  />
                </button>
                {expandedSection === 'subcategories' && (
                  <div className="bg-gray-50 py-1">
                    {allSubcategories.map((subcategory) => (
                      <Link
                        key={subcategory.name}
                        href={`/shop/subcategory?ct=${subcategory.category.toLowerCase()}&sub=${encodeURIComponent(subcategory.name)}`}
                        onClick={onClose}
                      >
                        <div className="px-8 py-2 hover:bg-gray-100 transition-colors cursor-pointer">
                          <span className="text-sm font-normal text-gray-600">{subcategory.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="my-1 mx-4 border-t border-gray-200"></div>
            </>
          )}

          {/* Collections Section - Dynamic from Database */}
          {collections.length > 0 && (
            <>
              <div>
                <button
                  onClick={() => toggleSection('collections')}
                  className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-normal text-gray-900">Collections</span>
                  <ChevronRight
                    size={16}
                    className={`text-gray-500 transition-transform ${expandedSection === 'collections' ? 'rotate-90' : ''
                      }`}
                  />
                </button>
                {expandedSection === 'collections' && (
                  <div className="bg-gray-50 py-1">
                    {collections.map((collection) => (
                      <Link
                        key={collection.slug}
                        href={`/collections/${collection.slug}`}
                        onClick={onClose}
                      >
                        <div className="px-8 py-2 hover:bg-gray-100 transition-colors cursor-pointer">
                          <span className="text-xs font-light text-gray-600">{collection.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="my-1 mx-4 border-t border-gray-200"></div>
            </>
          )}

        </nav>

        {/* Bottom Section - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          {/* Small Links Row */}
          <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] text-gray-500 border-b border-gray-100">
            <Link href="/contact" onClick={onClose} className="hover:text-gray-900">
              Contact us
            </Link>
            {/* <span>·</span> */}
            {/* <Link href="/return-policy" onClick={onClose} className="hover:text-gray-900">
              Return Policy
            </Link> */}
            <span>·</span>
            <Link href="/track-order" onClick={onClose} className="hover:text-gray-900">
              Track Order
            </Link>
            <span>·</span>
            <Link href="/offline-shops" onClick={onClose} className="hover:text-gray-900">
              Offline Shops
            </Link>
            <span>·</span>
            <Link href="/faq" onClick={onClose} className="hover:text-gray-900">
              FAQ
            </Link>
          </div>

          {/* Login/User Section */}
          <div className="p-3">
            {me ? (
              // User is logged in - show user info with link to profile
              <Link href="/user/profile" onClick={onClose}>
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-gray-900 truncate">{me.name}</p>
                    <p className="text-[9px] text-gray-500 truncate">{me.email}</p>
                  </div>
                </div>
              </Link>
            ) : (
              // User is not logged in - show login button
              <Link href="/login" onClick={onClose}>
                <button className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-normal text-gray-900 hover:bg-gray-50 transition-colors rounded-lg">
                  <User size={16} />
                  <span>Log in</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
