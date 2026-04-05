import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Schedule from './pages/SchedulePage';
import Sponsors from './pages/SponsorsPage';
import ComingSoon from './components/ComingSoon';
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToHash() {
  const { pathname, hash } = useLocation(); // Pathname points to the /, hash points to the #, ex: /#schedule

  useEffect(() => {
    if (hash) { 
      const el = document.querySelector(hash); // ex: #gallery, looks for an id = "gallery"
      if (el) el.scrollIntoView({ behavior: "smooth" }); // makes sure element exists
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />   {/* ← add this */}
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/sponsors" element={<Sponsors />} />
        <Route path="/register" element={<ComingSoon />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  )
}
