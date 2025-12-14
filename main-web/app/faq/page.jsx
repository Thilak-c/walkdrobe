"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, Package, Truck, CreditCard, RefreshCw, HelpCircle, Mail } from "lucide-react";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import Link from "next/link";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openQuestion, setOpenQuestion] = useState(null);

  const categories = [
    { id: "all", name: "All", icon: HelpCircle },
    { id: "orders", name: "Orders", icon: Package },
    { id: "shipping", name: "Shipping", icon: Truck },
    { id: "payment", name: "Payment", icon: CreditCard },
    { id: "returns", name: "Returns", icon: RefreshCw },
  ];

  const faqs = [
    {
      category: "orders",
      question: "How do I track my order?",
      answer: "You can track your order by clicking on 'Track Order' in the navigation menu or footer. Enter your order number to see real-time updates on your shipment status."
    },
    {
      category: "orders",
      question: "Can I modify or cancel my order?",
      answer: "Orders can be modified or cancelled within 1 hour of placement. After that, the order enters processing and cannot be changed. Contact our support team immediately if you need assistance."
    },
    {
      category: "orders",
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards, UPI, net banking, and digital wallets. All payments are processed securely through our payment gateway."
    },
    {
      category: "shipping",
      question: "What are the shipping charges?",
      answer: "We offer free shipping on orders above ₹999. For orders below ₹999, shipping charges vary based on your location and will be calculated at checkout."
    },
    {
      category: "shipping",
      question: "How long does delivery take?",
      answer: "Standard delivery takes 2-3 business days for metro cities and 3-5 business days for other locations. You'll receive tracking information once your order ships."
    },
    {
      category: "shipping",
      question: "Do you ship internationally?",
      answer: "Currently, we only ship within India. We're working on expanding our shipping to international locations soon."
    },
    {
      category: "payment",
      question: "Is it safe to use my credit card on your site?",
      answer: "Yes, absolutely! All transactions are encrypted and processed through secure payment gateways. We never store your complete card details on our servers."
    },
    {
      category: "payment",
      question: "Can I pay cash on delivery?",
      answer: "Cash on delivery is available for select locations. You'll see this option at checkout if it's available for your delivery address."
    },
    {
      category: "payment",
      question: "What if my payment fails?",
      answer: "If your payment fails, the amount will be automatically refunded to your account within 5-7 business days. You can retry placing the order with a different payment method."
    },
    {
      category: "returns",
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for most items. Products must be unused, unwashed, and in original packaging with tags attached. Some items like innerwear are non-returnable for hygiene reasons."
    },
    {
      category: "returns",
      question: "How do I initiate a return?",
      answer: "Go to 'My Orders', select the order you want to return, and click 'Return Item'. Follow the instructions to schedule a pickup. Our team will collect the item from your address."
    },
    {
      category: "returns",
      question: "When will I receive my refund?",
      answer: "Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount will be credited to your original payment method."
    },
    {
      category: "orders",
      question: "How do I use a discount code?",
      answer: "Enter your discount code in the 'Promo Code' field at checkout before completing your payment. The discount will be applied automatically to your order total."
    },
    {
      category: "orders",
      question: "Can I order without creating an account?",
      answer: "Yes, you can checkout as a guest. However, creating an account helps you track orders, save addresses, and get personalized recommendations."
    },
    {
      category: "shipping",
      question: "Can I change my delivery address?",
      answer: "You can change the delivery address within 1 hour of placing the order. After that, contact our support team and we'll try our best to help before the order ships."
    },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="md:hidden">
        <NavbarMobile />
      </div>
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 md:py-16 mt-16 md:mt-0">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-normal mb-3">Frequently Asked Questions</h1>
          <p className="text-sm text-gray-300 mb-6">Find answers to common questions about orders, shipping, and more</p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-normal whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ List */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">No questions found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenQuestion(openQuestion === index ? null : index)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-normal text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                      openQuestion === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                <AnimatePresence>
                  {openQuestion === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 text-xs text-gray-600 leading-relaxed border-t border-gray-100">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Mail className="w-8 h-8 text-gray-900 mx-auto mb-3" />
          <h3 className="text-base font-normal text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-xs text-gray-600 mb-4">Can't find the answer you're looking for? Please contact our support team.</p>
          <Link href="/contact">
            <button className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-normal hover:bg-gray-800 transition-colors">
              Contact Support
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
