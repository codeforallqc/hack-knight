import { useState, useEffect } from "react";  // added useEffect
import { AnimatePresence } from "motion/react";

import GALLERY_DATA from "../data/gallery";
import Slideshow from "./Slideshow";

export default function PhotoGallery() {
  const [index, setIndex]         = useState(0);
  const [direction, setDirection] = useState(1);

  function handleNext() {
    setDirection(1);
    setIndex((prev) => (prev + 1) % GALLERY_DATA.length);
  }

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(handleNext, 10000);
    return () => clearInterval(timer);
  }, [index]);

  const current = GALLERY_DATA[index];

  return (
    <section id="photos" className="section-wrapper py-24">
      <h2 className="section-title text-center">Past Event Highlights</h2>
      <p className="section-subtitle text-center">Browse photos from our past hackathons</p>

      <div className="relative mt-10">

        {/* Sliding viewport */}
        <div className="relative w-full overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <Slideshow
              key={current.year}
              year={current.year}
              photos={current.photos}
              direction={direction}
            />
          </AnimatePresence>
        </div>

      </div>

      {/* Pill dot indicator */}
      <div className="flex justify-center mt-6">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-border bg-surface">
          {GALLERY_DATA.map((gallery, i) => (
            <button
              key={gallery.year}
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              aria-label={`View ${gallery.year} photos`}
              className={`w-2 h-2 rounded-full bg-ultraviolet transition-all duration-300
                ${i === index
                  ? "opacity-100 scale-125"
                  : "opacity-25 hover:opacity-50"
                }`}
            />
          ))}
        </div>
      </div>

    </section>
  );
}