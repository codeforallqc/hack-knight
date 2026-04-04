import { useState, useEffect } from "react";

export default function CountdownTimer() {

  // ── Target date: the hackathon start date ──
  const targetDate = new Date("2026-10-17T00:00:00").getTime();

  // ── Calculates the time remaining between now and the target date ──
  function calculateTimeLeft() {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference > 0) {
      return {
        months:  Math.floor(difference / (1000 * 60 * 60 * 24 * 30)),
        days:    Math.floor((difference % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    }

    return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  // ── State: holds the current time-left object, initialized on first render ──
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // ── Effect: starts a 1-second interval to update timeLeft, cleans up on unmount ──
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ── Helper: ensures numbers always display as two digits (e.g. 5 → "05") ──
  const formatNumber = (num) => (num < 10 ? `0${num}` : num);

  return (
    // ── Outer wrapper: centers the timer horizontally with vertical spacing ──
    <div className="flex justify-center my-12">

      {/* ── Pill container: rounded card with purple border and dark background ── */}
      <div
        className="border border-ultraviolet rounded-[2rem] px-12 py-8 w-full"
        style={{ backgroundColor: "#343439" }}
      >

        {/* ── Inner row: evenly spaces the five time units + separators ── */}
        <div className="flex gap-10 items-center justify-center">

          {/* ── Time unit: MONTHS ── */}
          <div className="flex flex-col items-center">
            <span className="timer-digit">{formatNumber(timeLeft.months)}</span>
            <small className="timer-label">MONTHS</small>
          </div>

          {/* ── Separator ── */}
          <span className="font-mono text-2xl mb-4" style={{ color: "#4E4E53" }}>:</span>

          {/* ── Time unit: DAYS ── */}
          <div className="flex flex-col items-center">
            <span className="timer-digit">{formatNumber(timeLeft.days)}</span>
            <small className="timer-label">DAYS</small>
          </div>

          {/* ── Separator ── */}
          <span className="font-mono text-2xl mb-4" style={{ color: "#4E4E53" }}>:</span>

          {/* ── Time unit: HOURS ── */}
          <div className="flex flex-col items-center">
            <span className="timer-digit">{formatNumber(timeLeft.hours)}</span>
            <small className="timer-label">HOURS</small>
          </div>

          {/* ── Separator ── */}
          <span className="font-mono text-2xl mb-4" style={{ color: "#4E4E53" }}>:</span>

          {/* ── Time unit: MINUTES ── */}
          <div className="flex flex-col items-center">
            <span className="timer-digit">{formatNumber(timeLeft.minutes)}</span>
            <small className="timer-label">MINUTES</small>
          </div>

          {/* ── Separator ── */}
          <span className="font-mono text-2xl mb-4" style={{ color: "#4E4E53" }}>:</span>

          {/* ── Time unit: SECONDS ── */}
          <div className="flex flex-col items-center">
            <span className="timer-digit">{formatNumber(timeLeft.seconds)}</span>
            <small className="timer-label">SECONDS</small>
          </div>

        </div>
      </div>
    </div>
  );
}