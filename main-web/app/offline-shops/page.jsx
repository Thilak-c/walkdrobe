"use client";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Navigation, Mail, Store, Sparkles } from "lucide-react";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import Link from "next/link";

export default function OfflineShopsPage() {
  const stores = [
    {
      id: 1,
      name: "AesthetX Ways - Gaya",
      city: "Gaya",
      state: "Bihar",
      address: "R232+WF4, Gaya Station Campus Rd, Gol Bagicha, Gaya Railway Station, Gaya, Bihar - 823002",
      phone: "+91 70337 69997",
      email: "team@aesthetxways.com",
      hours: {
        weekdays: "10:00 AM - 9:00 PM",
        sunday: "11:00 AM - 8:00 PM"
      },
      status: "open",
      mapLink: "https://maps.app.goo.gl/nHjYTz1aoExt4UPs5",
      image: "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSyUHtp1D5ofH1IIq9ppAc58--wzfxsiFi786XpA2LiwAZgjN4mluM6glZCulbUY4fmk6L8FvXmezZljszKOpsci4MNRACa5dktG3D2dl8NlvOwQAN54eHyiYqr5foopRYmoDYnl=s1360-w1360-h1020-rw"
    },
    {
      id: 2,
      name: "AesthetX Ways - Patna",
      city: "Patna",
      state: "Bihar",
      address: "Coming Soon - Boring Road Area, Patna, Bihar",
      phone: "Coming Soon",
      email: "team@aesthetxways.com",
      hours: {
        weekdays: "Coming Soon",
        sunday: "Coming Soon"
      },
      status: "coming-soon",
      mapLink: null,
      image: "/store-placeholder.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <div className="md:hidden">
        <NavbarMobile />
      </div>
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6 md:py-8 mt-16 md:mt-0">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Store className="w-6 h-6 mx-auto mb-2 text-gray-700" />
          <h1 className="text-base md:text-lg font-normal mb-1.5 text-gray-900">Our Offline Stores</h1>
          <p className="text-xs text-gray-600 max-w-2xl mx-auto">
            Visit our physical stores to experience our products firsthand. Try before you buy!
          </p>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stores.map((store, index) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${
                store.status === "coming-soon" ? "opacity-90" : ""
              }`}
            >
              {/* Store Image/Banner */}
              <div className={`h-28 relative ${
                store.status === "coming-soon" 
                  ? "bg-gradient-to-br from-gray-100 to-gray-200" 
                  : "bg-gray-100"
              }`}>
                {store.status === "coming-soon" ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                      <span className="text-xs font-normal text-gray-500">Coming Soon</span>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={store.image} 
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  {store.status === "open" ? (
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-normal rounded border border-green-200">
                      Open Now
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs font-normal rounded border border-gray-200">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>

              {/* Store Details */}
              <div className="p-3">
                <h2 className="text-xs font-normal text-gray-900 mb-0.5">{store.name}</h2>
                <p className="text-xs text-gray-500 mb-2">{store.city}, {store.state}</p>

                <div className="space-y-1.5">
                  {/* Address */}
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-normal text-gray-700 mb-0.5">Address</p>
                      <p className="text-xs text-gray-600">{store.address}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-1.5">
                    <Phone className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-normal text-gray-700 mb-0.5">Phone</p>
                      {store.status === "open" ? (
                        <a href={`tel:${store.phone}`} className="text-xs text-gray-900 hover:underline">
                          {store.phone}
                        </a>
                      ) : (
                        <p className="text-xs text-gray-500">{store.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-1.5">
                    <Mail className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-normal text-gray-700 mb-0.5">Email</p>
                      <a href={`mailto:${store.email}`} className="text-xs text-gray-900 hover:underline">
                        {store.email}
                      </a>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-1.5">
                    <Clock className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-normal text-gray-700 mb-0.5">Store Hours</p>
                      <p className="text-xs text-gray-600">Mon-Sat: {store.hours.weekdays}</p>
                      <p className="text-xs text-gray-600">Sunday: {store.hours.sunday}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {store.status === "open" && store.mapLink && (
                  <a
                    href={store.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded text-xs font-normal hover:bg-gray-800 transition-colors"
                  >
                    <Navigation className="w-3 h-3" />
                    Get Directions
                  </a>
                )}

                {store.status === "coming-soon" && (
                  <div className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded text-xs font-normal cursor-not-allowed border border-gray-200">
                    <Sparkles className="w-3 h-3" />
                    Opening Soon
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 bg-white rounded-lg border border-gray-200 p-3"
        >
          <h3 className="text-xs font-normal text-gray-900 mb-2">Why Visit Our Stores?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex items-start gap-1.5">
              <div className="w-6 h-6 bg-gray-50 rounded flex items-center justify-center flex-shrink-0">
                <Store className="w-3 h-3 text-gray-700" />
              </div>
              <div>
                <p className="text-xs font-normal text-gray-900 mb-0.5">Try Before You Buy</p>
                <p className="text-xs text-gray-600">Experience the quality and fit in person</p>
              </div>
            </div>
            
            <div className="flex items-start gap-1.5">
              <div className="w-6 h-6 bg-gray-50 rounded flex items-center justify-center flex-shrink-0">
                <Phone className="w-3 h-3 text-gray-700" />
              </div>
              <div>
                <p className="text-xs font-normal text-gray-900 mb-0.5">Expert Assistance</p>
                <p className="text-xs text-gray-600">Get personalized styling advice from our team</p>
              </div>
            </div>
            
            <div className="flex items-start gap-1.5">
              <div className="w-6 h-6 bg-gray-50 rounded flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3 h-3 text-gray-700" />
              </div>
              <div>
                <p className="text-xs font-normal text-gray-900 mb-0.5">Exclusive In-Store Offers</p>
                <p className="text-xs text-gray-600">Special discounts available only at our stores</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact CTA */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600 mb-2">
            Want to open a franchise or have questions about our stores?
          </p>
          <Link href="/contact">
            <button className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs font-normal hover:bg-gray-800 transition-colors">
              Contact Us
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
