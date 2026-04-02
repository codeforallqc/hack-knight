// Groups sponsors by tier using .filter() on the data from data/sponsors.js

import { sponsors } from '../data/sponsors';        // import the full sponsors array from the data folder

export default function SponsorsPage() {

  // .filter() returns a new array keeping only items where the condition is true
  // s => s.tier === "gold" means: for each sponsor s, keep it if its tier equals "gold"
  const gold   = sponsors.filter(s => s.tier === "gold");   // array of only gold sponsors
  const silver = sponsors.filter(s => s.tier === "silver"); // array of only silver sponsors
  const bronze = sponsors.filter(s => s.tier === "bronze"); // array of only bronze sponsors

  return (
    <main>                                          {/* primary content of the sponsors page */}
      <h1>Our Sponsors</h1>                         {/* page heading */}

      {/* Gold tier — largest logos, displayed biggest */}
      <section>                                     {/* groups the gold sponsors */}
        <h2>Gold</h2>                               {/* tier label */}
        <div>                                       {/* logo container */}
          {gold.map((sponsor, index) => (           // loop over gold sponsors only
            <a
              key={index}                           // key required by React for lists
              href={sponsor.url}                    // sponsor website
              target="_blank"                       // open in new tab
              rel="noreferrer"                      // security best practice with target="_blank"
            >
              <img src={sponsor.logo} alt={sponsor.name} /> {/* sponsor logo */}
            </a>
          ))}
        </div>
      </section>

      {/* Silver tier */}
      <section>
        <h2>Silver</h2>
        <div>
          {silver.map((sponsor, index) => (
            <a key={index} href={sponsor.url} target="_blank" rel="noreferrer">
              <img src={sponsor.logo} alt={sponsor.name} />
            </a>
          ))}
        </div>
      </section>

      {/* Bronze tier */}
      <section>
        <h2>Bronze</h2>
        <div>
          {bronze.map((sponsor, index) => (
            <a key={index} href={sponsor.url} target="_blank" rel="noreferrer">
              <img src={sponsor.logo} alt={sponsor.name} />
            </a>
          ))}
        </div>
      </section>

    </main>
  );
}