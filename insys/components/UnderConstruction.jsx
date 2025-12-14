"use client";

import { useRouter } from "next/navigation";
import { Hammer } from "lucide-react";

export default function UnderConstruction() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center animate-fadeIn">
        {/* Animated Hammer */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-amber-100 rounded-2xl" />
          <div className="absolute inset-0 flex items-center justify-center animate-hammer">
            <Hammer className="w-12 h-12 text-amber-500" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-poppins">
          Under Construction
        </h2>
        <p className="text-gray-500 mb-6">
          The Website Store management is currently being built. Please check back soon!
        </p>

        <button
          onClick={() => {
            // Switch back to offline mode
            const authData = localStorage.getItem("insys_auth");
            if (authData) {
              const parsed = JSON.parse(authData);
              parsed.storeType = "offline";
              localStorage.setItem("insys_auth", JSON.stringify(parsed));
            }
            router.push("/login");
          }}
          className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
        >
          Go Back to Login
        </button>
      </div>

      <style jsx global>{`
        @keyframes hammer {
          0%, 100% {
            transform: rotate(-15deg);
          }
          50% {
            transform: rotate(15deg);
          }
        }
        .animate-hammer {
          animation: hammer 0.6s ease-in-out infinite;
          transform-origin: bottom center;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
