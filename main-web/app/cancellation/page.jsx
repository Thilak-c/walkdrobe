"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CancellationRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/policy/cancellation"); }, [router]);
  return null;
}
