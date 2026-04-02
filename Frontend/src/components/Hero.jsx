import { Link } from 'react-router-dom';            // Link for navigating to /schedule without a page refresh
import CountdownTimer from './CountdownTimer';       // import the countdown as its own component to keep this file clean

export default function Hero() {
  return (
    <section>                                       {/* <section> groups this related block of content */}

      <h1>HackKnight 2026</h1>                      {/* main page heading — biggest text on the page */}
      <p>October 17th - 19th, 2026</p>             {/* event date subtitle */}

      <p>
        HackKnight is a 48-hour hackathon where students come together to create
        innovative projects. We are a student run organization dedicated to providing
        a great event for students to learn and grow. Join us for a weekend of coding,
        learning, and fun!
      </p>                                          {/* event description paragraph */}

      <CountdownTimer />                            {/* renders the countdown block — it's its own component */}

      <div>                                         {/* wrapper to group the two side-by-side buttons */}
        <button>Register Now</button>               {/* primary CTA — no functionality yet */}
        <Link to="/schedule">View Schedule</Link>   {/* navigates to the full /schedule page */}
      </div>

    </section>
  );
}