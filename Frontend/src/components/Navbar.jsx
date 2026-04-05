import { Link } from 'react-router-dom';  // Link is React Router's version of <a> — it navigates without refreshing the page
import logoUrl from '../assets/logo.svg'; // dynamically import the logo from assets

export default function Navbar() {
  return (
    <nav className="navbar">                           {/* <nav> is a semantic HTML element for navigation */}

      <a href="/#hero" className="flex items-center font-display text-text-primary text-xl hover:scale-105 transition-transform duration-300 origin-left">                                    {/* clicking the logo scrolls to the hero section */}
        <img src={logoUrl} alt="HackKnight Logo" className="w-10 h-10" />
        <span className="leading-none pt-0.5 font-bold text-2xl">HackKnight</span>
      </a>

      <ul className="flex gap-25 items-center">         {/* unordered list to hold nav items */}

        <li>                                           {/* list item for Schedule */}
          <a href="/#schedule" className="navbar-link">Schedule</a>         {/* href="/#schedule" scrolls to the element with id="schedule" on the homepage */}
        </li>

        <li>                                           {/* list item for Team */}
          <a href="/#team" className="navbar-link">Team</a>                    {/* href="/#team" scrolls to the element with id="team" on the homepage */}
        </li>

        <li>                                           {/* list item for Sponsors */}
          <a href="/#sponsors" className="navbar-link">Sponsors</a>         {/* href="/#sponsors" scrolls to the element with id="sponsors" on the homepage */}
        </li>

        <li>                                           {/* list item for FAQ */}
          <a href="/#faq" className="navbar-link">FAQ</a>                      {/* href="/#faq" scrolls to the element with id="faq" on the homepage */}
        </li>

        <li>                                           {/* list item for Photo Gallery */}
          <a href="/#gallery" className="navbar-link">Previous Event Highlights</a>         {/* href="/#sponsors" scrolls to the element with id="sponsors" on the homepage */}
        </li>

      </ul>

      <Link to="/register" className="btn-primary">Register</Link>                        {/* placeholder Register button — TEMPORARY */}

    </nav>
  );
}