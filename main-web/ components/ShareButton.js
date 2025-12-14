// components/ShareButton.js
import { useState } from "react";
import Toast from "./Toast";

export default function ShareButton() {
  const [toast, setToast] = useState(null);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href); // copy URL
    setToast("Link copied to clipboard!");
    setTimeout(() => setToast(null), 3000); // auto-hide
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Share
      </button>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
