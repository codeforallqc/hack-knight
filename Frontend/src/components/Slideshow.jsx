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

// ─── Slideshow ────────────────────────────────────────────────────────────────
// Props:
//   year      — string label e.g. "2024"
//   photos    — array of { src, alt }
//   direction — +1 or -1 (kept for future use / dot clicks)
export default function Slideshow({ year, photos }) {
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
      <h3 className="font-mono text-ultraviolet uppercase tracking-widest text-sm mb-6 text-center">
        HackKnight {year}
      </h3>

      {/* 3x2 photo grid */}
      <div className="grid grid-cols-3 gap-4">
        {photos.map((photo, i) => (
          // motion.img inherits the "enter" / "center" / "exit" variant names
          // from the parent — no need to re-declare initial/animate/exit here.
          // It just needs `variants={photoVariants}` to know what to do with those names.
          <motion.img
            key={i}
            src={photo.src}
            alt={photo.alt}
            variants={photoVariants}
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
            className="w-full h-48 md:h-64 object-cover rounded-card border border-border bg-surface"
          />
        ))}
      </div>
    </motion.div>
  );
}