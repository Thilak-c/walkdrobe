import { Geist, Geist_Mono } from "next/font/google";
import { Poppins, Inter, Anton } from "next/font/google";
import "./globals.css";
import { ConvexProvider, convex } from "../convexClient"; // Revert to named import
import LayoutWrapper from "../components/LayoutWrapper";
import QueryProvider from "../components/QueryProvider";
import { Suspense } from "react"; // Import Suspense
import { WebsiteStructuredData, OrganizationStructuredData } from "@/components/StructuredData";
import Script from "next/script";

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

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  metadataBase: new URL('https://walkdrobe.in'),
  title: {
    default: "Walkdrobe - Premium Footwear Store in Patna",
    template: "%s | Walkdrobe"
  },
  description: "Discover premium footwear at Walkdrobe, Patna's favorite shoe store. Shop sneakers, sports shoes, and more. Visit us or shop online!",
  keywords: ["footwear", "shoes", "sneakers", "sports shoes", "Patna", "shoe store", "premium footwear", "walkdrobe"],
  authors: [{ name: "Walkdrobe" }],
  creator: "Walkdrobe",
  publisher: "Walkdrobe",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=2' },
      { url: '/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png?v=2' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png?v=2' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://walkdrobe.in",
    title: "Walkdrobe - Premium Footwear Store in Patna",
    description: "Discover premium footwear at Walkdrobe. Shop sneakers, sports shoes, and more with fast shipping.",
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
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=862293613603975&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${inter.variable} ${anton.variable} antialiased font-poppins`}
      >
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '862293613603975');
            fbq('track', 'PageView');
          `}
        </Script>
        <QueryProvider>
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
        </QueryProvider>
      </body>
    </html>
  );
}
