import React, { useState } from "react";
import payboxIcon from "../assets/icons/paybox.svg";

const Paybox = ({ amount, creditorName }) => {
  const [showPopup, setShowPopup] = useState(false);

  const handlePayboxClick = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handlePayboxClick}
        className="flex items-center justify-center bg-white border-2 border-blue-500 text-blue-500 p-2 rounded-lg shadow-md transition w-full max-w-xs mx-auto hover:opacity-60"
      >
        <span className="text-lg font-semibold mr-2">
          {amount} ל{creditorName} ב{" "}
        </span>
        <div outl>
          <img src={payboxIcon} alt="Paybox" className="w-20 h-20 mr-1" />
        </div>
      </button>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-4 text-center">
              פייבוקס אינו זמין
            </h2>
            <p className="text-gray-700 text-center">
              פייבוקס אינו זמין כרגע. ייתכן שתכונה זו תהיה זמינה בגרסאות הבאות.
            </p>
            <div className="flex justify-center mt-4">
              <button
                onClick={closePopup}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Paybox;
