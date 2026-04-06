import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ComingSoon() {
  useEffect(() => {
    window.scrollTo(0, 0);  // force scroll to top on mount
  }, []);
  
  return (
    <section className="flex flex-col items-center justify-center text-center px-container" style={{ minHeight: "calc(100vh - 4rem)" }}>
      <h1 className="font-display font-bold text-hero text-text-primary mb-4">
        Applications <span className="text-ultraviolet">Opening Soon</span>
      </h1>

      <p className="section-subtitle max-w-xl text-center mx-auto">
        We're putting the finishing touches on registration. Check back soon!
      </p>

      <Link to="/" className="btn-outline mt-6">
        ← Back to Home
      </Link>

    </section>
  );
}