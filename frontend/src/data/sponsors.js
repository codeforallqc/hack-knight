import placeholder from '../assets/logos/placeholder.png';

// When real logos arrive, add individual imports here:
// import bloomberg from '../assets/logos/bloomberg.png';
// import mlh       from '../assets/logos/mlh.png';
// etc.

const blurbPlaceholder = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

export const sponsors = [
  { name: "Bloomberg",      logo: placeholder, tier: "platinum", url: "https://bloomberg.com",   companyBlurb: blurbPlaceholder },
  { name: "MLH",            logo: placeholder, tier: "gold",     url: "https://mlh.io",           companyBlurb: blurbPlaceholder },
  { name: "Capital One",    logo: placeholder, tier: "silver",   url: "https://capitalone.com",   companyBlurb: blurbPlaceholder },
  { name: "CodePath",       logo: placeholder, tier: "silver",   url: "https://codepath.org",     companyBlurb: blurbPlaceholder },
  { name: "Queens College", logo: placeholder, tier: "bronze",   url: "https://qc.cuny.edu" },
  { name: "S-STEM",         logo: placeholder, tier: "bronze",   url: "#" },
  { name: "Join Us", logo: placeholder, tier: "bronze", url: "#"}
];