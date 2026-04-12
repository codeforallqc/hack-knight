import { useRef } from "react";
import { motion } from "motion/react";

// ─── Parent variant (the grid wrapper) ───────────────────────────────────────
// The grid itself doesn't visually animate — it just orchestrates its children.
// `staggerChildren` means each child starts its animation 0.08s after the previous one.
// `delayChildren` adds a small pause before the first child starts.
const gridVariants = {
  enter:  { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  center: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  exit:   { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  // staggerDirection: -1 means the exit stagger runs in reverse order (last photo exits first)
};

// ─── Child variant (each individual photo) ───────────────────────────────────
// Each photo starts invisible and slightly shifted down, then rises into place.
// On exit, it fades out and drops slightly.
const photoVariants = {
  enter:  { opacity: 0, y: 20, scale: 0.97 },   // starts below and faded
  center: { opacity: 1, y: 0,  scale: 1    },   // fully visible, in position
  exit:   { opacity: 0, y: -10, scale: 0.97 },  // exits upward and fades
};

// ─── ParallaxPhoto ────────────────────────────────────────────────────────────
// Wraps each photo in a perspective container and applies a 3-D skew/tilt based
// on where the cursor is relative to the card centre.
function ParallaxPhoto({ photo, index, year, onPhotoClick, isActive }) {
  const cardRef = useRef(null);
  const frameRef = useRef(null); // rAF handle

  function handleMouseMove(e) {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    frameRef.current = requestAnimationFrame(() => {
      const el = cardRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      // Normalised position: -1 … +1 relative to card centre
      const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;

      // Max tilt in degrees
      const MAX = 5;
      const rotateY =  nx * MAX;   // left→right tilt
      const rotateX = -ny * MAX;   // top→bottom tilt (inverted so it lifts)

      el.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04,1.04,1.04)`;
    });
  }

  function handleMouseLeave() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    const el = cardRef.current;
    if (el) el.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
  }

  return (
    // Outer motion.div handles entry/exit animation variants
    <motion.div
      variants={photoVariants}
      transition={{ duration: 0.4, ease: "easeOut" }}
      // perspective container so children render in 3-D space — no border here
      style={{ perspective: "600px" }}
    >
      {/* Inner tilt layer — border/radius/overflow live here so they rotate with the card */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transition: "transform 0.12s ease-out",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        className={`rounded-card overflow-hidden bg-surface cursor-zoom-in transition-all duration-300 hover:shadow-glow hover:border-ultraviolet/40 ${isActive ? "border-transparent border" : "border border-border"}`}
        data-cursor="pointer"
      >
        <motion.img
          layoutId={`gallery-${year}-${index}`}
          onClick={() => onPhotoClick && onPhotoClick(photo, index)}
          src={photo.src}
          alt={photo.alt}
          className="w-full h-36 sm:h-48 md:h-64 object-cover block"
        />
      </div>
    </motion.div>
  );
}

// ─── Slideshow ────────────────────────────────────────────────────────────────
// Props:
//   year      — string label e.g. "2024"
//   photos    — array of { src, alt }
//   direction — +1 or -1 (kept for future use / dot clicks)
//   onPhotoClick — callback to trigger the modal
export default function Slideshow({ year, photos, onPhotoClick, activePhoto }) {
  return (
    // motion.div is the grid parent — it holds the stagger orchestration.
    // `initial`, `animate`, `exit` here match the keys in gridVariants.
    // Motion automatically passes these variant names down to all motion.* children.
    <motion.div
      variants={gridVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full"
    >
      {/* Year label */}
      <h3 className="font-mono uppercase tracking-widest text-lg md:text-xl mb-6 text-center">
        <span className="font-bold text-ultraviolet">HackKnight</span> <span className="font-bold text-white">{year}</span>
      </h3>

      {/* Responsive photo grid: 2 cols on mobile, 3 on tablet/desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {photos.map((photo, i) => (
          <ParallaxPhoto
            key={i}
            photo={photo}
            index={i}
            year={year}
            onPhotoClick={onPhotoClick}
            isActive={activePhoto?.year === year && activePhoto?.idx === i}
          />
        ))}
      </div>
    </motion.div>
  );
}