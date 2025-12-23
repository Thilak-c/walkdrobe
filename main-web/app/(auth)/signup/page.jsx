"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect signup to login since we now use phone OTP
export default function SignupPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
}
