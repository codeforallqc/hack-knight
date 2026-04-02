// Uses the same data from data/schedule.js but displays all time slots.

import { scheduleEvents } from '../data/schedule';  // import schedule data from the data folder

export default function SchedulePage() {

  // Array of every hour label shown on the left side of the grid
  const timeSlots = [                               // each string is one row in the schedule grid
    "6AM","7AM","8AM","9AM","10AM","11AM","12PM",
    "1PM","2PM","3PM","4PM","5PM","6PM","7PM",
    "8PM","9PM","10PM","11PM","12AM",
  ];

  return (
    <main>                                          {/* primary content of the schedule page */}
      <h1>Schedule</h1>                             {/* page heading */}
      <p>October 17th - 19th, 2026</p>             {/* event date range */}

      <div>                                         {/* outer wrapper for the full schedule grid */}

        {/* Column headers row */}
        <div>                                       {/* header row wrapper */}
          <span>Fri 10/17</span>                   {/* Friday column label */}
          <span>Sat 10/18</span>                   {/* Saturday column label */}
          <span>Sun 10/19</span>                   {/* Sunday column label */}
        </div>

        {/* Time slot rows — one div per hour */}
        {timeSlots.map((time, index) => (           // .map() loops over the timeSlots array
          <div key={index}>                         {/* one row per hour; key required by React for lists */}
            <span>{time}</span>                     {/* time label on the left side of the row */}
            {/* Event blocks per column go here — will be built out once real schedule data is finalized */}
          </div>
        ))}

      </div>
    </main>
  );
}