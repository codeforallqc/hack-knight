// ─── 2024 Photos ─────────────────────────────────────────────────────────────
import hk24_1 from "../assets/photos/2024/hackknight_1.webp";
import hk24_2 from "../assets/photos/2024/hackknight_2.webp";
import hk24_3 from "../assets/photos/2024/hackknight_3.webp";
import hk24_4 from "../assets/photos/2024/hackknight_4.webp";
import hk24_5 from "../assets/photos/2024/hackknight_5.webp";
import hk24_6 from "../assets/photos/2024/hackknight_6.webp";

// ─── 2025 Photos ─────────────────────────────────────────────────────────────
import hk25_1 from "../assets/photos/2025/hackknight25_1.webp";
import hk25_2 from "../assets/photos/2025/hackknight25_2.webp";
import hk25_3 from "../assets/photos/2025/hackknight25_3.webp";
import hk25_4 from "../assets/photos/2025/hackknight25_4.webp";
import hk25_5 from "../assets/photos/2025/hackknight25_5.webp";
import hk25_6 from "../assets/photos/2025/hackknight25_6.webp";

// ─── Gallery Data ─────────────────────────────────────────────────────────────
// To add a new year: import the photos above, then add a new object below.
// The components never need to change — only this file.
const GALLERY_DATA = [
  {
    year: "2024",
    photos: [
      { src: hk24_1, alt: "HackKnight 2024 event photo 1" },
      { src: hk24_2, alt: "HackKnight 2024 event photo 2" },
      { src: hk24_3, alt: "HackKnight 2024 event photo 3" },
      { src: hk24_4, alt: "HackKnight 2024 event photo 4" },
      { src: hk24_5, alt: "HackKnight 2024 event photo 5" },
      { src: hk24_6, alt: "HackKnight 2024 event photo 6" },
    ],
  },
  {
    year: "2025",
    photos: [
      { src: hk25_1, alt: "HackKnight 2025 event photo 1" },
      { src: hk25_2, alt: "HackKnight 2025 event photo 2" },
      { src: hk25_3, alt: "HackKnight 2025 event photo 3" },
      { src: hk25_4, alt: "HackKnight 2025 event photo 4" },
      { src: hk25_5, alt: "HackKnight 2025 event photo 5" },
      { src: hk25_6, alt: "HackKnight 2025 event photo 6" },
    ],
  },
  // ── Add 2026 here ──────────────────────────────────────────────────────────
  // {
  //   year: "2026",
  //   photos: [
  //     { src: hk26_1, alt: "HackKnight 2026 event photo 1" },
  //     ...
  //   ],
  // },
];

export default GALLERY_DATA;