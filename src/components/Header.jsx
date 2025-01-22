import React from "react";
import { useNavigate } from "react-router-dom";

const Header = ({ isManagerMode, setIsManagerMode }) => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate("/");
  };

  const toggleManagerMode = () => {
    setIsManagerMode((prev) => !prev);
  };

  return (
    <>
      <header className="bg-gray-800 text-white flex justify-between items-center p-4 shadow-md flex-row-reverse">
        <h1 className="text-2xl font-semibold">בנק בוננזה</h1>

        <div className="flex items-center space-x-4">
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
            onClick={handleHomeClick}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            דף הבית
          </button>
        </div>
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
