import { useState, useEffect } from "react";
import Image from "next/image";

const slides = [
  
  {
    desktopImg: "/poster-img-hero-home/IMG_1725.PNG",
    mobileImg: "/poster-img-hero-home/IMG_6724.PNG",
    title: "ALIEN FORCE DROP",
    subtitle: "COLLECTOR'S ITEM",
    cta: "SHOP NOW",
    description: "EXCLUSIVE MERCH RELEASE",
    limited: "ONLY THIS WEEK",
    pieces: 400,
  },
  {
    desktopImg: "/poster-img-hero-home/IMG_6725.PNG",
    mobileImg: "/poster-img-hero-home/IMG_7326.JPG",
    title: "BEN 10 ALIEN FORCE",
    subtitle: "FIRST TIME EVER IN INDIA",
    cta: "TAP TO UNLOCK",
    description: "THE ULTIMATE ALIEN FORCE TEE",
    limited: "LIMITED EDITION DROP",
    pieces: 600,
  },
  {
    desktopImg: "/poster-img-hero-home/IMG_6726.PNG",
    mobileImg: "/poster-img-hero-home/IMG_6726.PNG",
    title: "LIMITED TEE",
    subtitle: "DON'T MISS OUT",
    cta: "BUY NOW",
    description: "PREMIUM QUALITY",
    limited: "LIMITED STOCK",
    pieces: 300,
  },
  {
    desktopImg: "/poster-img-hero-home/IMG_6727.PNG",
    mobileImg: "/poster-img-hero-home/IMG_6727.PNG",
    title: "EXCLUSIVE DROP",
    subtitle: "NEW ARRIVAL",
    cta: "EXPLORE",
    description: "FRESH DESIGNS",
    limited: "JUST LAUNCHED",
    pieces: 200,
  },
];

export default function ProductSlider() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Automatic slide change every 4 seconds (only for mobile)
  useEffect(() => {
    if (!isMobile) return;
    
    const interval = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [current, isMobile]);

  // Fade effect handler
  const triggerFade = (nextIdx) => {
    setFade(false);
    setTimeout(() => {
      setCurrent(nextIdx);
      setFade(true);
    }, 300);
  };

  const handlePrev = () => {
    const prevIdx = current === 0 ? slides.length - 1 : current - 1;
    triggerFade(prevIdx);
  };

  const handleNext = () => {
    const nextIdx = current === slides.length - 1 ? 0 : current + 1;
    triggerFade(nextIdx);
  };

  const handleDot = (idx) => {
    if (idx !== current) triggerFade(idx);
  };

  // Select the appropriate image based on device
  const currentImage = isMobile ? slides[current].mobileImg : slides[current].desktopImg;

  return (
    <div className="relative w-full md:rounded-3xl  max-w-[1600px] mx-auto h-[70vh] overflow-hidden shadow-xl bg-black">
      {/* Slide */}
      <div className="w-full h-full relative">
        <div className={`absolute inset-0 transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
          <Image
            src={currentImage}
            alt={slides[current].title}
            fill
            className="object-cover object-center opacity-90"
            priority
          />
        </div>

        {/* Dots - only show on mobile */}
        {isMobile && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDot(idx)}
                className={`w-1 h-1 rounded-full border-white transition ${
                  current === idx ? "bg-lime-400 border-lime-400" : "bg-white/40"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}