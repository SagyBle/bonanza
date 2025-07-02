import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import soundOnIcon from "../assets/icons/sound-on.svg";
import soundMuteIcon from "../assets/icons/sound-mute.svg";
import bonanzaMascot from "../assets/icons/bonanza-mascot.png";
import kisses from "../assets/sounds/kisses.mp3";

const Header = ({
  isManagerMode,
  setIsManagerMode,
  soundEnabled,
  setSoundEnabled,
}) => {
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef(null);
  const kissesSound = new Audio(kisses);

  // Trap focus inside menu when open
  useEffect(() => {
    if (!showMobileMenu) return;
    const focusableEls = menuRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusableEls?.[0];
    const lastEl = focusableEls?.[focusableEls.length - 1];
    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setShowMobileMenu(false);
    };
    document.addEventListener("keydown", handleTab);
    document.addEventListener("keydown", handleEsc);
    firstEl?.focus();
    return () => {
      document.removeEventListener("keydown", handleTab);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showMobileMenu]);

  const handleHomeClick = () => {
    navigate("/groups");
    setShowMobileMenu(false);
  };

  const handleUnionsClick = () => {
    navigate("/unions");
    setShowMobileMenu(false);
  };

  const toggleManagerMode = () => {
    if (!isManagerMode && soundEnabled) {
      kissesSound.play();
    }
    setIsManagerMode((prev) => !prev);
    setShowMobileMenu(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src={bonanzaMascot}
              alt="BonanzApp Mascot"
              className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400 bg-white shadow"
            />
            <span className="font-bold text-xl tracking-wide ml-2">
              BONANZAPP
            </span>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={handleHomeClick}
              className="bg-blue-500 text-white px-5 py-2 rounded-lg text-base font-semibold hover:bg-blue-600 transition-colors"
            >
              דף הבית
            </button>
            <button
              onClick={handleUnionsClick}
              className="bg-blue-500 text-white px-5 py-2 rounded-lg text-base font-semibold hover:bg-blue-600 transition-colors"
            >
              איחודים
            </button>
            <button
              onClick={toggleManagerMode}
              className={`px-5 py-2 rounded-lg text-base font-semibold transition-colors ${
                isManagerMode
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-500 hover:bg-gray-600 text-white"
              }`}
            >
              {isManagerMode ? "כבה מצב מנהל" : "הפעל מצב מנהל"}
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full hover:bg-gray-200 transition"
            >
              <img
                src={soundEnabled ? soundOnIcon : soundMuteIcon}
                alt="Sound Toggle"
                className="h-7 w-7"
              />
            </button>
            {/* Avatar always visible on desktop */}
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="User Avatar"
              className="w-10 h-10 rounded-full border-2 border-gray-300 object-cover ml-2"
            />
          </div>
          {/* Hamburger for Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button
              aria-label={showMobileMenu ? "סגור תפריט" : "פתח תפריט"}
              onClick={() => setShowMobileMenu((prev) => !prev)}
              className="p-2 focus:outline-none relative z-50"
            >
              <span className="block w-7 h-7 relative">
                <span
                  className={`absolute left-0 top-1/2 w-7 h-0.5 bg-black rounded transition-all duration-300 ${
                    showMobileMenu ? "rotate-45 top-3.5" : "-translate-y-2"
                  }`}
                ></span>
                <span
                  className={`absolute left-0 top-1/2 w-7 h-0.5 bg-black rounded transition-all duration-300 ${
                    showMobileMenu ? "opacity-0" : ""
                  }`}
                ></span>
                <span
                  className={`absolute left-0 top-1/2 w-7 h-0.5 bg-black rounded transition-all duration-300 ${
                    showMobileMenu ? "-rotate-45 -top-3.5" : "translate-y-2"
                  }`}
                ></span>
              </span>
            </button>
            {/* Avatar always visible on mobile, outside drawer */}
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="User Avatar"
              className="w-9 h-9 rounded-full border-2 border-gray-300 object-cover"
            />
          </div>
        </div>
        {/* Mobile Drawer Menu & Overlay */}
        {showMobileMenu && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-40 z-40"
              onClick={() => setShowMobileMenu(false)}
              aria-hidden="true"
            />
            {/* Drawer */}
            <nav
              ref={menuRef}
              className="fixed top-0 right-0 h-full w-full max-w-xs bg-white shadow-lg z-50 flex flex-col gap-6 p-8 animate-slide-in sm:w-4/5"
              tabIndex={-1}
              aria-label="תפריט ניווט ראשי"
            >
              {/* Close (X) Button */}
              <button
                onClick={() => setShowMobileMenu(false)}
                aria-label="סגור תפריט"
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 z-50"
              >
                <svg
                  className="w-7 h-7 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="mt-8" />
              <button
                onClick={handleHomeClick}
                className="bg-blue-500 text-white px-5 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                דף הבית
              </button>
              <button
                onClick={handleUnionsClick}
                className="bg-blue-500 text-white px-5 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                איחודים
              </button>
              <button
                onClick={toggleManagerMode}
                className={`px-5 py-3 rounded-lg text-lg font-semibold transition-colors ${
                  isManagerMode
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-500 hover:bg-gray-600 text-white"
                }`}
              >
                {isManagerMode ? "כבה מצב מנהל" : "הפעל מצב מנהל"}
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-full hover:bg-gray-200 transition self-start"
              >
                <img
                  src={soundEnabled ? soundOnIcon : soundMuteIcon}
                  alt="Sound Toggle"
                  className="h-7 w-7"
                />
              </button>
            </nav>
            <style>{`
              @keyframes slide-in {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              .animate-slide-in {
                animation: slide-in 0.3s cubic-bezier(0.4,0,0.2,1) both;
              }
              @media (max-width: 400px) {
                nav[aria-label="תפריט ניווט ראשי"] {
                  max-width: 100vw !important;
                  width: 100vw !important;
                  padding-left: 1rem !important;
                  padding-right: 1rem !important;
                }
              }
            `}</style>
          </>
        )}
      </header>
      {/* Manager Mode Stripe */}
      {isManagerMode && (
        <div className="bg-green-500 text-white text-center py-2 text-base font-semibold shadow">
          אתה במצב מנהל כעת
        </div>
      )}
    </>
  );
};

export default Header;
