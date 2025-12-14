import { Geist, Geist_Mono } from "next/font/google";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { ConvexProvider, convex } from "../convexClient"; // Revert to named import
import LayoutWrapper from "../components/LayoutWrapper";
import { Suspense } from "react"; // Import Suspense
import { WebsiteStructuredData, OrganizationStructuredData } from "@/components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  metadataBase: new URL('https://walkdrobe.in'),
  title: {
    default: "Walkdrobe - Premium Footwear Store in Patna",
    template: "%s | Walkdrobe"
  },
  description: "Discover premium footwear at Walkdrobe, Patna's favorite shoe store. Shop sneakers, boots, sandals, and more. Visit us or shop online!",
  keywords: ["footwear", "shoes", "sneakers", "boots", "sandals", "Patna", "shoe store", "premium footwear", "walkdrobe"],
  authors: [{ name: "Walkdrobe" }],
  creator: "Walkdrobe",
  publisher: "Walkdrobe",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://walkdrobe.in",
    title: "Walkdrobe - Premium Footwear Store in Patna",
    description: "Discover premium footwear at Walkdrobe. Shop sneakers, boots, sandals, and more with fast shipping.",
    siteName: "Walkdrobe",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Walkdrobe Footwear Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Walkdrobe - Premium Footwear Store in Patna",
    description: "Discover premium footwear at Walkdrobe, Patna.",
    images: ["/og-image.jpg"],
    creator: "@walkdrobe",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <WebsiteStructuredData />
        <OrganizationStructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${inter.variable} antialiased`}
      >
        <ConvexProvider client={convex}>
          {/* <AccessGate> */}
          <Suspense fallback={<div>Loading page...</div>}>
            {" "}
            {/* Add Suspense boundary */}
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </Suspense>
          {/* </AccessGate> */}
        </ConvexProvider>
      </body>
    </html>
  );
}
