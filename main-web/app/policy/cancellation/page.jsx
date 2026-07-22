import PolicyLayout from "@/components/PolicyLayout";

export const metadata = {
  title: "Cancellation Policy - Walkdrobe",
  description: "Walkdrobe Cancellation Policy and Order Modification terms.",
};

export default function CancellationPolicyPage() {
  return (
    <PolicyLayout title="Cancellation Policy" lastUpdated="July 2026">
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">1. Order Cancellation Window</h2>
        <p>
          At Walkdrobe, we strive to process and dispatch your orders as quickly as possible. You may cancel your order free of charge within <strong>2 hours</strong> of placing it, or before it has been processed for shipping by our warehouse team.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">2. How to Request Cancellation</h2>
        <p>
          To cancel an eligible order:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 font-medium">
          <li>Visit your <strong className="text-slate-900">My Orders</strong> section and click "Cancel Order" if available.</li>
          <li>Email our support team immediately at <a href="mailto:support@walkdrobe.in" className="text-[#7A5C3E] underline font-bold">support@walkdrobe.in</a> with your Order Number.</li>
          <li>Call or WhatsApp our helpline at <strong>+91 91225 83392</strong> (Mon-Sat, 9:00 AM – 9:00 PM IST).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">3. Orders Already Shipped</h2>
        <p>
          Once an order has been dispatched from our facility and assigned an AWB tracking number, it cannot be cancelled directly. If you refuse delivery at your doorstep, a refund will be processed once the shipment returns to our warehouse, minus applicable forward/return shipping charges.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">4. Refund Processing for Cancelled Orders</h2>
        <p>
          For prepaid orders cancelled prior to dispatch, a 100% full refund will be credited back to your original payment method (Bank / Card / UPI) within <strong>5-7 business days</strong>.
        </p>
      </section>
    </PolicyLayout>
  );
}
