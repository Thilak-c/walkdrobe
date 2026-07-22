"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReturnRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/policy/return"); }, [router]);
  return null;
}
