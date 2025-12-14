// components/Toast.js
import { useEffect, useState } from "react";

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // remove from DOM after fade
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const bgColor =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-gray-800";

  return (
    <div className={`fixed top-5 right-5 px-5 py-3 rounded-xl shadow-xl text-white flex items-center gap-4 ${bgColor} animate-toast`}>
      <span>{message}</span>
      <button onClick={onClose} className="font-bold text-xl leading-none hover:scale-110 transition-transform">
        ×
      </button>

      <style jsx>{`
        @keyframes toast-slide {
          0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-toast {
          animation: toast-slide 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
