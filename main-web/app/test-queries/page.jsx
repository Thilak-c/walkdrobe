"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function TestQueriesPage() {
  const [activeTest, setActiveTest] = useState(null);

  // Test 1: Get all products with limit
  const allProducts = useQuery(
    api.products.getAllProducts,
    activeTest === "allProducts" ? { limit: 10 } : "skip"
  );

  // Test 2: Get trending products
  const trendingProducts = useQuery(
    api.views.getMostViewedProducts,
    activeTest === "trending" ? { limit: 8, category: "Men" } : "skip"
  );

  // Test 3: Get all products (no limit)
  const allProductsNoLimit = useQuery(
    api.products.getAll,
    activeTest === "getAll" ? {} : "skip"
  );

  // Test 4: Get top picks
  const topPicks = useQuery(
    api.products.getTopPicks,
    activeTest === "topPicks" ? {} : "skip"
  );

  const renderTestResult = (testName, data) => {
    if (activeTest !== testName) return null;

    return (
      <div className="mt-4 p-4 border rounded">
        <h3 className="font-bold mb-2">Results for: {testName}</h3>

        {data === undefined && (
          <div className="text-yellow-600">
            ⏳ Loading... (if this stays forever, the query is stuck)
          </div>
        )}

        {data !== undefined && data.length === 0 && (
          <div className="text-orange-600">
            ⚠️ Query returned empty array (no products found)
          </div>
        )}

        {data && data.length > 0 && (
          <div className="text-green-600">
            ✅ Success! Loaded {data.length} products
            <div className="mt-2 text-sm text-gray-700">
              <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Convex Query Test Page</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Individual Queries</h2>
          <p className="text-gray-600 mb-6">
            Click each button to test one query at a time. Watch for loading states and results.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setActiveTest("allProducts")}
              className={`w-full p-3 rounded text-left ${activeTest === "allProducts"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
                }`}
            >
              Test 1: products.getAllProducts (limit: 10)
            </button>
            {renderTestResult("allProducts", allProducts)}

            <button
              onClick={() => setActiveTest("trending")}
              className={`w-full p-3 rounded text-left ${activeTest === "trending"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
                }`}
            >
              Test 2: views.getMostViewedProducts (Men, limit: 8)
            </button>
            {renderTestResult("trending", trendingProducts)}

            <button
              onClick={() => setActiveTest("getAll")}
              className={`w-full p-3 rounded text-left ${activeTest === "getAll"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
                }`}
            >
              Test 3: products.getAll (no limit - used by NewArrivals)
            </button>
            {renderTestResult("getAll", allProductsNoLimit)}

            <button
              onClick={() => setActiveTest("topPicks")}
              className={`w-full p-3 rounded text-left ${activeTest === "topPicks"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
                }`}
            >
              Test 4: products.getTopPicks (used by TopPicks)
            </button>
            {renderTestResult("topPicks", topPicks)}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click a test button</li>
              <li>Watch for the loading state (⏳)</li>
              <li>If it stays loading forever, that query is the problem</li>
              <li>If it shows ✅, the query works fine</li>
              <li>If it shows ⚠️, the query works but returns no data</li>
            </ol>
          </div>

          <button
            onClick={() => setActiveTest(null)}
            className="mt-4 w-full p-3 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reset All Tests
          </button>
        </div>

        <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <div className="text-sm space-y-1">
            <p>Active Test: <strong>{activeTest || "None"}</strong></p>
            <p>allProducts: <strong>{allProducts === undefined ? "undefined" : `${allProducts?.length} items`}</strong></p>
            <p>trendingProducts: <strong>{trendingProducts === undefined ? "undefined" : `${trendingProducts?.length} items`}</strong></p>
            <p>allProductsNoLimit: <strong>{allProductsNoLimit === undefined ? "undefined" : `${allProductsNoLimit?.length} items`}</strong></p>
            <p>topPicks: <strong>{topPicks === undefined ? "undefined" : `${topPicks?.length} items`}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
