"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShippingRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/policy/shipping"); }, [router]);
  return null;
}
