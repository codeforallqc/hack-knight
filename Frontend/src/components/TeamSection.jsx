// Displays the team member grid on the homepage.
// Imports team data from data/team.js

import { teamMembers } from '../data/team';         // import the teamMembers array from the data folder

export default function TeamSection() {
  return (
    <div>                                           {/* wrapper for the team section */}
      <h2>Meet The Team</h2>                        {/* section heading */}

      <div>                                         {/* grid container — teammate adds CSS grid styling */}
        {teamMembers.map((member, index) => (       // .map() loops over each team member object
          <div key={index}>                         {/* card wrapper for one member; key required by React for lists */}
            <div>[Photo Placeholder]</div>          {/* placeholder — replace with <img src={member.photo} /> later */}
            <p>{member.name}</p>                    {/* member's name */}
            <p>{member.title}</p>                   {/* member's role/title */}
          </div>
        ))}
      </div>

    </div>
  );
}