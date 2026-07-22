import PolicyLayout from "@/components/PolicyLayout";
import { Video } from "lucide-react";

export const metadata = {
  title: "Return & Exchange Policy - Walkdrobe",
  description: "Walkdrobe Return and Exchange policy, mandatory unboxing video guidelines, and terms.",
};

export default function ReturnPolicyPage() {
  return (
    <PolicyLayout title="Return & Exchange Policy" lastUpdated="July 2026">
      {/* Mandatory Unboxing Video Alert Banner */}
      <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/50 to-orange-50/60 border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-amber-950 font-inter shadow-2xs space-y-3">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Video className="w-5 h-5 stroke-[2.25px]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-amber-950 tracking-tight font-inter">
                Unboxing Video Required for All Claims
              </h3>
              <span className="bg-amber-800 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md font-inter">
                Mandatory
              </span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed font-medium mt-1.5 font-inter">
              To protect against fraudulent claims and ensure quick resolution, <strong>a single continuous unboxing video without cuts, edits, or pauses is strictly mandatory</strong> for all return, exchange, damage, or missing item requests.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">1. Unpacking Video Guidelines</h2>
        <p>
          When opening your Walkdrobe parcel, please record a video adhering to the following rules:
        </p>
        <ul className="list-disc pl-5 space-y-2 font-medium">
          <li>
            <strong>Single Continuous Video:</strong> The video must be recorded in one single take with <strong>strictly NO cuts, edits, or pauses</strong> from start to finish.
          </li>
          <li>
            <strong>High Quality & Good Lighting:</strong> The video must be recorded in high resolution with adequate lighting so all details are clearly visible.
          </li>
          <li>
            <strong>Clear Package & Label Visibility:</strong> The outer courier bag, intact shipping label with your AWB number, sealed packaging, and the product itself must be clearly shown in the frame.
          </li>
          <li>
            <strong>Defect / Issue Demonstration:</strong> Any damaged area, size issue, or wrong product received must be zoomed in and clearly highlighted in the video clip.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">2. Valid Reason Requirement</h2>
        <p>
          Every return or exchange request must be accompanied by a valid, genuine reason. Acceptable reasons include:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 font-medium">
          <li>Incorrect size delivered or size fitting issue.</li>
          <li>Product received in damaged, defective, or stained condition.</li>
          <li>Incorrect product or color delivered by error.</li>
          <li>Missing items or accessories in the parcel.</li>
        </ul>
        <p className="text-xs text-slate-500 font-medium">
          Requests submitted without a clear, valid reason or unboxing proof will not be processed.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">3. 7-Day Return & Exchange Window</h2>
        <p>
          You can raise a return or exchange request within <strong>7 days from the delivery date</strong>. Requests raised after 7 days will not be eligible for return or exchange.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">4. Product Condition Eligibility</h2>
        <ul className="list-disc pl-5 space-y-1.5 font-medium">
          <li>Items must be unworn, unwashed, unaltered, and free of odors, stains, or sole wear.</li>
          <li>Original brand box, tags, barcode labels, and packaging must remain completely intact.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">5. How to Initiate a Return</h2>
        <p>
          Send your unboxing video, order number, and valid reason to our support team at <a href="mailto:support@walkdrobe.in" className="text-[#7A5C3E] underline font-bold">support@walkdrobe.in</a> or WhatsApp us at <strong>+91 91225 83392</strong>. Our team will verify the video and arrange a doorstep pickup within 2-4 business days.
        </p>
      </section>
    </PolicyLayout>
  );
}
