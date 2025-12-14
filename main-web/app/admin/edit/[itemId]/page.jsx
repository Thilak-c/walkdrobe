"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner"; // npm i sonner

export default function EditProductPage({ params }) {
  const { itemId } = use(params);
  const router = useRouter();

  // Data
  const product = useQuery(api.products.getById, { itemId });
  const updateProduct = useMutation(api.products.update);

  // Form
  const [form, setForm] = useState(null);
  const [initial, setInitial] = useState(null); // for reset/dirty
  const [loading, setLoading] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingOthers, setUploadingOthers] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Load product into form
  useEffect(() => {
    if (product) {
      const base = {
        ...product,
        price: Number(product.price ?? 0),
        buys: Number(product.buys ?? 0),
        inCart: Number(product.inCart ?? 0),
        otherImages: product.otherImages || [],
      };
      setForm(base);
      setInitial(base);
    }
  }, [product]);

  // Derived
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  const totalSales = useMemo(() => {
    const price = Number(form?.price || 0);
    const buys = Number(form?.buys || 0);
    return price * buys;
  }, [form]);

  // Leave guard when dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  // Keyboard shortcuts: Ctrl/Cmd+S to save, Esc to back
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        router.push(`/admin/product/${itemId}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [itemId, form]); // eslint-disable-line

  if (!form) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  // ------- Helpers -------
  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const validate = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Name is required";
    if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0)
      errs.price = "Enter a valid non-negative price";
    if (form.buys !== undefined && (isNaN(Number(form.buys)) || Number(form.buys) < 0))
      errs.buys = "Buys must be a non-negative number";
    return errs;
  };

  const uploadImage = async (file) => {
    // Basic checks
    if (!/^image\//.test(file.type)) {
      toast.error("Please upload an image file.");
      return null;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Image too large (max 6MB).");
      return null;
    }
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!data?.url) {
      toast.error("Upload failed.");
      return null;
    }
    return data.url;
  };

  const handleDrop = async (e, target = "other") => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    if (target === "main") {
      setUploadingMain(true);
      const url = await uploadImage(files[0]);
      if (url) setField("mainImage", url);
      setUploadingMain(false);
    } else {
      setUploadingOthers(true);
      const urls = [];
      for (const f of files) {
        const u = await uploadImage(f);
        if (u) urls.push(u);
      }
      setField("otherImages", [...(form.otherImages || []), ...urls]);
      setUploadingOthers(false);
    }
  };

  const removeOtherImage = (index) => {
    setField(
      "otherImages",
      form.otherImages.filter((_, i) => i !== index)
    );
  };

  const moveOtherImage = (index, dir) => {
    const arr = [...form.otherImages];
    const ni = index + dir;
    if (ni < 0 || ni >= arr.length) return;
    const tmp = arr[index];
    arr[index] = arr[ni];
    arr[ni] = tmp;
    setField("otherImages", arr);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    console.log("Save button clicked", { form, dirty, loading });
    const errs = validate();
    if (Object.keys(errs).length) {
      console.log("Validation errors:", errs);
      Object.values(errs).forEach((m) => toast.error(m));
      return;
    }
    setLoading(true);
    try {
      console.log("Updating product...", form.itemId);
      await updateProduct({
        itemId: form.itemId,
        updates: {
          name: form.name?.trim(),
          type: typeof form.type === 'string' ? form.type?.trim() : form.type,
          category: form.category?.trim(),
          price: Number(form.price),
          buys: Number(form.buys ?? 0),
          inCart: Number(form.inCart ?? 0),
          description: form.description,
          mainImage: form.mainImage,
          otherImages: form.otherImages,
        },
      });
      console.log("Product updated successfully");
      setInitial(form);
      setLastSavedAt(new Date());
      toast.success("Saved ✔");
      router.push(`/admin/product/${form.itemId}`);
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Save failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(initial);
    toast.message("Changes discarded");
  };

  // ------- UI -------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/product/${itemId}`}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              ← Back
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Edit Product</h1>
          </div>
          <div className="text-sm text-gray-500">
            {lastSavedAt ? `Last saved: ${lastSavedAt.toLocaleTimeString()}` : "Unsaved changes may be lost"}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Price" value={`₹${Number(form.price || 0).toLocaleString()}`} sub="per unit" />
          <StatCard label="Buys" value={Number(form.buys || 0).toLocaleString()} sub="lifetime" />
          <StatCard
            label="Total Sales"
            value={`₹${Number(totalSales || 0).toLocaleString()}`}
            sub="buys × price"
            accent="green"
          />
        </div>

        {/* Form + Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Field
              label="Product Name"
              error={!form.name?.trim() ? " " : ""}
              input={
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g., Classic Black Hoodie"
                  required
                />
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Type"
                input={
                  <input
                    type="text"
                    name="type"
                    value={form.type || ""}
                    onChange={(e) => setField("type", e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                    placeholder="e.g., Apparel"
                  />
                }
              />
              <Field
                label="Category"
                input={
                  <input
                    type="text"
                    name="category"
                    value={form.category || ""}
                    onChange={(e) => setField("category", e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                    placeholder="e.g., Hoodies"
                  />
                }
              />
              <Field
                label="Price (₹)"
                error={
                  form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0
                    ? "Enter valid price"
                    : ""
                }
                input={
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                    placeholder="0.00"
                  />
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Buys"
                input={
                  <input
                    type="number"
                    min="0"
                    name="buys"
                    value={form.buys ?? 0}
                    onChange={(e) => setField("buys", e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                  />
                }
              />
              <Field
                label="In Cart"
                input={
                  <input
                    type="number"
                    min="0"
                    name="inCart"
                    value={form.inCart ?? 0}
                    onChange={(e) => setField("inCart", e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                  />
                }
              />
            </div>

            <Field
              label="Description"
              input={
                <textarea
                  name="description"
                  value={form.description || ""}
                  onChange={(e) => setField("description", e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  rows={4}
                  placeholder="Describe the product features, materials, fit, care…"
                />
              }
            />

            {/* Main Image with drag-n-drop */}
            <div
              className="rounded-2xl border-2 border-dashed p-4 hover:bg-gray-50 transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "main")}
            >
              <label className="block text-sm font-medium mb-2">Main Image</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingMain(true);
                    const url = await uploadImage(file);
                    if (url) setField("mainImage", url);
                    setUploadingMain(false);
                  }}
                />
                {uploadingMain && <span className="text-sm text-gray-500">Uploading…</span>}
              </div>
              {form.mainImage && (
                <div className="mt-3">
                  <img src={form.mainImage} alt="Main" className="w-36 h-36 rounded-xl object-cover border" />
                  <button
                    type="button"
                    onClick={() => setField("mainImage", "")}
                    className="mt-2 text-sm text-red-600 hover:underline"
                  >
                    Remove main image
                  </button>
                </div>
              )}
            </div>

            {/* Other Images with drag-n-drop + reorder */}
            <div
              className="rounded-2xl border-2 border-dashed p-4 hover:bg-gray-50 transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "other")}
            >
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium mb-2">Other Images</label>
                {uploadingOthers && <span className="text-sm text-gray-500">Uploading…</span>}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length) return;
                  setUploadingOthers(true);
                  const urls = [];
                  for (const f of files) {
                    const u = await uploadImage(f);
                    if (u) urls.push(u);
                  }
                  setField("otherImages", [...(form.otherImages || []), ...urls]);
                  setUploadingOthers(false);
                }}
              />
              <div className="flex flex-wrap gap-3 mt-3">
                {form.otherImages?.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img} className="w-24 h-24 object-cover rounded-xl border shadow-sm" alt="" />
                    <div className="absolute inset-x-0 -bottom-2 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => moveOtherImage(idx, -1)}
                        className="px-2 py-0.5 text-xs bg-white border rounded shadow"
                        aria-label="Move left"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOtherImage(idx, +1)}
                        className="px-2 py-0.5 text-xs bg-white border rounded shadow"
                        aria-label="Move right"
                      >
                        →
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOtherImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Live Preview Card */}
          <aside className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <img
                  src={form.mainImage || "/placeholder.png"}
                  alt="Preview"
                  className="w-36 h-36 rounded-xl object-cover border"
                />
                <div>
                  <div className="text-xl font-bold">{form.name || "Product Name"}</div>
                  <div className="text-gray-600">{form.type || "Type"}</div>
                  <div className="mt-1">
                    <span className="text-green-700 font-semibold">
                      ₹{Number(form.price || 0).toLocaleString()}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">incl. taxes</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {form.description || "Product description will appear here."}
              </p>
              <div className="text-sm text-gray-500">
                Category: <span className="font-medium">{form.category || "—"}</span>
              </div>
              <div className="text-sm text-gray-500">
                Gallery: {form.otherImages?.length || 0} image{(form.otherImages?.length || 0) === 1 ? "" : "s"}
              </div>
            </div>
          </aside>
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-4 mt-8">
          <div className="max-w-5xl mx-auto bg-white shadow-lg border rounded-xl p-3 px-4 flex items-center justify-between">
            <div className="text-sm">
              {dirty ? (
                <span className="text-amber-700">Unsaved changes</span>
              ) : (
                <span className="text-gray-500">All changes saved</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={!dirty}
                className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !dirty}
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900 disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save (Ctrl/Cmd+S)"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small UI Primitives ---------- */
function Field({ label, input, error }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      {input}
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  const ring =
    accent === "green"
      ? "ring-green-200"
      : accent === "blue"
      ? "ring-blue-200"
      : "ring-gray-200";
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 ring-1 ${ring}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
