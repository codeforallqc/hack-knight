import { useState, useEffect } from "react";  // added useEffect
import { AnimatePresence, motion } from "motion/react";

import GALLERY_DATA from "../data/gallery";
import Slideshow from "./Slideshow";

export default function PhotoGallery() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [activePhoto, setActivePhoto] = useState(null);

  function handleNext() {
    setDirection(1);
    setIndex((prev) => (prev + 1) % GALLERY_DATA.length);
  }

  function handlePrev() {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + GALLERY_DATA.length) % GALLERY_DATA.length);
  }

  // Auto-advance every 10 seconds
  useEffect(() => {
    if (activePhoto) return; // Pause slideshow while viewing a photo in focus
    const timer = setInterval(handleNext, 10000);
    return () => clearInterval(timer);
  }, [index, activePhoto]);

  // Global dismiss interaction (scroll or click anywhere outside)
  useEffect(() => {
    if (!activePhoto) return;

    const handleDismiss = () => setActivePhoto(null);

    // Minor delay stops the initial 'open' click from instantly triggering this listener
    const timeoutId = setTimeout(() => {
      window.addEventListener("scroll", handleDismiss, { passive: true });
      window.addEventListener("click", handleDismiss);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", handleDismiss);
      window.removeEventListener("click", handleDismiss);
    };
  }, [activePhoto]);

  const current = GALLERY_DATA[index];

  return (
    <section id="photos" className="section-wrapper py-24">
      <h2 className="section-title text-center">Past Event Highlights</h2>

      {/* Surface card — matches carousel / other sections */}
      <div className="bg-surface rounded-3xl py-6 sm:py-12 px-4 sm:px-10 mt-6 sm:mt-10">
      <div className="relative">

        {/* Left Arrow (offset by 22px to account for the year header so it centers strictly on the photos) */}
        <button
          onClick={handlePrev}
          className="absolute left-0 md:-left-12 top-[calc(50%+28px)] -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-border text-text-secondary hover:border-ultraviolet hover:text-ultraviolet hover:shadow-glow transition-all z-10"
          aria-label="Previous year"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>

        {/* Sliding viewport */}
        <div className="relative w-full overflow-hidden px-12 md:px-5 py-2">
          <AnimatePresence mode="wait" custom={direction}>
            <Slideshow
              key={current.year}
              year={current.year}
              photos={current.photos}
              direction={direction}
              onPhotoClick={(photo, idx) => setActivePhoto({ photo, year: current.year, idx })}
              activePhoto={activePhoto}
            />
          </AnimatePresence>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-0 md:-right-12 top-[calc(50%+28px)] -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-border text-text-secondary hover:border-ultraviolet hover:text-ultraviolet hover:shadow-glow transition-all z-10"
          aria-label="Next year"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>

        {/* Lightbox / Expanded Focus Modal (Localized to gallery bounds) */}
        <AnimatePresence>
          {activePhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-4 md:-inset-8 lg:-inset-12 z-50 flex items-center justify-center bg-void/75 p-4 md:p-6 cursor-zoom-out rounded-2xl"
              onClick={() => setActivePhoto(null)}
            >
              <motion.img
                layoutId={`gallery-${activePhoto.year}-${activePhoto.idx}`}
                src={activePhoto.photo.src}
                alt={activePhoto.photo.alt}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] cursor-zoom-out"
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      </div>{/* end surface card */}

    </section>
  );
}