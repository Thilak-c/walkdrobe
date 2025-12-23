"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Onboarding is now skipped - redirect to home
export default function OnboardingPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/");
  }, [router]);
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Setting up your account...</p>
      </div>
    </div>
  );
}
