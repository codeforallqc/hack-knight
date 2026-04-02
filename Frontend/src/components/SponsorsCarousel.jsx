// components/SponsorsCarousel.jsx
// Displays a scrolling row of sponsor logos on the homepage.
// Imports sponsor data from data/sponsors.js
// Has a link to the full /sponsors page.

import { Link } from 'react-router-dom';            // Link for navigating to /sponsors
import { sponsors } from '../data/sponsors';        // import the sponsors array from the data folder

export default function SponsorsCarousel() {
  return (
    <section>                                       {/* section wrapper for the sponsors carousel block */}
      <h2>Our Sponsors</h2>                         {/* section heading */}

      {/* Horizontal scrolling row of sponsor logos */}
      <div>                                         {/* carousel track — teammate adds scroll/animation styling */}
        {sponsors.map((sponsor, index) => (         // loop over each sponsor object in the array
          <a
            key={index}                             // key is required by React when rendering a list
            href={sponsor.url}                      // sponsor's website URL
            target="_blank"                         // opens link in a new tab
            rel="noreferrer"                        // security best practice when using target="_blank"
          >
            <img src={sponsor.logo} alt={sponsor.name} /> {/* sponsor logo image; alt = sponsor name for accessibility */}
          </a>
        ))}
      </div>

      <Link to="/sponsors">View All Sponsors</Link> {/* navigates to the dedicated /sponsors page */}
    </section>
  );
}