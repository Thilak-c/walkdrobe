"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PrivacyRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/policy/privacy"); }, [router]);
  return null;
}
