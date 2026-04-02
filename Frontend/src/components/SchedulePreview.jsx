import { Link } from 'react-router-dom';            // Link for navigating to /schedule
import { scheduleEvents } from '../data/schedule';  // import schedule data from the data folder

export default function SchedulePreview() {
  return (
    <section>                                       {/* section wrapper for this block */}
      <h2>Schedule</h2>                             {/* section heading */}
      <p>October 17th - 19th, 2026</p>             {/* event date range */}

      <div>                                         {/* grid container — teammate adds CSS grid styling */}

        {/* Column headers for the three days */}
        <div>                                       {/* header row */}
          <span>Fri 10/17</span>                   {/* Friday column label */}
          <span>Sat 10/18</span>                   {/* Saturday column label */}
          <span>Sun 10/19</span>                   {/* Sunday column label */}
        </div>

        {/* Loop over schedule events and render a row for each */}
        {scheduleEvents.map((event, index) => (     // .map() loops over the array; event = current item, index = its position
          <div key={index}>                         {/* key is required by React when rendering a list */}
            <span>{event.day}</span>                {/* which day the event falls on */}
            <span>{event.label}</span>              {/* the event name */}
          </div>
        ))}

      </div>

      <Link to="/schedule">View Full Schedule</Link> {/* navigates to the dedicated /schedule page */}
    </section>
  );
}