import PolicyLayout from "@/components/PolicyLayout";

export const metadata = {
  title: "Privacy Policy - Walkdrobe",
  description: "Walkdrobe Privacy Policy regarding personal data, security, and usage.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Privacy Policy" lastUpdated="July 2026">
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
        <p>
          Walkdrobe respects your privacy and is committed to protecting your personal data. We collect information necessary to fulfill your orders and enhance your shopping experience, including:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 font-medium">
          <li><strong>Personal Identifiers:</strong> Name, email address, phone number, and delivery address.</li>
          <li><strong>Transactional Data:</strong> Payment details (processed securely via Razorpay; we do not store raw card credentials).</li>
          <li><strong>Technical Data:</strong> IP address, device type, browser settings, and browsing behavior on our platform.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">2. How We Use Your Information</h2>
        <p>
          Your data is strictly used for:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 font-medium">
          <li>Processing, shipping, and delivering your apparel orders.</li>
          <li>Sending automated order confirmations, OTP login codes, and shipment tracking SMS/emails.</li>
          <li>Customer support assistance and resolving inquiries.</li>
          <li>Improving store performance and catalog recommendations.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">3. Data Security & Sharing</h2>
        <p>
          We never sell, rent, or trade your personal information to third-party advertisers. Your information is shared only with trusted logistics partners (e.g. Shiprocket) and payment gateways (e.g. Razorpay) strictly required to complete your transactions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">4. Your Rights & Contact</h2>
        <p>
          You have the right to access, update, or request the deletion of your personal data at any time. For privacy requests, email us at <a href="mailto:support@walkdrobe.in" className="text-[#7A5C3E] underline font-bold">support@walkdrobe.in</a>.
        </p>
      </section>
    </PolicyLayout>
  );
}
