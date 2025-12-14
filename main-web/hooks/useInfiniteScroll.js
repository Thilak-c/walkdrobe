import { useEffect, useRef } from "react";

export function useInfiniteScroll(itemsLength) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !itemsLength || itemsLength === 0) return;

    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const scrollWidth = el.scrollWidth;
      const clientWidth = el.clientWidth;
      const halfWidth = scrollWidth / 2;

      // When reaching the end, jump back to the start
      if (scrollLeft >= halfWidth - clientWidth - 10) {
        el.scrollLeft = scrollLeft - halfWidth;
      }
      // When reaching the start (scrolling backwards), jump to the end
      else if (scrollLeft <= 10) {
        el.scrollLeft = halfWidth;
      }
    };

    el.addEventListener("scroll", handleScroll);
    
    // Set initial scroll position to middle for seamless loop
    el.scrollLeft = el.scrollWidth / 4;

    return () => el.removeEventListener("scroll", handleScroll);
  }, [itemsLength]);

  return scrollRef;
}
