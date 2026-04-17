// components/SponsorsCarousel.jsx
// Displays a scrolling row of sponsor logos on the homepage.
// Imports sponsor data from data/sponsors.js
// Has a link to the full /sponsors page.

import { Link } from 'react-router-dom';            // Link for navigating to /sponsors
import { motion } from 'motion/react';              // Framer Motion for infinite carousel loop
import { sponsors } from '../data/sponsors';        // import the sponsors array from the data folder

export default function SponsorsCarousel() {
  return (
    <div className="section-wrapper my-0.5">

      {/* Header — outside the surface card, above it */}
      <h2 className="section-title text-center text-2xl sm:text-4xl md:text-6xl mb-6 sm:mb-10">Our Sponsors</h2>

      {/* Surface card — carousel strip only */}
      <div className="bg-surface rounded-3xl py-6 sm:py-12">
        {/* Horizontal scrolling row of sponsor logos */}
        <div
          className="w-full py-3 sm:py-6 overflow-hidden relative flex"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
          }}
        >
          <motion.div
            className="flex items-center gap-4 sm:gap-8 w-max pr-4 sm:pr-8"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              ease: "linear",
              duration: 40,
              repeat: Infinity
            }}
          >
            {[...sponsors, ...sponsors].map((sponsor, index) => (
              <a
                key={index}
                href={sponsor.url}
                target="_blank"
                rel="noreferrer"
                className="card-sponsor shrink-0 w-36 h-24 sm:w-56 sm:h-36 flex items-center justify-center p-3 sm:p-8"
              >
                <img src={sponsor.logo} alt={sponsor.name} className="max-w-[85%] max-h-14 sm:max-h-20 object-contain" />
              </a>
            ))}
          </motion.div>
        </div>
      </div>

      {/* "View All" button — outside the surface card, below it */}
      <div className="text-center mt-6 sm:mt-8">
        <Link to="/sponsors" className="btn-outline text-xs px-4 py-2 sm:text-base sm:px-6 sm:py-3">View All Sponsors</Link> {/* navigates to the dedicated /sponsors page */}
      </div>

    </div>
  );
}