import { useState, useEffect } from "react";

export default function CountdownTimer() {

  const targetDate = new Date("2026-10-09T00:00:00").getTime();

  function calculateTimeLeft() { // this function calculates the time left until the target date
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference > 0) {
      return {
        months: Math.floor(difference / (1000 * 60 * 60 * 24 * 30)),
        days: Math.floor((difference % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    }

    return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft()); // this state is used to store the time left until the target date

  useEffect(() => { // this effect is used to update the time left every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num) => (num < 10 ? `0${num}` : num); // this function formats the number to have a leading zero if it is less than 10
  
  return ( // this is the countdown timer component
    <div className="hero-buttons flex w-full mt-2 mb-0"> 
      <div // this is the border around the countdown timer
        className="border border-ultraviolet rounded-[1.25rem] sm:rounded-[2rem] px-3 py-2.5 sm:px-8 sm:py-5 bg-void/80"
      >
        <div className="flex gap-1.5 sm:gap-6 items-center justify-center">
          {/* MONTHS */}
          <div className="flex flex-col items-center">
            <span className="timer-digit">{formatNumber(timeLeft.months)}</span>
            <small className="timer-label">MONTHS</small>
          </div>

          <span className="font-mono text-sm sm:text-xl mb-3 sm:mb-4 text-text-muted">:</span>

          {/* DAYS */}
          <div className="flex flex-col items-center">
            <span className="timer-digit">{formatNumber(timeLeft.days)}</span>
            <small className="timer-label">DAYS</small>
          </div>

          <span className="font-mono text-sm sm:text-xl mb-3 sm:mb-4 text-text-muted">:</span>

          {/* HOURS */}
          <div className="flex flex-col items-center">
            <span className="timer-digit">{formatNumber(timeLeft.hours)}</span>
            <small className="timer-label">HOURS</small>
          </div>

          <span className="font-mono text-sm sm:text-xl mb-3 sm:mb-4 text-text-muted">:</span>

          {/* MINUTES */}
          <div className="flex flex-col items-center">
            <span className="timer-digit">{formatNumber(timeLeft.minutes)}</span>
            <small className="timer-label">MINUTES</small>
          </div>

          <span className="font-mono text-sm sm:text-xl mb-3 sm:mb-4 text-text-muted">:</span>

          {/* SECONDS */}
          <div className="flex flex-col items-center">
            <span className="timer-digit">{formatNumber(timeLeft.seconds)}</span>
            <small className="timer-label">SECONDS</small>
          </div>

        </div>
      </div>
    </div>
  );
}
