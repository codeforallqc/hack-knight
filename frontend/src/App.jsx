import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CustomCursor from "./components/CustomCursor";
import Home from "./pages/Home";
import Schedule from "./pages/SchedulePage";
import Sponsors from "./pages/SponsorsPage";
import ComingSoon from "./components/ComingSoon";
import AdminLogin from "./pages/AdminLogin";
import AdminPage from "./pages/AdminPage";
import { isAuthenticated } from "./lib/api";

// Redirects to the login page when there is no valid admin token.
function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/admin/login" replace />;
}

function useScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Small timeout ensures DOM elements render before browser tries to seek them
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 10);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
}

// Wrapper to animate routes crossing in and out
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

function AppContent() {
  const location = useLocation();
  useScrollToHash();

  // Admin pages render standalone — no public Navbar/Footer.
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      <CustomCursor />
      {!isAdmin && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes key={location.pathname} location={location}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/schedule" element={<PageTransition><Schedule /></PageTransition>} />
          <Route path="/sponsors" element={<PageTransition><Sponsors /></PageTransition>} />
          <Route path="/register" element={<PageTransition><ComingSoon /></PageTransition>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminPage />
              </RequireAuth>
            }
          />
        </Routes>
      </AnimatePresence>
      {!isAdmin && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}