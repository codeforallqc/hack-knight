// Imports and stacks every section component in order.
// FAQ and Team are wrapped in <section> tags with IDs so the navbar can anchor-scroll to them.
import { motion } from 'motion/react';
import Hero from '../components/Hero';                       // top banner: title, description, countdown, buttons
import SchedulePreview from '../components/SchedulePreview'; // mini schedule grid + link to full schedule page
import PhotoGallery from '../components/PhotoGallery';       // photo gallery of past events
import FAQ from '../components/FAQ';                         // FAQ accordion
import TeamSection from '../components/TeamSection';         // team member grid
import SponsorsCarousel from '../components/SponsorsCarousel'; // sponsor logo carousel + link to full sponsors page


function FadeInSection({ children, id, className }) { 
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} 
    >
      {children}
    </motion.section>
  );
}

export default function Home() {
  return (
    <main>                                          {/* <main> is the semantic HTML wrapper for the page's primary content */}

      <Hero />                                      {/* section 1: title, dates, description, countdown, CTA buttons */}

      <FadeInSection id="sponsors" className="scroll-mt-20 bg-void border-t border-void py-8 sm:py-24">                       {/* id="sponsors" is the scroll target for the navbar's href="/#sponsors" */}
        <SponsorsCarousel />                          {/* section 2: sponsor logos carousel*/}
      </FadeInSection>

      <FadeInSection id="photos" className="scroll-mt-10">
        <PhotoGallery />                              {/* section 3: photo gallery of past events */}
      </FadeInSection>

      <FadeInSection id="schedule" className="scroll-mt-5">                       {/* id="schedule" is the scroll target for the navbar's href="/#schedule" */}
        <SchedulePreview />                           {/* section 4: schedule preview grid */}
      </FadeInSection>

      <FadeInSection id="team" className="scroll-mt-10">                           {/* id="team" is the scroll target for the navbar's href="/#team" */}
        <TeamSection />                             {/* section 5: team member grid */}
      </FadeInSection>

      <FadeInSection id="faq" className="scroll-mt-10">                            {/* id="faq" is the scroll target for the navbar's href="/#faq" */}
        <FAQ />                                     {/* section 6: FAQ accordion */}
      </FadeInSection>

    </main>
  );
}