import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { db } from "../config/firebase";

const AddPlayerModal = ({ player, onClose, onConfirm }) => {
  const handleConfirm = () => {
    console.log("confirmed from pop up");
    if (onConfirm) onConfirm();
    onClose();
  };

  // const handleSubmit = async () => {
  //   console.log("submitted from pop up");

  //   onClose();
  // };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-md w-full border-2 border-gray-300">
        <div className="text-center mb-6">
          {/* <h3 className="text-2xl font-medium">סיכום שחקן</h3> */}
          <p className="text-lg" dir="rtl">
            האם ברצונך להוסיף את <strong> {player.name} </strong>לשולחן?
          </p>
        </div>
        <div className="text-center mt-6 flex justify-center gap-8">
          <button
            className="bg-gray-400 text-white p-3 rounded-md shadow-md hover:bg-gray-500 transition"
            onClick={onClose}
          >
            ביטול
          </button>
          <button
            className="bg-blue-500 text-white p-3 rounded-md shadow-md hover:bg-blue-600 transition"
            onClick={handleConfirm}
          >
            הוסף
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPlayerModal;
