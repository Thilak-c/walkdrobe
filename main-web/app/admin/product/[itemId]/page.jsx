"use client";

import { use,useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ShareButton from "@/ components/ShareButton";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/* -------------------- Utilities -------------------- */
const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n || 0));
const formatDateTime = (d) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));

/* Smooth counter with easing */
function AnimatedNumber({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = 0;
    const to = Number(value || 0);

    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{formatINR(display)}</>;
}

/* Small UI primitives */
const Badge = ({ color = "gray", children }) => {
  const map = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[color]}`}>{children}</span>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex gap-2 items-baseline">
    <span className="font-semibold text-gray-800">{label}:</span>
    <span className="text-gray-600">{value ?? "—"}</span>
  </div>
);

/* Fullscreen lightbox for images */
function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!src) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <img
        src={src}
        alt={alt || "Image"}
        className="max-h-[85vh] max-w-[95vw] rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-900 rounded-full w-10 h-10 font-bold shadow"
        aria-label="Close image"
      >
        ×
      </button>
    </div>
  );
}

/* Skeleton loader */
const Loader = () => (
  <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="animate-pulse max-w-5xl mx-auto space-y-6">
      <div className="h-10 w-64 bg-gray-200 rounded" />
      <div className="bg-white p-6 rounded-xl shadow flex justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="flex gap-6">
          <div className="h-6 w-28 bg-gray-200 rounded" />
          <div className="h-6 w-40 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-8 bg-white p-6 rounded-2xl shadow">
        <div className="h-96 bg-gray-200 rounded-xl" />
        <div className="space-y-4">
          <div className="h-6 w-3/4 bg-gray-200 rounded" />
          <div className="h-6 w-1/2 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-5 bg-gray-200 rounded" />
            <div className="h-5 bg-gray-200 rounded" />
            <div className="h-5 bg-gray-200 rounded" />
            <div className="h-5 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* -------------------- Page -------------------- */
export default function ProductDetailsPage({ params: paramsPromise }) {
   const params = use(paramsPromise); // <-- unwrap the params here
  const { itemId } = params;
  const product = useQuery(api.products.getById, { itemId });
  const toggleHidden = useMutation(api.products.toggleHidden);

  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [optimisticHidden, setOptimisticHidden] = useState(null);

  // Sync optimistic hidden with product
  useEffect(() => {
    if (product?.isHidden !== undefined) setOptimisticHidden(product.isHidden);
  }, [product?.isHidden]);

  const price = Number(product?.price || 0);
  const buys = Number(product?.buys || 0);
  const totalSales = useMemo(() => price * buys, [price, buys]);
  const mainImageToShow = useMemo(
    () => selectedImage || product?.mainImage || "/placeholder.png",
    [selectedImage, product?.mainImage]
  );

  const thumbnails = useMemo(() => {
    if (!product) return [];
    const others = product.otherImages || [];
    const list = product.mainImage ? [product.mainImage, ...others] : others;
    // De-dupe while preserving order
    return [...new Set(list.filter(Boolean))];
  }, [product]);

  const handleToggleHidden = async () => {
    if (!product) return;
    const next = !optimisticHidden;
    setOptimisticHidden(next);
    try {
      await toggleHidden({ itemId: product.itemId, isHidden: next });
    } catch {
      setOptimisticHidden(!next); // revert
    }
  };

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* noop */
    }
  };

  if (!product) return <Loader />;

  const notFound = product === null; // if your query returns null when missing
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow p-8 text-center space-y-3">
          <div className="text-2xl font-bold">Product not found</div>
          <Link
            href="/admin"
            className="inline-block mt-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            Go to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Top Bar */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition"
          >
            ← Back
          </button>
         <ShareButton itemId={product.itemId} />
        </div>
        <Link
          href={`/admin/edit/${product.itemId}`}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition"
        >
          ✏ Edit Product
        </Link>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header Info */}
        <div className="bg-white/80 backdrop-blur p-6 rounded-xl shadow-md mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{product.name}</h1>
            <Badge color="gray">ID: {product.itemId}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-lg font-medium">
              <span className="font-semibold text-gray-700">Buys:</span>{" "}
              <span className="text-blue-600 font-bold text-xl">
                <AnimatedNumber value={buys} />
              </span>
            </div>
            <div className="text-lg font-medium">
              <span className="font-semibold text-gray-700">Total Sales:</span>{" "}
              <span className="text-green-600 font-bold text-xl">
                ₹<AnimatedNumber value={totalSales} />
              </span>
            </div>
          </div>
        </div>

        {/* Product Content */}
        <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-lg grid md:grid-cols-2 gap-10">
          {/* Image Section */}
          <div>
            <div className="relative group">
              <img
                src={mainImageToShow}
                alt={product.name}
                className="w-full h-96 object-cover rounded-xl shadow-lg border hover:scale-[1.02] transition-transform duration-300"
                onClick={() => setLightboxSrc(mainImageToShow)}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.png";
                }}
              />
              <button
                onClick={() => setLightboxSrc(mainImageToShow)}
                className="opacity-0 group-hover:opacity-100 transition absolute bottom-3 right-3 bg-white/95 text-gray-800 px-3 py-1.5 rounded-lg shadow"
                aria-label="Open image"
              >
                🔍 Zoom
              </button>
            </div>

            {thumbnails.length > 0 && (
              <ThumbStrip
                thumbnails={thumbnails}
                selectedImage={selectedImage}
                mainImage={product.mainImage}
                onSelect={setSelectedImage}
              />
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <p className="text-gray-700 leading-relaxed">{product.description || "No description provided."}</p>

            <div className="flex flex-wrap gap-2">
              {product.category && <Badge color="blue">{product.category}</Badge>}
              {product.type && <Badge color="green">{product.type}</Badge>}
              {optimisticHidden ? <Badge color="red">Hidden</Badge> : <Badge color="amber">Visible</Badge>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-gray-800">
              <InfoRow label="Price" value={`₹${formatINR(price)}`} />
              <InfoRow label="Created At" value={formatDateTime(product.createdAt)} />
              <InfoRow label="In Cart" value={product.inCart} />
              <div className="flex items-center gap-3">
                <span className="font-semibold">Hidden:</span>
                <span>{optimisticHidden ? "Yes" : "No"}</span>
                <button
                  onClick={handleToggleHidden}
                  className={`px-4 py-1.5 rounded-lg text-white text-sm font-semibold shadow transition ${
                    optimisticHidden ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {optimisticHidden ? "Unhide" : "Hide"}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm text-gray-500">
                Last updated: {product.updatedAt ? formatDateTime(product.updatedAt) : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox src={lightboxSrc} alt={product.name} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}

/* Thumbnails with keyboard support */
function ThumbStrip({ thumbnails, selectedImage, mainImage, onSelect }) {
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onKey = (e) => {
      const items = Array.from(el.querySelectorAll("img[data-thumb='1']"));
      const currentIndex = items.findIndex((i) => i.dataset.active === "1");
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = items[(currentIndex + 1) % items.length];
        next?.focus();
        onSelect(next?.dataset.src || null);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = items[(currentIndex - 1 + items.length) % items.length];
        prev?.focus();
        onSelect(prev?.dataset.src || null);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [onSelect, thumbnails]);

  const effectiveSelected = selectedImage || mainImage;

  return (
    <div
      ref={listRef}
      className="flex gap-3 flex-wrap mt-4"
      role="listbox"
      aria-label="Product image thumbnails"
      tabIndex={0}
    >
      {thumbnails.map((img, idx) => {
        const active = effectiveSelected === img;
        return (
          <img
            key={`${img}-${idx}`}
            src={img}
            alt={`Thumbnail ${idx + 1}`}
            data-thumb="1"
            data-active={active ? "1" : "0"}
            data-src={img}
            onClick={() => onSelect(img)}
            onKeyDown={() => {}}
            tabIndex={0}
            className={`w-20 h-20 object-cover rounded-lg border shadow cursor-pointer transition-all duration-200 hover:scale-110 outline-none ${
              active ? "ring-2 ring-blue-500" : "focus:ring-2 focus:ring-blue-400"
            }`}
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        );
      })}
    </div>
  );
}
