// app/contact/layout.jsx
export const metadata = {
  title: "Contact Us - Customer Support & Inquiries",
  description: "Get in touch with AesthetX Ways customer support. We're here to help with your orders, returns, and any questions about our products.",
  keywords: ["contact", "customer support", "help", "inquiries", "customer service"],
  openGraph: {
    title: "Contact Us | AesthetX Ways",
    description: "Get in touch with our customer support team.",
    type: "website",
  },
  alternates: {
    canonical: "https://aesthetxways.com/contact",
  },
};

export default function ContactLayout({ children }) {
  return children;
}
