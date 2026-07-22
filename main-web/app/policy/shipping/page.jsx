import PolicyLayout from "@/components/PolicyLayout";

export const metadata = {
  title: "Shipping Policy - Walkdrobe",
  description: "Walkdrobe Shipping and Delivery Policy terms across India.",
};

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout title="Shipping Policy" lastUpdated="July 2026">
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">1. Dispatch & Processing Time</h2>
        <p>
          All confirmed orders are processed and handed over to our logistics partners (Shiprocket, BlueDart, Delhivery, etc.) within <strong>24 to 48 hours</strong> of order placement (excluding Sundays and national holidays).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">2. Delivery Timelines across India</h2>
        <p>
          Estimated delivery timelines after dispatch are as follows:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 font-medium">
          <li><strong>Metro Cities:</strong> 2 - 4 Business Days</li>
          <li><strong>Rest of India:</strong> 3 - 6 Business Days</li>
          <li><strong>Special / Remote Pincodes:</strong> 5 - 8 Business Days</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">3. Shipping Charges</h2>
        <p>
          Walkdrobe offers <strong>Free Shipping</strong> on prepaid orders above ₹999. For orders below ₹999 or Cash on Delivery (COD) orders, nominal shipping / handling charges apply as indicated at checkout.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">4. Live Shipment Tracking</h2>
        <p>
          As soon as your order ships, an AWB tracking link will be sent to your email and SMS. You can also track your shipment status live anytime by visiting our <a href="/track-order" className="text-[#7A5C3E] underline font-bold">Track Order</a> page.
        </p>
      </section>
    </PolicyLayout>
  );
}
