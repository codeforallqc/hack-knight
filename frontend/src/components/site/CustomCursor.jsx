import { useState, useEffect } from 'react';
import { motion, useMotionValue } from 'motion/react';

const POINTER_SELECTOR =
  'a, button, [role="button"], select, label[for], summary, [tabindex]:not([tabindex="-1"]), [data-cursor="pointer"]';

// Spring config for the morph transition between cursor states
const morphSpring = { type: 'spring', stiffness: 500, damping: 28, mass: 0.5 };

// Only render the custom cursor on devices with a precise pointer (mouse/trackpad).
// On touch/mobile devices we return null so the native tap indicator is preserved.
const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

export default function CustomCursor() {
  if (!hasFinePointer) return null;

  // useMotionValue drives the div position — updates bypass React re-renders entirely
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setIsPointer(!!e.target.closest(POINTER_SELECTOR));
      setIsVisible(true);
    };
    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x,
        y,
        width: 32,
        height: 32,
        pointerEvents: 'none',
        zIndex: 99999,
        willChange: 'transform',
      }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Default arrow cursor — hotspot at top-left (0, 0) */}
      <motion.img
        src="/cursors/default-cursor.svg"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: 32,
          height: 32,
          transformOrigin: '0 0',
        }}
        animate={{
          opacity: isPointer ? 0 : 1,
          scale:   isPointer ? 0.65 : 1,
        }}
        transition={morphSpring}
      />

      {/* Click / pointer cursor — fingertip hotspot at (13, 0) */}
      <motion.img
        src="/cursors/click-cursor.svg"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: 32,
          height: 32,
          marginLeft: -13, // shifts fingertip to align with default tip
          transformOrigin: '13px 0px',
        }}
        animate={{
          opacity: isPointer ? 1 : 0,
          scale:   isPointer ? 1 : 0.65,
        }}
        transition={morphSpring}
      />
    </motion.div>
  );
}
