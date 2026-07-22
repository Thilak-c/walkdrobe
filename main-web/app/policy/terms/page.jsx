import PolicyLayout from "@/components/PolicyLayout";

export const metadata = {
  title: "Terms and Conditions - Walkdrobe",
  description: "Walkdrobe Terms and Conditions of website usage and sales.",
};

export default function TermsPolicyPage() {
  return (
    <PolicyLayout title="Terms and Conditions" lastUpdated="July 2026">
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
        <p>
          Welcome to Walkdrobe. By accessing or purchasing from our platform (walkdrobe.in), you agree to be bound by these Terms and Conditions. Please read them carefully before making a purchase.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">2. Product Descriptions & Pricing</h2>
        <p>
          We take utmost care to ensure product descriptions, colors, sizes, and prices are accurate. However, minor variations in fabric shade or display colors may occur depending on screen settings. Prices are subject to change without prior notice.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">3. Intellectual Property</h2>
        <p>
          All content on Walkdrobe, including logos, branding, product photos, graphics, and text, is the exclusive property of Walkdrobe / H L Fashion and is protected under intellectual property laws. Unauthorized reproduction or commercial use is strictly prohibited.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">4. Governing Law & Jurisdiction</h2>
        <p>
          These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising out of your purchase shall be subject to the exclusive jurisdiction of the courts in Patna, Bihar, India.
        </p>
      </section>
    </PolicyLayout>
  );
}
