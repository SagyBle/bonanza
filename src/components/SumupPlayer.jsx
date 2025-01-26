import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { db } from "../config/firebase";

const SumupPlayerModal = ({ player, tableId, onClose }) => {
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

    const playerDocRef = doc(db, `tables/${tableId}/players`, player.id);

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
              <h3 className="text-2xl font-medium">סיכום שחקן</h3>
              <p className="text-lg">האם אתה בטוח שברצונך לסיים שחקן זה?</p>
            </div>
            <div className="text-center mt-6">
              <button
                className="bg-blue-500 text-white p-3 rounded-md shadow-md hover:bg-blue-600 transition mr-4"
                onClick={handleConfirm}
              >
                כן
              </button>
              <button
                className="bg-gray-400 text-white p-3 rounded-md shadow-md hover:bg-gray-500 transition"
                onClick={onClose}
              >
                ביטול
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Input phase */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-medium">סיכום שחקן</h3>
              <p className="text-lg">בנק בוננזה פיננסים בע״מ</p>
            </div>

            <div className="text-right text-lg mb-4">
              <p className="mb-2">
                <strong>שחקן: </strong>
                {player.name}
              </p>
              <p className="mb-2">
                <strong>סה״כ כניסות: </strong>
                {player.entries}
              </p>
            </div>

            <div className="text-center mb-6">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={isAdding ? inputValue : inputValue && `-${inputValue}`}
                onChange={handleInputChange}
                className={`border border-gray-300 p-2 rounded-md w-32 text-center text-white shadow-md ${
                  isAdding
                    ? "bg-green-100 text-green-800 focus:ring-2 focus:ring-green-400"
                    : "bg-red-100 text-red-800 focus:ring-2 focus:ring-red-400"
                } transition`}
              />
            </div>

            <div className="text-center mt-6">
              <button
                className="bg-blue-500 text-white p-3 rounded-md shadow-md hover:bg-blue-600 transition mr-4"
                onClick={handleSubmit}
              >
                Submit
              </button>
              <button
                className="bg-gray-400 text-white p-3 rounded-md shadow-md hover:bg-gray-500 transition"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SumupPlayerModal;
