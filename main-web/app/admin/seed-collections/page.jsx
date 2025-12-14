"use client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function SeedCollectionsPage() {
  const [status, setStatus] = useState("");
  const seedCollections = useMutation(api.seedCollections.seedDefaultCollections);

  const handleSeed = async () => {
    try {
      setStatus("Seeding collections...");
      const result = await seedCollections();
      setStatus(`Success! ${result.message}. Created ${result.count} collections.`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Seed Collections</h1>
        <p className="text-gray-600 mb-6">
          Click the button below to add default collections to your database.
        </p>
        
        <button
          onClick={handleSeed}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Seed Collections
        </button>

        {status && (
          <div className={`mt-4 p-4 rounded ${
            status.includes("Error") 
              ? "bg-red-100 text-red-700" 
              : "bg-green-100 text-green-700"
          }`}>
            {status}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500">
          <p className="font-semibold mb-2">This will create:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>New Arrivals (last 30 days)</li>
            <li>Top of the Week (last 7 days)</li>
            <li>Best Sellers (by sales count)</li>
            <li>Trending Now (by views)</li>
            <li>Sale (manual collection)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
