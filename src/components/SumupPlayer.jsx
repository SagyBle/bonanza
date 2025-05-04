import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { db } from "../config/firebase";

const SumupPlayerModal = ({ player, groupId, tableId, onClose }) => {
  const [isConfirmed, setIsConfirmed] = useState(false); // Tracks if confirmation is done
  const [inputValue, setInputValue] = useState(""); // Tracks the input value
  const [isAdding, setIsAdding] = useState(true); // Tracks whether to add or subtract

  const handleConfirm = () => {
    setIsConfirmed(true); // Proceed to the input phase
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // Ensure only numbers are allowed
    setInputValue(value);
  };

  const handleSubmit = async () => {
    const numericValue = parseInt(inputValue || "0", 10);
    const signedValue = isAdding ? numericValue : -numericValue;

    // const playerDocRef = doc(db, `tables/${tableId}/players`, player.id);
    const playerDocRef = doc(
      db,
      `groups/${groupId}/tables/${tableId}/players`,
      player.id
    );

    await updateDoc(playerDocRef, {
      finalTotalChips: signedValue,
    });

    onClose(); // Close modal after submission
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-md w-full border-2 border-gray-300">
        {!isConfirmed ? (
          <>
            {/* Confirmation phase */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-medium text-black">סיכום שחקן</h3>
              <p className="text-lg">האם אתה בטוח שברצונך לסיים שחקן זה?</p>
            </div>
            <div className="text-center mt-6 flex justify-between px-8">
              <button
                className="bg-gray-400 text-white p-3 rounded-md shadow-md hover:bg-gray-500 transition"
                onClick={onClose}
              >
                ביטול
              </button>
              <button
                className="bg-blue-500 text-white p-3 rounded-md shadow-md hover:bg-blue-600 transition mr-4"
                onClick={handleConfirm}
              >
                כן, קפל את הכבש
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header Section */}
            <div className="text-center mb-6">
              <h3 className="text-3xl font-semibold text-gray-200">
                סיכום שחקן
              </h3>
              <p className="text-xl text-gray-400">
                🏦 בנק בוננזה פיננסים בע״מ
              </p>
            </div>

            {/* Player Details Section */}
            <div className="text-right text-lg mb-6 bg-gray-700 p-4 rounded-lg shadow-md">
              <p className="mb-2">
                <strong className="text-blue-300">שחקן: </strong>
                <span className="ml-2 text-white">{player.name}</span>
              </p>
              <p className="mb-2">
                <strong className="text-blue-300">סה״כ כניסות: </strong>
                <span className="ml-2 text-white">{player.entries}</span>
              </p>
            </div>

            {/* Input Section */}
            <div className="text-center mb-6">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={isAdding ? inputValue : inputValue && `-${inputValue}`}
                onChange={handleInputChange}
                className={`border border-gray-400 p-3 rounded-md w-40 text-center font-semibold text-black shadow-md focus:outline-none transition 
      ${
        isAdding
          ? "bg-green-100 focus:ring-2 focus:ring-green-400"
          : "bg-red-100 focus:ring-2 focus:ring-red-400"
      }`}
              />
            </div>

            {/* Action Buttons */}
            <div className="text-center mt-6 flex justify-center gap-4">
              <button
                className="bg-green-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-green-600 transition"
                onClick={handleSubmit}
              >
                אישור
              </button>
              <button
                className="bg-gray-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-gray-600 transition"
                onClick={onClose}
              >
                ביטול
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SumupPlayerModal;
