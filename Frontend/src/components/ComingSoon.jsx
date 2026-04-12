import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import MascotEyes from './MascotEyes';

export default function ComingSoon() {
  useEffect(() => {
    window.scrollTo(0, 0);  // force scroll to top on mount
  }, []);
  
  return (
    <section className="section-wrapper" style={{ minHeight: "calc(100vh - 4rem)" }}>
      {/* Back button */}
      <div className="mb-12">
        <Link to="/" className="inline-flex items-center gap-2 font-mono uppercase text-sm text-text-secondary hover:text-ultraviolet hover:-translate-x-1 transition-all duration-300">
          <span>&larr;</span> Back to Home
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center text-center mt-20">
        <h1 className="font-display font-bold text-4xl md:text-6xl text-text-primary mb-4">
          Applications <span className="text-ultraviolet">Opening Soon</span>
        </h1>
  
        <p className="font-body text-text-secondary text-base max-w-xl text-center mx-auto">
          We're putting the finishing touches on registration. Check back soon!
        </p>
      </div>

      <div className="flex justify-center mt-12">
        <MascotEyes />
      </div>
    </section>
  );
}