// Site-wide footer with nav links, social links, and legal info.
// Rendered in App.jsx so it appears on every page.

import { Link } from 'react-router-dom';            // Link for internal page navigation

export default function Footer() {
  return (
    <footer>                                        {/* <footer> is a semantic HTML element for the bottom of the page */}

      {/* Brand column */}
      <div>
        <span>HackKnight</span>                     {/* brand name — replace with <img> logo later */}
        <p>Hack Knight is a 48-hour hackathon where students come together to create innovative projects.</p>
      </div>

      {/* Navigation column */}
      <div>
        <h4>HackKnight</h4>                         {/* column heading */}
        <a href="/#faq">FAQ</a>                     {/* anchor link — scrolls to #faq section on homepage */}
        <Link to="/schedule">Schedule</Link>        {/* navigates to the /schedule page */}
        <a href="/#team">Team</a>                   {/* anchor link — scrolls to #team section on homepage */}
        <Link to="/sponsors">Sponsors</Link>        {/* navigates to the /sponsors page */}
      </div>

      {/* Social links column */}
      <div>
        <h4>Follow Us</h4>                          {/* column heading */}
        <a href="#">Code For All Instagram</a>      {/* placeholder href — replace with real URL later */}
        <a href="#">Hack Knight Instagram</a>       {/* placeholder href */}
        <a href="#">Hack Knight Server</a>          {/* placeholder href */}
        <a href="#">Code for All Server</a>         {/* placeholder href */}
      </div>

      {/* Legal column */}
      <div>
        <h4>Legal</h4>                              {/* column heading */}
        <a href="#">MLH Code of Conduct</a>         {/* placeholder href — replace with real MLH link later */}
      </div>

      {/* Bottom bar */}
      <p>©2022 HackKnight</p>                       {/* copyright line */}
      <div>
        <a href="#">Privacy & Policy</a>            {/* placeholder href */}
        <a href="#">Terms & Condition</a>           {/* placeholder href */}
      </div>

    </footer>
  );
}