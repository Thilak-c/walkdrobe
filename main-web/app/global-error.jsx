"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4 md:p-6">
          <div className="max-w-md w-full bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-8 space-y-4 md:space-y-6 text-center">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-7 h-7 md:w-10 md:h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="space-y-1 md:space-y-2">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                Critical Error
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Something went wrong with the application. Please try refreshing the page.
              </p>
            </div>

            <div className="space-y-2 md:space-y-3">
              <button
                onClick={reset}
                className="w-full px-4 md:px-6 py-2.5 md:py-3 bg-gray-900 text-white rounded-lg md:rounded-xl text-sm md:text-base font-medium hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
              <a
                href="/"
                className="block w-full px-4 md:px-6 py-2.5 md:py-3 bg-white text-gray-900 rounded-lg md:rounded-xl text-sm md:text-base font-medium border-2 border-gray-200 hover:border-gray-900 transition-colors"
              >
                Go Home
              </a>
            </div>

            <p className="text-[10px] md:text-xs text-gray-400 break-all">
              Error: {error?.message || "Unknown error"}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
