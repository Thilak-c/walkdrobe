"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function AccessGate({ children }) {
  const requestAccess = useMutation(api.dailyAccess.requestAccess);
  const dailyCount = useQuery(api.dailyAccess.getDailyCount);
  const [allowed, setAllowed] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    async function check() {
      // Generate or reuse visitorId
      let userIdV = localStorage.getItem("visitorId");
      if (!userIdV) {
        userIdV = "visitor-" + Math.random().toString(36).slice(2, 9);
        localStorage.setItem("visitorId", userIdV);
      }

      try {
        const res = await requestAccess({ userIdV: userIdV });
        setAllowed(res.success);

        // Show popup only on first visit
        const seenPopup = localStorage.getItem("seenTrialPopup");
        if (res.success && !seenPopup) {
          setShowPopup(true);
          localStorage.setItem("seenTrialPopup", "true");
        }
      } catch (err) {
        setAllowed(false);
      }
    }
    check();
  }, [requestAccess]);

  if (allowed === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-black">
        <p>Checking access...</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-white p-6">
        <Link
          href="/tail-report" // replace with real handler
          className="fixed z-50 top-[37%] right-0 -translate-y-1/2 transform -rotate-90 origin-bottom-right border-black/20 border-1 bg-white text-red-700 py-1 font-extrabold px-3 rounded shadow-lg"
        >
          Report Issus
        </Link>

        {/* Trial Site Badge */}
        <footer
          onClick={() => setShowPopup(true)}
          className="fixed z-50 top-[55%] right-0 -translate-y-1/2 transform -rotate-90 origin-bottom-right border-black/20 border-1 bg-white text-black py-1 px-3 font-extrabold rounded"
        >
          Trial Site: {dailyCount ?? 0}/500
        </footer>
        <div className="bg-gray-100 p-8 rounded-xl text-center max-w-md">
          <h1 className="text-2xl text-red-600 font-bold mb-4">
            Access Denied
          </h1>
          <p className="mb-4 text-black">Daily limit of 500 users reached.</p>
          <p className="text-sm text-gray-700">Try again tomorrow.</p>
          <div className="mt-6 text-xs text-red-500">
            Today’s usage: {dailyCount ?? 0}/500
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Report Badge */}
      <Link
        href="/tail-report" // replace with real handler
        className="fixed z-50 top-[37%] right-0 -translate-y-1/2 transform -rotate-90 origin-bottom-right border-black/20 border-1 bg-white text-red-700 py-1 font-extrabold px-3 rounded shadow-lg"
      >
        Report Issus
      </Link>

      {/* Trial Site Badge */}
      <footer
        onClick={() => setShowPopup(true)}
        className="fixed z-50 top-[55%] right-0 -translate-y-1/2 transform -rotate-90 origin-bottom-right border-black/20 border-1 bg-white text-black py-1 px-3 font-extrabold rounded"
      >
        Trial Site: {dailyCount ?? 0}/500
      </footer>

      {/* Trial Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white text-gray-900 m-4 p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-600">
              ⚠️ Trial Site
            </h2>
            <p className="mb-6 text-sm leading-relaxed">
              This is a{" "}
              <span className="font-semibold">trial/demo version</span> of the
              site. Whatever you do here will{" "}
              <span className="font-bold">NOT be saved</span> or carried over to
              the real version. Features, data, and actions are for{" "}
              <span className="font-semibold">testing only</span>.
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
}
