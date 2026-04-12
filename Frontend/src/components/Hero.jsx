import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import CountdownTimer from './CountdownTimer';
import MascotEyes from './MascotEyes';
import hillsBgSvg  from '../assets/brand/hillsbg.svg';
import hillsSvg    from '../assets/brand/hills.svg';
import knightsSvg  from '../assets/brand/knights1.svg';
import towerSvg    from '../assets/brand/tower.svg';

export default function Hero() {
  const { scrollY } = useScroll();
  const hillsGroupY = useTransform(scrollY, (v) => v * 0.30);
  const contentY = useTransform(scrollY, (v) => v * 0.90);

  const leftColRef = useRef(null);
  const [towerHeight, setTowerHeight] = useState(undefined);

  const containerVariants = { // this is the container variant for the left column
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = { // this is the item variant for the left column
    hidden: { opacity: 0, y: -50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 15,
        mass: 1.2
      } 
    }
  };

  const towerVariants = { // this is the tower variant for the left column
    hidden: { opacity: 0, y: -100 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: 0.6
      } 
    }
  };

  useEffect(() => { // this effect is used to get the height of the tower
    const el = leftColRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setTowerHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section
      id="hero"
      className="hero-section relative overflow-hidden flex flex-col pt-24 lg:pt-32 pb-8 lg:pb-32 2xl:pb-[22vh]"
      style={{ isolation: 'isolate' }}
    >
      {/* z:0 — Back hill + Knights, slow parallax (hidden on mobile) */}
      <motion.div
        className="hero-hills absolute left-0 h-full w-full pointer-events-none"
        style={{ bottom: 0, zIndex: 0, y: hillsGroupY }}
      >
        <img src={hillsBgSvg} alt="" aria-hidden="true"
          className="absolute left-0 bottom-[8dvh] lg:bottom-0 w-full h-auto pointer-events-none select-none"
          style={{ opacity: 0.35 }}
        />
        <img src={knightsSvg} alt="" aria-hidden="true"
          className="absolute left-0 bottom-[8dvh] lg:bottom-0 w-full h-auto pointer-events-none select-none knights-float"
        />
      </motion.div>

      {/* z:10 — Front hill, static at viewport bottom (hidden on mobile), sits above content */}
      <img
        src={hillsSvg} alt="" aria-hidden="true"
        className="hero-hills absolute left-0 bottom-0 w-full h-auto pointer-events-none select-none"
        style={{ zIndex: 10 }}
      />

      <div className="hero-content-wrapper w-full grid grid-cols-1 lg:grid-cols-[auto_auto] justify-center justify-items-center lg:justify-items-start items-center lg:items-start gap-8 lg:gap-8 xl:gap-8 relative px-6 my-auto z-4 max-w-[2560px] mx-auto">

        {/* z:4 — Left column */}
        <motion.div
          ref={leftColRef}
          className="hero-left-col w-full min-w-0 max-w-xl md:max-w-max"
          style={{ position: 'relative', zIndex: 4, y: contentY }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={itemVariants} className="font-display font-bold text-4xl sm:text-5xl md:text-6xl xl:text-[clamp(2.5rem,5vw,8rem)] text-text-primary mb-2 leading-none xl:whitespace-nowrap">
            <span className="text-ultraviolet">HackKnight</span> 2026
          </motion.h1>

          <motion.p variants={itemVariants} className="font-body text-text-primary text-base sm:text-lg md:text-xl xl:text-[clamp(1.25rem,2.5vw,3.5rem)] mb-4 sm:mb-6">
            October 9th – 11th, 2026
          </motion.p>

          <motion.p variants={itemVariants} className="font-body text-text-secondary text-sm sm:text-base md:text-[clamp(1rem,1.5vw,1.25rem)] max-w-xl lg:max-w-2xl mb-6 lg:mb-4 leading-relaxed">
            HackKnight is a 48-hour hackathon where students come together to create
            innovative projects. We are a student run organization dedicated to providing
            a great event for students to learn and grow. Join us for a weekend of coding,
            learning, and fun!
          </motion.p>

          <motion.div variants={itemVariants} className="hero-buttons flex gap-3 mb-6 w-full flex-wrap">
            <Link to="/register" className="btn-primary text-sm px-5 py-2.5 sm:text-base sm:px-6 sm:py-3">Apply Now</Link>
            <Link to="/schedule" className="btn-outline text-sm px-5 py-2.5 sm:text-base sm:px-6 sm:py-3">View Schedule</Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <CountdownTimer />
          </motion.div>
        </motion.div>

        {/* z:2 — Tower, matches left column height */}
        <motion.div
          className="hero-tower-col shrink-0 w-fit items-start justify-center"
          style={{ position: 'relative', zIndex: 2, y: contentY }}
          variants={towerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="relative">
            <img
              src={towerSvg}
              alt="Castle Tower"
              className="tower-hero select-none pointer-events-none"
              style={{
                height: towerHeight ? `${towerHeight * 1.15}px` : 'clamp(380px, 30vw, 1000px)',
                maxHeight: '1300px',
                width: 'auto',
              }}
            />
            <MascotEyes
              style={{
                position: 'absolute',
                width: '25%',
                left: '37.40%',
                top: '17%',
                pointerEvents: 'none',
              }}
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
