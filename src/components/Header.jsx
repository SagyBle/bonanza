import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import kisses from "../assets/sounds/kisses.mp3";
import soundOnIcon from "../assets/icons/sound-on.svg";
import soundMuteIcon from "../assets/icons/sound-mute.svg";

const Header = ({
  isManagerMode,
  setIsManagerMode,
  soundEnabled,
  setSoundEnabled,
}) => {
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleHomeClick = () => {
    navigate("/groups");
    setShowMobileMenu(false);
  };

  const handleUnionsClick = () => {
    navigate("/unions");
    setShowMobileMenu(false);
  };

  const kissesSound = new Audio(kisses);

  const toggleManagerMode = () => {
    if (!isManagerMode && soundEnabled) {
      kissesSound.play();
    }
    setIsManagerMode((prev) => !prev);
    setShowMobileMenu(false);
  };

  return (
    <>
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <h1
            onClick={handleHomeClick}
            className="text-2xl font-semibold transition transform hover:text-blue-400 hover:scale-105 hover:cursor-pointer"
          >
            BonanzApp
          </h1>
          {/* Hamburger for Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu((prev) => !prev)}
              className="p-2 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleHomeClick}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              דף הבית
            </button>
            <button
              onClick={handleUnionsClick}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              איחודים
            </button>
            <button
              onClick={toggleManagerMode}
              className={`px-4 py-2 rounded transition-colors ${
                isManagerMode
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-500 hover:bg-gray-600"
              }`}
            >
              {isManagerMode ? "כבה מצב מנהל" : "הפעל מצב מנהל"}
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full hover:bg-gray-700 transition"
            >
              <img
                src={soundEnabled ? soundOnIcon : soundMuteIcon}
                alt="Sound Toggle"
                className="h-6 w-6"
              />
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="mt-4 md:hidden flex flex-col space-y-2">
            <button
              onClick={handleHomeClick}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              דף הבית
            </button>
            <button
              onClick={handleUnionsClick}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              איחודים
            </button>
            <button
              onClick={toggleManagerMode}
              className={`px-4 py-2 rounded transition-colors ${
                isManagerMode
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-500 hover:bg-gray-600"
              }`}
            >
              {isManagerMode ? "כבה מצב מנהל" : "הפעל מצב מנהל"}
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full hover:bg-gray-700 transition"
            >
              <img
                src={soundEnabled ? soundOnIcon : soundMuteIcon}
                alt="Sound Toggle"
                className="h-6 w-6"
              />
            </button>
          </div>
        )}
      </header>
      {/* Manager Mode Stripe */}
      {isManagerMode && (
        <div className="bg-green-500 text-white text-center py-2">
          אתה במצב מנהל כעת
        </div>
      )}
    </>
  );
};

export default Header;
