// Displays the team member grid on the homepage.
// Imports team data from data/team.js

import { teamMembers } from '../data/team';

export default function TeamSection() {
  return (
    <div className="section-wrapper">

      {/* ── Section Header — outside the card ── */}
      <h2 className="section-title text-center">
        Meet The Team
      </h2>

      {/* Surface card — matches carousel / other sections */}
      <div className="bg-surface rounded-3xl py-8 sm:py-14 px-6 sm:px-12 mt-6 sm:mt-10">

        {/* ── Team Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {teamMembers.map((member, index) => (

            // Each member gets its own column. No card background here —
            // the image IS the visual block, and the text sits below it.
            <div key={index} className="flex flex-col gap-3">

              {/* ── Photo Block ── */}
              {/* 
                `relative` here is KEY — it makes this div the "anchor" for the badge.
                Any child with `absolute` positioning will be placed relative to THIS div.
              */}
              <div className="relative rounded-xl overflow-hidden aspect-square bg-border">

                {/* The member's photo — fills the entire square */}
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />

                {/* ── Character Badge ──
                  `absolute` pulls it out of normal flow and pins it to the parent.
                  `bottom-2 right-2` places it 8px from the bottom-right corner.
                  `w-16 h-16` controls the badge size — adjust to taste.
                */}
                <img
                  src={member.badge}
                  alt="character badge"
                  className="absolute bottom-2 right-2 w-16 h-16 object-contain"
                />
              </div>

              {/* ── Name & Title — sit BELOW the photo, outside the image block ── */}
              <div>
                <p className="font-display font-bold text-base text-text-primary">
                  {member.name}
                </p>
                <p className="font-body text-sm text-ultraviolet">
                  {member.title}
                </p>
              </div>

            </div>
          ))}
        </div>

      </div>{/* end surface card */}

    </div>
  );
}