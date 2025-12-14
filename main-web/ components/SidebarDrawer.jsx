import { useState } from "react";
import Image from "next/image";


export default function SidebarDrawer({ open, onClose, width }) {
  const [activeTab, setActiveTab] = useState(0);
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (cat) => {
    setOpenSections((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full ${width} bg-white z-50 transition-transform duration-300 overflow-y-auto rounded-tr-xl rounded-br-xl shadow-xl border-r border-gray-200 ${open ? "translate-x-0" : "-translate-x-full"
          }`}
        style={{ zIndex: 60 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-tr-2xl">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.png" alt="Logo" width={150} height={40} className="" />

          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300">
            ×
          </button>
        </div>
        <div className="p-4 pb-2">
          <button className="w-full border border-gray-800 rounded-lg py-1.5 text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 transition mb-1 shadow-sm flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg> Log In/Register
          </button>

        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-2">
          {navTabs.map((tab, idx) => (
            <button
              key={tab}
              className={`flex-1 py-2 font-bold text-sm relative transition-colors duration-200 ${activeTab === idx ? "text-gray-500" : "text-gray-500 hover:text-teal-600"
                }`}
              onClick={() => setActiveTab(idx)}
            >
              {tab}
              <div
                className={`h-1 mt-1 rounded transition-all duration-300 absolute left-0 right-0 mx-auto ${activeTab === idx ? "bg-gray-500 w-3/4" : "bg-transparent w-0"
                  }`}
                style={{ bottom: -2 }}
              />
            </button>
          ))}
        </div>

        {/* Horizontal Cards (example for MEN) */}
        {activeTab === 0 && (
          <div className="flex overflow-x-auto gap-16 p-8 pb-2 ">
            {menCards.map((card) => (
              <div key={card.name} className="flex-shrink-0 w-24 bg-white rounded-xl shadow hover:shadow-md transition-shadow duration-200">
                <img
                  src={card.img}
                  alt={card.name}
                  width={96}
                  height={96}
                  className="rounded-t-xl object-cover"
                />
                <div className="text-xs text-center font-extrabold mt-1 pb-2 text-gray-800">{card.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Accordions */}
        <div className="divide-y divide-gray-200 px-2">
          {categories.map((cat) => (
            <div key={cat} className="bg-white">
              <button
                className="w-full flex justify-between items-center py-3 text-[14px] font-extrabold text-black hover:text-teal-700 transition-colors"
                onClick={() => toggleSection(cat)}
              >
                {cat}
                <img
                  src="/icons/arow.png"
                  alt="Toggle"
                  width={16}
                  height={16}
                  className={`ml-2 transition-transform duration-300 ${openSections[cat] ? "rotate-180" : "rotate-0"}`}
                />
              </button>
              {/* Example: Show accessories cards for All Accessories */}
              {cat === "All Accessories" && openSections[cat] && (
                <div className="flex px-8 overflow-x-auto gap-16 pb-3">
                  {accessories.map((item) => (
                    <div key={item.name} className="flex-shrink-0 w-24 bg-white rounded-xl shadow hover:shadow-md transition-shadow duration-200">
                      <img
                        src={item.img}
                        alt={item.name}
                        width={96}
                        height={96}
                        className="rounded-t-xl object-cover"
                      />
                      <div className="text-xs text-center font-semibold mt-1 pb-2 text-gray-800">{item.name}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* For other categories, you can add content here */}
            </div>
          ))}
        </div>
        <div
         className="m-[6px] border-gray-200 border-y "
        >


          <div className="bg-white divide-y divide-gray-200 px-2 ">
            <button
              className="w-full flex  items-center py-3 text-[14px] font-extrabold text-black hover:text-teal-700 transition-colors"
            >
              Track My Order
              <img
                src="/icons/track-order.png"
                alt="Toggle"
                width={20}
                height={20}
                className={`ml-2 transition-transform duration-300 `}
              />
            </button>
            {/* Example: Show accessories cards for All Accessories */}

            {/* For other categories, you can add content here */}
          </div>
          <div className="bg-white  px-2 ">
            <button
              className="w-full flex  items-center py-3  text-[14px] font-extrabold text-black hover:text-teal-700 transition-colors"
            >
              Stores Near Me
              <img
                src="/icons/stores.png"
                alt="Toggle"
                width={20}
                height={20}
                className={`ml-2  opacity-80 transition-transform duration-300 `}
              />
            </button>

          </div>
          <div className="bg-white  px-2 ">
            <button
              className="w-full flex  items-center py-3  text-[14px] font-extrabold text-black hover:text-teal-700 transition-colors"
            >
             More
              <img
                src="/icons/more.png"
                alt="Toggle"
                width={20}
                height={20}
                className={`ml-2  opacity-80 transition-transform duration-300 `}
              />
            </button>

          </div>
        </div>
      </div>
    </>
  );
}