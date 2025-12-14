"use client";

import { useEffect, useRef } from "react";

// Simple barcode generator using canvas
export default function Barcode({ value, width = 200, height = 60, showText = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Generate Code128-like barcode pattern
    const code = generateBarcodePattern(value);
    const barWidth = width / code.length;
    const barHeight = showText ? height - 20 : height;

    // Draw bars
    ctx.fillStyle = "#000000";
    code.split("").forEach((bit, i) => {
      if (bit === "1") {
        ctx.fillRect(i * barWidth, 0, barWidth, barHeight);
      }
    });

    // Draw text below barcode
    if (showText) {
      ctx.fillStyle = "#000000";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(value, width / 2, height - 5);
    }
  }, [value, width, height, showText]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="bg-white"
    />
  );
}

// Simple pattern generator (not real Code128, but visually similar)
function generateBarcodePattern(text) {
  let pattern = "11010"; // Start pattern
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Generate pseudo-random but consistent pattern for each character
    const bits = charCode.toString(2).padStart(8, "0");
    pattern += bits.split("").map((b, idx) => 
      idx % 2 === 0 ? b : b === "1" ? "0" : "1"
    ).join("");
    pattern += "0"; // Separator
  }
  
  pattern += "11010"; // End pattern
  return pattern;
}

// Barcode scanner input component
export function BarcodeInput({ onScan, placeholder = "Scan or enter barcode..." }) {
  const inputRef = useRef(null);
  const bufferRef = useRef("");
  const timeoutRef = useRef(null);

  const handleKeyDown = (e) => {
    // Clear timeout on each keypress
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // If Enter is pressed, trigger scan
    if (e.key === "Enter" && bufferRef.current) {
      onScan(bufferRef.current);
      bufferRef.current = "";
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Add to buffer
    if (e.key.length === 1) {
      bufferRef.current += e.key;
    }

    // Auto-submit after 100ms of no input (barcode scanner is fast)
    timeoutRef.current = setTimeout(() => {
      if (bufferRef.current.length > 3) {
        onScan(bufferRef.current);
        bufferRef.current = "";
        if (inputRef.current) inputRef.current.value = "";
      }
    }, 100);
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
