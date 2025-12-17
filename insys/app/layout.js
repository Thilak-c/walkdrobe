import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { ConvexProvider } from "../convexClient";
import { Toaster } from "react-hot-toast";
import AuthWrapper from "@/components/AuthWrapper";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Inventory System | Walkdrobe",
  description: "Inventory management system for Walkdrobe footwear store",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${inter.variable} font-inter antialiased`}>
        <ConvexProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f172a',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </ConvexProvider>
      </body>
    </html>
  );
}
