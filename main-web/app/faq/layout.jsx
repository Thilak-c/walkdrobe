// app/faq/layout.jsx
export const metadata = {
  title: "FAQ - Frequently Asked Questions",
  description: "Find answers to common questions about shipping, returns, payments, sizing, and more. Get help with your AesthetX Ways shopping experience.",
  keywords: ["FAQ", "frequently asked questions", "help", "shipping info", "returns policy", "payment methods"],
  openGraph: {
    title: "FAQ | AesthetX Ways",
    description: "Find answers to frequently asked questions.",
    type: "website",
  },
  alternates: {
    canonical: "https://aesthetxways.com/faq",
  },
};

export default function FAQLayout({ children }) {
  return children;
}
