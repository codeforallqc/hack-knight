import { useRef } from 'react';
import { useTeam } from '../hooks/useTeam';

function MemberCard({ member }) {
  const cardRef = useRef(null);
  const frameRef = useRef(null);
  // Tracks flip state imperatively — no re-render needed, rAF callbacks read it directly.
  const flippedRef = useRef(false);
  const hasBadge = !!member.badge;

  function handleMouseMove(e) {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      const MAX = 8;
      el.style.transition = 'transform 0.12s ease-out';
      if (flippedRef.current) {
        // Back face: negate rotateY so the tilt feels natural on the mirrored axis.
        el.style.transform = `perspective(600px) rotateY(${180 - nx * MAX}deg) rotateX(${-ny * MAX}deg) scale3d(1.04,1.04,1.04)`;
      } else {
        el.style.transform = `perspective(600px) rotateX(${-ny * MAX}deg) rotateY(${nx * MAX}deg) scale3d(1.04,1.04,1.04)`;
      }
    });
  }

  function handleMouseLeave() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    const el = cardRef.current;
    if (el) {
      el.style.transition = 'transform 0.35s ease-out';
      el.style.transform = flippedRef.current
        ? 'perspective(600px) rotateY(180deg)'
        : 'perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    }
  }

  function handleClick() {
    if (!hasBadge) return;
    const el = cardRef.current;
    if (!el) return;
    const next = !flippedRef.current;
    flippedRef.current = next;
    el.style.transition = 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)';
    el.style.transform = next
      ? 'perspective(600px) rotateY(180deg)'
      : 'perspective(600px) rotateY(0deg)';
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Photo Block (parallax + flip) ── */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`relative aspect-square rounded-xl hover:border-ultraviolet/40 hover:shadow-glow transition-[box-shadow,border-color] duration-300 ${hasBadge ? 'cursor-pointer' : ''}`}
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        {/* Front face: profile photo + small badge hint */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden bg-white"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <img
            src={member.photo}
            alt={member.name}
            className="w-full h-full object-cover"
          />
          {hasBadge && (
            <img
              src={member.badge}
              alt="character badge"
              className="absolute bottom-2 right-2 w-16 h-16 object-contain"
            />
          )}
        </div>

        {/* Back face: full badge */}
        {hasBadge && (
          <div
            className="absolute inset-0 rounded-xl overflow-hidden bg-void flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <img
              src={member.badge}
              alt={`${member.name} character`}
              className="w-full h-full object-contain p-6"
            />
          </div>
        )}
      </div>

      {/* ── Name & Title ── */}
      <div className="flex justify-between">
        <div>
          <p className="font-display font-bold text-base text-text-primary">
            {member.name}
          </p>
          <p className="font-body text-sm text-ultraviolet">
            {member.title}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Company logo badges lead the row — badge 1, badge 2, then socials */}
          {(member.companies ?? []).map((company) => (
            <img
              key={company.id}
              src={company.logo}
              alt={`${company.name} logo`}
              title={company.name}
              className="w-6 h-6 object-contain transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.85)] hover:scale-110"
            />
          ))}
          {member.github && (
            <a href={member.github} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              <img
                src="https://img.icons8.com/ios-filled/50/000000/github.png"
                alt="GitHub"
                className="w-6 h-6 invert transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.85)] hover:scale-110"
              />
            </a>
          )}
          {member.linkedin && (
            <a href={member.linkedin} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              <img
                src="https://img.icons8.com/ios-filled/50/000000/linkedin.png"
                alt="LinkedIn"
                className="w-6 h-6 invert transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(10,102,194,1)] hover:scale-110"
              />
            </a>
          )}
        </div>
      </div>

    </div>
  );
}

export default function TeamSection() {
  const { teamMembers } = useTeam();

  return (
    <div className="section-wrapper">

      <h2 className="section-title text-center">
        Meet The Team
      </h2>

      <div className="bg-surface rounded-3xl py-8 sm:py-14 px-6 sm:px-12 mt-6 sm:mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {teamMembers.map((member, index) => (
            <MemberCard key={index} member={member} />
          ))}
        </div>
      </div>

    </div>
  );
}
