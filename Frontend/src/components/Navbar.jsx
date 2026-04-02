import { Link } from 'react-router-dom';  // Link is React Router's version of <a> — it navigates without refreshing the page

export default function Navbar() {
  return (
    <nav>                                              {/* <nav> is a semantic HTML element for navigation */}
      
      <Link to="/">                                    {/* clicking the logo goes back to the homepage */}
        <span>HackKnight</span>                        {/* placeholder for the logo/brand name */}
      </Link>

      <ul>                                             {/* unordered list to hold nav items */}

        <li>                                           {/* list item for Schedule */}
          <Link to="/schedule">Schedule</Link>         {/* Link navigates to the /schedule page */}
        </li>

        <li>                                           {/* list item for Team */}
          <a href="/#team">Team</a>                    {/* href="/#team" scrolls to the element with id="team" on the homepage */}
        </li>

        <li>                                           {/* list item for Sponsors */}
          <Link to="/sponsors">Sponsors</Link>         {/* Link navigates to the /sponsors page */}
        </li>

        <li>                                           {/* list item for FAQ */}
          <a href="/#faq">FAQ</a>                      {/* href="/#faq" scrolls to the element with id="faq" on the homepage */}
        </li>

      </ul>

      <button>Register</button>                        {/* placeholder Register button — no functionality yet */}

    </nav>
  );
}