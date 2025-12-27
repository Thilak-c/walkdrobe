"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { Upload, Download, CheckCircle, XCircle, Store } from "lucide-react";

export default function WebsiteImportPage() {
  const [activeTab, setActiveTab] = useState("file"); // "file" or "offline"
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto pt-12 lg:pt-0">
          <h1 className="text-2xl font-bold mb-2">Import Products</h1>
          <p className="text-gray-600 mb-6">Import products from file or offline store</p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab("file")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "file"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              File Import
            </button>
            <button
              onClick={() => setActiveTab("offline")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "offline"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Store className="w-4 h-4 inline mr-2" />
              Import from Offline Store
            </button>
          </div>

          {activeTab === "file" ? <FileImportTab /> : <OfflineImportTab />}
        </div>
      </main>
    </div>
  );
}

function FileImportTab() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResults(null);

    const text = await f.text();
    let data = [];

    if (f.name.endsWith(".json")) {
      data = JSON.parse(text);
    } else if (f.name.endsWith(".csv")) {
      const lines = text.split("\n").filter(l => l.trim());
      const headers = lines[0].split(",").map(h => h.trim());
      data = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i]);
        return obj;
      });
    }
    setPreview(data.slice(0, 5));
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);

    const text = await file.text();
    let data = [];

    if (file.name.endsWith(".json")) {
      data = JSON.parse(text);
    } else if (file.name.endsWith(".csv")) {
      const lines = text.split("\n").filter(l => l.trim());
      const headers = lines[0].split(",").map(h => h.trim());
      data = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i]);
        return obj;
      });
    }

    try {
      const res = await fetch("/api/import-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: data, store: "website" }),
      });
      const result = await res.json();
      setResults(result);
    } catch (err) {
      setResults({ success: 0, failed: data.length, errors: [err.message] });
    }
    setImporting(false);
  };

  const downloadTemplate = (type) => {
    if (type === "json") {
      const template = [
        { itemId: "WEB001", name: "Product 1", category: "Category", price: 999, totalStock: 10, availableSizes: ["41","42","43","44","45","46"], sizeStock: { "41": 3, "42": 4, "43": 3, "44": 0, "45": 0, "46": 0 } },
        { itemId: "WEB002", name: "Product 2", category: "Category", price: 1499, totalStock: 5, availableSizes: ["41","42","43","44","45","46"], sizeStock: { "41": 1, "42": 1, "43": 1, "44": 1, "45": 1, "46": 0 } },
      ];
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "website_import_template.json";
      a.click();
    } else {
      const csv = "itemId,name,category,price,totalStock,availableSizes\nWEB001,Product 1,Category,999,10,41|42|43|44|45|46\nWEB002,Product 2,Category,1499,5,41|42|43|44|45|46";
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "website_import_template.csv";
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Templates */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Download Templates</h3>
        <div className="flex gap-3">
          <button onClick={() => downloadTemplate("json")} className="flex items-center gap-2 px-3 py-2 bg-white border rounded hover:bg-gray-50">
            <Download className="w-4 h-4" /> JSON Template
          </button>
          <button onClick={() => downloadTemplate("csv")} className="flex items-center gap-2 px-3 py-2 bg-white border rounded hover:bg-gray-50">
            <Download className="w-4 h-4" /> CSV Template
          </button>
        </div>
      </div>

      {/* Upload */}
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <input type="file" accept=".json,.csv" onChange={handleFileChange} className="hidden" id="file-upload" />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">Click to upload JSON or CSV file</p>
          {file && <p className="mt-2 text-blue-600 font-medium">{file.name}</p>}
        </label>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium mb-3">Preview (first 5 items)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0]).map(k => <th key={k} className="px-3 py-2 text-left">{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t">
                    {Object.values(row).map((v, j) => <td key={j} className="px-3 py-2">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleImport}
            disabled={importing}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import Products"}
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className={`p-4 rounded-lg ${results.success > 0 ? "bg-green-50" : "bg-red-50"}`}>
          <div className="flex items-center gap-2 mb-2">
            {results.success > 0 ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
            <span className="font-medium">Import Complete</span>
          </div>
          <p>Success: {results.success} | Failed: {results.failed}</p>
          {results.errors?.length > 0 && (
            <ul className="mt-2 text-sm text-red-600">
              {results.errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}


function OfflineImportTab() {
  const offlineProducts = useQuery(api.inventory.getAllInventory, {}) || [];
  const [selected, setSelected] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selected.length === offlineProducts.length) {
      setSelected([]);
    } else {
      setSelected(offlineProducts.map(p => p._id));
    }
  };

  const handleImport = async () => {
    if (selected.length === 0) return;
    setImporting(true);

    const productsToImport = offlineProducts
      .filter(p => selected.includes(p._id))
      .map(p => ({
        itemId: p.itemId,
        name: p.name,
        category: p.category,
        description: p.description,
        mainImage: p.mainImage,
        otherImages: p.otherImages,
        price: p.price,
        costPrice: p.costPrice,
        color: p.color,
        secondaryColor: p.secondaryColor,
        availableSizes: p.availableSizes || [],
        sizeStock: p.sizeStock || {},
        totalStock: p.currentStock || p.totalAvailable || 0,
      }));

    try {
      const res = await fetch("/api/import-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: productsToImport, store: "website" }),
      });
      const result = await res.json();
      setResults(result);
      setSelected([]);
    } catch (err) {
      setResults({ success: 0, failed: selected.length, errors: [err.message] });
    }
    setImporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-600">Select products from your offline store to import to website</p>
        <div className="flex gap-2">
          <button onClick={selectAll} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
            {selected.length === offlineProducts.length ? "Deselect All" : "Select All"}
          </button>
          <button
            onClick={handleImport}
            disabled={selected.length === 0 || importing}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? "Importing..." : `Import ${selected.length} Products`}
          </button>
        </div>
      </div>

      {results && (
        <div className={`p-4 rounded-lg ${results.success > 0 ? "bg-green-50" : "bg-red-50"}`}>
          <div className="flex items-center gap-2">
            {results.success > 0 ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
            <span>Imported: {results.success} | Failed: {results.failed}</span>
          </div>
          {results.errors?.length > 0 && (
            <ul className="mt-2 text-sm text-red-600">
              {results.errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-3">
        {offlineProducts.map(product => (
          <div
            key={product._id}
            onClick={() => toggleSelect(product._id)}
            className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
              selected.includes(product._id) ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(product._id)}
              onChange={() => {}}
              className="w-5 h-5"
            />
            {product.mainImage && (
              <img src={product.mainImage} alt="" className="w-12 h-12 object-cover rounded" />
            )}
            <div className="flex-1">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-gray-500">{product.itemId} • {product.category}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">₹{product.price}</p>
              <p className="text-sm text-gray-500">Stock: {product.currentStock || product.totalAvailable || 0}</p>
            </div>
          </div>
        ))}
        {offlineProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No products in offline store</p>
          </div>
        )}
      </div>
    </div>
  );
}
