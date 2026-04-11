// Site-wide footer with nav links, social links, and legal info.
// Rendered in App.jsx so it appears on every page.

import { Link } from 'react-router-dom';            // Link for internal page navigation
import logoUrl from '../assets/logoprimary.svg';           // dynamically import the logo from assets

export default function Footer() {
  return (
    <footer className="bg-surface/30 border-t border-border mt-24">                                        {/* <footer> is a semantic HTML element for the bottom of the page */}
      <div className="section-wrapper py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center mb-4 hover:scale-105 transition-transform duration-300 origin-left w-max">
            <img src={logoUrl} alt="HackKnight Logo" className="w-12 h-12" />
            <span className="font-display font-bold text-text-primary text-2xl leading-none pt-1">HackKnight</span>                     {/* brand name — replace with <img> logo later */}
          </Link>
          <p className="font-body text-text-secondary text-sm leading-relaxed">Hack Knight is a 48-hour hackathon where students come together to create innovative projects.</p>
        </div>

        {/* Navigation column */}
        <div className="flex flex-col">
          <h4 className="font-display text-text-primary mb-4">HackKnight</h4>                         {/* column heading */}
          <a href="/#faq" className="navbar-link mb-2 text-sm">FAQ</a>                     {/* anchor link — scrolls to #faq section on homepage */}
          <Link to="/schedule" className="navbar-link mb-2 text-sm">Schedule</Link>        {/* navigates to the /schedule page */}
          <a href="/#team" className="navbar-link mb-2 text-sm">Team</a>                   {/* anchor link — scrolls to #team section on homepage */}
          <Link to="/sponsors" className="navbar-link mb-2 text-sm">Sponsors</Link>        {/* navigates to the /sponsors page */}
        </div>

        {/* Social links column */}
        <div className="flex flex-col">
          <h4 className="font-display text-text-primary mb-4">Follow Us</h4>                          {/* column heading */}
          <a href="https://www.instagram.com/codeforall_qc/" className="navbar-link mb-2 text-sm">Code For All Instagram</a>      {/* placeholder href — replace with real URL later */}
          <a href="https://www.instagram.com/hack.qc/" className="navbar-link mb-2 text-sm">Hack Knight Instagram</a>       {/* placeholder href */}
          <a href="https://discord.gg/z2AN2nuGx3" className="navbar-link mb-2 text-sm">Hack Knight Server</a>          {/* placeholder href */}
          <a href="https://discord.gg/fhDhVRPU7w" className="navbar-link mb-2 text-sm">Code for All Server</a>         {/* placeholder href */}
        </div>

        {/* Legal column */}
        <div className="flex flex-col">
          <h4 className="font-display text-text-primary mb-4">Legal</h4>                              {/* column heading */}
          <a href="https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md" className="navbar-link mb-2 text-sm">MLH Code of Conduct</a>         {/* placeholder href — replace with real MLH link later */}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/50 py-6 text-center md:flex md:justify-between px-container max-w-7xl mx-auto">
        <p className="font-body text-text-muted text-xs mb-4 md:mb-0">©2026 HackKnight</p>                       {/* copyright line */}
      </div>
    </footer>
  );
}