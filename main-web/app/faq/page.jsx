"use client";
import { useState } from "react";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import FooterSimple from "@/components/FooterSimple";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major payment methods including UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery (COD)."
  },
  {
    question: "How long does delivery take?",
    answer: "Delivery typically takes 3-7 business days depending on your location. Orders within Bihar are usually delivered within 2-4 days."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 7-day return policy for unused products in original packaging. Items must be in the same condition as received."
  },
  {
    question: "How can I track my order?",
    answer: "Once your order is shipped, you'll receive a tracking link via SMS and email. You can also track your order on our Track Order page."
  },
  {
    question: "Do you offer exchanges?",
    answer: "Yes, we offer free exchanges for size issues within 7 days of delivery. Contact us to initiate an exchange."
  },
  {
    question: "Are the products original?",
    answer: "Yes, all products sold on Walkdrobe are 100% authentic and sourced directly from authorized distributors."
  },
  {
    question: "How do I find my shoe size?",
    answer: "We provide a size chart on each product page. You can also visit our store in Patna for a proper fitting."
  },
  {
    question: "Can I cancel my order?",
    answer: "Orders can be cancelled within 24 hours of placing them. Once shipped, cancellation is not possible but you can return after delivery."
  },
  {
    question: "Do you have a physical store?",
    answer: "Yes! Visit us at our store in Patna, Bihar. We're open from 11 AM to 9 PM daily. Call us at 9122583392 for directions."
  },
  {
    question: "How can I contact customer support?",
    answer: "You can reach us via phone at 9122583392, or visit our store in Patna. We're happy to help!"
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      <div className="xl:block hidden h-[80px] xl:h-[100px]"></div>
      <div className="xl:hidden mb-14">
        <NavbarMobile />
      </div>
      <div className="hidden xl:block">
        <Navbar />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-500 mb-8">Find answers to common questions about orders, shipping, and more.</p>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-400 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} 
                />
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4 text-gray-600 text-sm">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-2xl text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-500 text-sm mb-4">Contact us and we'll get back to you as soon as possible.</p>
          <a href="tel:9122583392" className="inline-block px-6 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
            Call Us: 9122583392
          </a>
        </div>
      </div>

      <FooterSimple />
    </div>
  );
}
