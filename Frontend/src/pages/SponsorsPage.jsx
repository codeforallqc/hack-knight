// Groups sponsors by tier using .filter() on the data from data/sponsors.js

import { sponsors } from '../data/sponsors';        // import the full sponsors array from the data folder

export default function SponsorsPage() {

  // Filter sponsors by tier
  const platinum = sponsors.filter(s => s.tier === "platinum");
  const gold     = sponsors.filter(s => s.tier === "gold");
  const silver   = sponsors.filter(s => s.tier === "silver");
  const bronze   = sponsors.filter(s => s.tier === "bronze");

  return (
    <main className="section-wrapper">

      {/* Page heading */}
      <h1 className="section-title text-center">Our Sponsors</h1>
      <p className="section-subtitle text-center">
        HackKnight is made possible by the support of our amazing sponsors.
      </p>

      {/* Platinum tier — Logo size: Large+, Company Blurb: Yes */}
      {platinum.length > 0 && (
        <section>
          <div className="sponsors-grid-platinum">
            {platinum.map((sponsor, index) => (
              <div key={index} className="sponsor-card platinum">
                <a href={sponsor.url} target="_blank" rel="noreferrer">
                  <img src={sponsor.logo} alt={sponsor.name} data-size="large-plus" />
                </a>
                <p className="sponsor-name">{sponsor.name}</p>
                {sponsor.companyBlurb && (
                  <p className="company-blurb">{sponsor.companyBlurb}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gold tier — Logo size: Large, Company Blurb: Yes */}
      {gold.length > 0 && (
        <section>
          <div className="sponsors-grid-gold">
            {gold.map((sponsor, index) => (
              <div key={index} className="sponsor-card gold">
                <a href={sponsor.url} target="_blank" rel="noreferrer">
                  <img src={sponsor.logo} alt={sponsor.name} data-size="large" />
                </a>
                <p className="sponsor-name">{sponsor.name}</p>
                {sponsor.companyBlurb && (
                  <p className="company-blurb">{sponsor.companyBlurb}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Silver tier — Logo size: Medium, Company Blurb: Yes */}
      {silver.length > 0 && (
        <section>
          <div className="sponsors-grid-silver">
            {silver.map((sponsor, index) => (
              <div key={index} className="sponsor-card silver">
                <a href={sponsor.url} target="_blank" rel="noreferrer">
                  <img src={sponsor.logo} alt={sponsor.name} data-size="medium" />
                </a>
                <p className="sponsor-name">{sponsor.name}</p>
                {sponsor.companyBlurb && (
                  <p className="company-blurb">{sponsor.companyBlurb}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bronze tier — Logo size: Small, Company Blurb: No */}
      {bronze.length > 0 && (
        <section>
          <div className="sponsors-grid-bronze">
            {bronze.map((sponsor, index) => (
              <div key={index} className="sponsor-card bronze">
                <a href={sponsor.url} target="_blank" rel="noreferrer">
                  <img src={sponsor.logo} alt={sponsor.name} data-size="small" />
                </a>
                <p className="sponsor-name">{sponsor.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}
