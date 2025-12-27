"use client";
import { useState, useEffect } from "react";
import { api } from "../main-web/convex/_generated/api";

export function getStoreTypeFromLocal() {
  if (typeof window === "undefined") return "website";
  try {
    const raw = localStorage.getItem("insys_auth");
    if (!raw) return "website";
    const parsed = JSON.parse(raw || "{}");
    return parsed.storeType === "offline" ? "offline" : "website";
  } catch (e) {
    return "website";
  }
}

export function useStoreApi() {
  const [storeType, setStoreType] = useState("website");

  useEffect(() => {
    setStoreType(getStoreTypeFromLocal());
    const onStorage = () => setStoreType(getStoreTypeFromLocal());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Return the appropriate convex API namespace (shape differs slightly)
  const apiNamespace = storeType === "offline" ? api.offStore : api.products;
  return { storeType, api: apiNamespace };
}
