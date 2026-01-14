"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useRef } from "react";

export default function PerfTestPage() {
  const [showFull, setShowFull] = useState(false);
  const [limit, setLimit] = useState(1000);
  const [fullLoadTime, setFullLoadTime] = useState(null);
  const [cardLoadTime, setCardLoadTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fullStartTime = useRef(null);
  const cardStartTime = useRef(null);
  
  // OLD WAY: Full product data (all fields) - ALL PRODUCTS
  const fullProducts = useQuery(api.products.getAll, { limit });
  
  // NEW WAY: Card-only data (minimal fields) - ALL PRODUCTS
  const cardProducts = useQuery(api.products.getProductsForCards, { limit });

  // Track load times
  useEffect(() => {
    if (isLoading) {
      fullStartTime.current = performance.now();
      cardStartTime.current = performance.now();
    }
  }, [isLoading]);

  useEffect(() => {
    if (fullProducts && fullStartTime.current && isLoading) {
      setFullLoadTime(performance.now() - fullStartTime.current);
    }
  }, [fullProducts]);

  useEffect(() => {
    if (cardProducts && cardStartTime.current && isLoading) {
      setCardLoadTime(performance.now() - cardStartTime.current);
      setIsLoading(false);
    }
  }, [cardProducts]);

  const handleRefresh = () => {
    setFullLoadTime(null);
    setCardLoadTime(null);
    setIsLoading(true);
    // Force re-fetch by changing limit temporarily
    const currentLimit = limit;
    setLimit(0);
    setTimeout(() => setLimit(currentLimit), 50);
  };

  const calculateSize = (data) => {
    if (!data) return 0;
    return new Blob([JSON.stringify(data)]).size;
  };

  const fullSize = calculateSize(fullProducts);
  const cardSize = calculateSize(cardProducts);
  const savings = fullSize > 0 ? Math.round((1 - cardSize / fullSize) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Performance Test: Before vs After</h1>
        <p className="text-gray-600 mb-4">Compare data transfer for ALL {fullProducts?.length || '...'} products in database</p>

        {/* Limit Selector */}
        <div className="bg-white rounded-xl border p-4 mb-8 flex items-center gap-4 flex-wrap">
          <label className="font-medium text-gray-700">How many products to fetch?</label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            max="5000"
          />
          <div className="flex gap-2">
            {[10, 50, 100, 500, 1000].map(n => (
              <button
                key={n}
                onClick={() => setLimit(n)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  limit === n 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isLoading ? "Loading..." : "🔄 Refresh & Time"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Before */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <h3 className="text-red-800 font-semibold mb-1">BEFORE (Full Data)</h3>
            <p className="text-4xl font-bold text-red-600">{(fullSize / 1024).toFixed(2)} KB</p>
            <p className="text-red-700 text-sm mt-2">
              {fullProducts?.length || 0} products × {fullProducts?.[0] ? Object.keys(fullProducts[0]).length : 0} fields each
            </p>
            {fullLoadTime && (
              <p className="text-red-800 text-sm mt-2 font-mono bg-red-100 px-2 py-1 rounded">
                ⏱️ {fullLoadTime.toFixed(0)}ms
              </p>
            )}
          </div>

          {/* After */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <h3 className="text-green-800 font-semibold mb-1">AFTER (Card Only)</h3>
            <p className="text-4xl font-bold text-green-600">{(cardSize / 1024).toFixed(2)} KB</p>
            <p className="text-green-700 text-sm mt-2">
              {cardProducts?.length || 0} products × {cardProducts?.[0] ? Object.keys(cardProducts[0]).length : 0} fields each
            </p>
            {cardLoadTime && (
              <p className="text-green-800 text-sm mt-2 font-mono bg-green-100 px-2 py-1 rounded">
                ⏱️ {cardLoadTime.toFixed(0)}ms
              </p>
            )}
          </div>

          {/* Savings */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-blue-800 font-semibold mb-1">DATA SAVED</h3>
            <p className="text-4xl font-bold text-blue-600">{savings}%</p>
            <p className="text-blue-700 text-sm mt-2">
              {((fullSize - cardSize) / 1024).toFixed(2)} KB less per request
            </p>
          </div>
        </div>

        {/* Fields Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Before Fields */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-red-600 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              BEFORE: All Fields Returned
            </h3>
            {fullProducts?.[0] && (
              <div className="space-y-1 text-sm">
                {Object.keys(fullProducts[0]).map(key => (
                  <div key={key} className="flex justify-between py-1 border-b border-gray-100">
                    <span className="font-mono text-gray-600">{key}</span>
                    <span className="text-gray-400 truncate max-w-[200px]">
                      {typeof fullProducts[0][key] === 'object' 
                        ? JSON.stringify(fullProducts[0][key]).slice(0, 30) + '...'
                        : String(fullProducts[0][key]).slice(0, 30)}
                    </span>
                  </div>
                ))}
                <p className="text-red-600 font-semibold pt-2">
                  Total: {Object.keys(fullProducts[0]).length} fields
                </p>
              </div>
            )}
          </div>

          {/* After Fields */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-green-600 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              AFTER: Only Card Fields
            </h3>
            {cardProducts?.[0] && (
              <div className="space-y-1 text-sm">
                {Object.keys(cardProducts[0]).map(key => (
                  <div key={key} className="flex justify-between py-1 border-b border-gray-100">
                    <span className="font-mono text-gray-600">{key}</span>
                    <span className="text-gray-400 truncate max-w-[200px]">
                      {String(cardProducts[0][key]).slice(0, 30)}
                    </span>
                  </div>
                ))}
                <p className="text-green-600 font-semibold pt-2">
                  Total: {Object.keys(cardProducts[0]).length} fields ✓
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Raw JSON Toggle */}
        <div className="bg-white rounded-xl border p-6">
          <button 
            onClick={() => setShowFull(!showFull)}
            className="mb-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            {showFull ? "Hide" : "Show"} Raw JSON Data
          </button>
          
          {showFull && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Full Product (1 item)</h4>
                <pre className="bg-red-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(fullProducts?.[0], null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Card Product (1 item)</h4>
                <pre className="bg-green-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(cardProducts?.[0], null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* What's Removed */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-semibold text-yellow-800 mb-3">Fields Removed in Optimized Query:</h3>
          <div className="flex flex-wrap gap-2">
            {fullProducts?.[0] && cardProducts?.[0] && 
              Object.keys(fullProducts[0])
                .filter(key => !Object.keys(cardProducts[0]).includes(key))
                .map(key => (
                  <span key={key} className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-mono">
                    {key}
                  </span>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
