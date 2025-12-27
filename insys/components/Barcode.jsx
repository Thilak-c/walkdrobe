"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

// Improved barcode renderer using JsBarcode (CODE128) and SVG for printing
export default function Barcode({ value, printable = true, showText = true }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      // Render CODE128 into the SVG element.
      // We do not set absolute pixel width here; for printing we scale SVG via CSS to exact mm.
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        displayValue: showText,
        font: "monospace",
        fontOptions: "bold",
        fontSize: 12,
        textMargin: 4,
        margin: 8, // quiet zone in px (keeps left/right margins)
        lineColor: "#000000",
        height: 80, // tall bars for better scanner reliability
        width: 2 // bar narrow width; final physical size controlled by CSS mm width
      });
    } catch (e) {
      // fallback: render nothing
      console.error("Barcode render error", e);
    }
  }, [value, showText]);

  const handlePrint = () => {
    if (!svgRef.current || !printable) return;

    const svgHtml = svgRef.current.outerHTML;

    const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Label</title>
        <style>
          @page { size: 50mm 25mm; margin: 0mm; }
          html,body{margin:0;padding:0;background:#fff}
          body{width:50mm;height:25mm;display:flex;align-items:center;justify-content:center}
          /* Leave at least 5mm quiet zone left/right */
          .label { width:40mm; display:flex; align-items:center; justify-content:center }
          .label svg{ width:100%; height:auto; display:block }
          /* Ensure printer prints at 100%: users must select "Actual size"/100% in print dialog */
        </style>
      </head>
      <body>
        <div class="label">${svgHtml}</div>
        <script>
          // Auto-print and close
          function tryPrint(){
            setTimeout(()=>{ window.print(); setTimeout(()=>window.close(),200); },100);
          }
          tryPrint();
        </script>
      </body>
    </html>`;

    // Use a blob URL to provide a real URL (some browsers show about:blank in headers)
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) {
      alert("Please allow popups to print barcode");
    }
  };

  return (
    <div className={printable ? "cursor-pointer" : ""} onClick={handlePrint} title={printable ? "Click to print label" : undefined}>
      <svg ref={svgRef} />
    </div>
  );
}

// Barcode scanner input component (unchanged behavior)
export function BarcodeInput({ onScan, placeholder = "Scan or enter barcode..." }) {
  const inputRef = useRef(null);
  const bufferRef = useRef("");
  const timeoutRef = useRef(null);

  // Clear the visible input a short time after a successful match elsewhere in the app
  useEffect(() => {
    const handler = () => {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }, 1000);
    };
    window.addEventListener("barcode-scan-success", handler);
    return () => window.removeEventListener("barcode-scan-success", handler);
  }, []);

  const handleKeyDown = (e) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (e.key === "Enter" && bufferRef.current) {
      const trimmed = bufferRef.current.trim();
      console.debug("BarcodeInput submit", { raw: bufferRef.current, trimmed });
      onScan(trimmed);
      bufferRef.current = "";
        // Do NOT clear the visible input value here — leave it so users can see/correct the scanned code
      return;
    }

    if (e.key.length === 1) {
      bufferRef.current += e.key;
    }

      timeoutRef.current = setTimeout(() => {
        if (bufferRef.current.length > 3) {
          const trimmed = bufferRef.current.trim();
          console.debug("BarcodeInput auto-submit", { raw: bufferRef.current, trimmed });
          onScan(trimmed);
          bufferRef.current = "";
          // Do NOT clear the visible input value here — leave it so users can see/correct the scanned code
        }
      }, 300);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      onKeyDown={handleKeyDown}
      onChange={(e) => { bufferRef.current = e.target.value; }}
      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm font-mono"
    />
  );
}
