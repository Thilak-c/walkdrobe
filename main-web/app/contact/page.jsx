"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mail,
  Phone,
  MapPin,
  Instagram,
  MessageCircle,
  Sparkles,
  Zap,
  Heart,
  Star,
} from "lucide-react";
import Navbar, { NavbarMobile } from "@/components/Navbar";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
          setFormData({ name: "", email: "", message: "" });
        }, 3000);
      } else {
        alert(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      value: "team@aesthetxways.com",
      link: "mailto:team@aesthetxways.com",
    },
    {
      icon: Phone,
      title: "Call Us",
      value: "+91 7033769997",
      link: "tel:+917033769997",
    },
    {
      icon: Instagram,
      title: "Instagram",
      value: "@aesthetx.ways_",
      link: "https://www.instagram.com/aesthetx.ways_/",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      value: "Our Location",
      link: "https://share.google/qeqskVGsX1KQGjb39",
    },
  ];

  const floatingIcons = [
    { Icon: Heart, delay: 0, duration: 3 },
    { Icon: Star, delay: 0.5, duration: 4 },
    { Icon: Sparkles, delay: 1, duration: 3.5 },
    { Icon: Zap, delay: 1.5, duration: 4.5 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className="absolute"
            initial={{ y: "100vh", x: `${Math.random() * 100}vw`, opacity: 0 }}
            animate={{
              y: "-100vh",
              x: `${Math.random() * 100}vw`,
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <item.Icon className="w-8 h-8 text-gray-300" />
          </motion.div>
        ))}
      </div>

      {/* Navbar */}
      <div className="md:hidden">
        <NavbarMobile />
      </div>
      <div className="hidden md:block">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 md:py-32">
        {/* Crazy Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-block mb-4"
          >
            <MessageCircle className="w-16 h-16 md:w-20 md:h-20 text-black mx-auto" />
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-light text-gray-900 mb-4"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            Let's Talk!
          </motion.h1>

          <motion.p
            className="text-sm md:text-base font-light text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            We'd love to hear from you. Drop us a message and we'll get back to
            you faster than you can say "AESTHETX WAYS"!
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Contact Form - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="relative"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-200">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-light text-gray-700 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 outline-none transition-all text-sm font-light"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-light text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 outline-none transition-all text-sm font-light"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-light text-gray-700 mb-2">
                        Your Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 outline-none transition-all resize-none text-sm font-light"
                        placeholder="Tell us what's on your mind..."
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-black text-white py-4 rounded-xl font-light text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 0.6 }}
                      className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <Sparkles className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-light text-gray-900 mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-sm font-light text-gray-600">
                      We'll get back to you super soon!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Contact Methods - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-light text-gray-900 mb-6">
              Other Ways to Reach Us
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactMethods.map((method, index) => (
                <motion.a
                  key={index}
                  href={method.link}
                  target={method.link.startsWith("http") ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  onHoverStart={() => setHoveredCard(index)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="relative group"
                >
                  <div className="bg-white border-2 border-gray-200 p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:border-black transition-all duration-300 transform hover:-translate-y-2">
                    <motion.div
                      animate={{
                        scale: hoveredCard === index ? [1, 1.2, 1] : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="mb-4"
                    >
                      <method.icon className="w-8 h-8 text-black" />
                    </motion.div>

                    <h3 className="text-sm font-light text-gray-900 mb-1">
                      {method.title}
                    </h3>
                    <p className="text-xs font-light text-gray-600">
                      {method.value}
                    </p>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Fun Quote */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
              className="bg-white border-2 border-gray-200 p-6 rounded-2xl mt-8"
            >
              <p className="text-sm font-light text-gray-800 text-center italic">
                "We don't just reply to messages, we start conversations!"
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
