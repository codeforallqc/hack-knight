import { useEffect, useRef } from 'react';
import { animate } from 'motion/react';
import logoBaseSvg from '../assets/brand/logobase.svg';

// ── Eye geometry (% of logo SVG viewBox 2622 × 3544) ──────────────────────
const LEFT_EYE = { cx: 29.83, cy: 67.70 };
const RIGHT_EYE = { cx: 70.15, cy: 67.70 };

// Pupil travel limits (% of mascot container)
const SLOT_HALF_W = 10.0;
const SLOT_HALF_H = 20.0;

// Blink timing
const BLINK_DURATION = 0.1;    // seconds each half of blink
const BLINK_MIN_MS = 2500;
const BLINK_MAX_MS = 5500;

// ── Pupil sub-component ────────────────────────────────────────────────────
// Outer div handles mouse translation; inner motion target handles blink scaleY.
function Pupil({ eye, translateRef, blinkRef }) {
  return (
    <div
      ref={translateRef}
      className="mascot-pupil"
      style={{
        left: `${eye.cx}%`,
        top: `${eye.cy}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Inner element — Motion animates scaleY here only */}
      <div
        ref={blinkRef}
        className="w-full h-full rounded-[20%] bg-void"
        style={{ transformOrigin: 'center center' }}
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function MascotEyes({ className = '', style = {} }) {
  const containerRef = useRef(null);

  // Translation refs (moved by mouse)
  const leftTransRef = useRef(null);
  const rightTransRef = useRef(null);

  // Blink refs (animated by Motion)
  const leftBlinkRef = useRef(null);
  const rightBlinkRef = useRef(null);

  // ── Mouse tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      const rawX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const rawY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const len = Math.sqrt(rawX * rawX + rawY * rawY);
      const nx = len > 1 ? rawX / len : rawX;
      const ny = len > 1 ? rawY / len : rawY;

      const ox = nx * SLOT_HALF_W;
      const oy = ny * SLOT_HALF_H;
      const t = `translate(calc(-50% + ${ox}%), calc(-50% + ${oy}%))`;

      if (leftTransRef.current) leftTransRef.current.style.transform = t;
      if (rightTransRef.current) rightTransRef.current.style.transform = t;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ── Blink loop (Motion) ──────────────────────────────────────────────────
  useEffect(() => {
    let timer;

    const doBlink = async () => {
      const targets = [leftBlinkRef.current, rightBlinkRef.current].filter(Boolean);
      // Close
      await animate(targets, { scaleY: 0 }, { duration: BLINK_DURATION, ease: 'easeIn' });
      // Open
      await animate(targets, { scaleY: 1 }, { duration: BLINK_DURATION, ease: 'easeOut' });
    };

    const scheduleNext = () => {
      const delay = BLINK_MIN_MS + Math.random() * (BLINK_MAX_MS - BLINK_MIN_MS);
      timer = setTimeout(async () => {
        await doBlink();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`mascot ${className}`}
      style={style}
    >
      <img
        src={logoBaseSvg}
        alt="HackKnight mascot"
        className="mascot-base"
        draggable={false}
      />

      <Pupil
        eye={LEFT_EYE}
        translateRef={leftTransRef}
        blinkRef={leftBlinkRef}
      />
      <Pupil
        eye={RIGHT_EYE}
        translateRef={rightTransRef}
        blinkRef={rightBlinkRef}
      />
    </div>
  );
}
