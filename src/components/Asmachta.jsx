import React from "react";

const Asmachta = ({ playerName, entryNumber, elapsedTime, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-md w-full border-2 border-gray-300">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-serif font-bold mb-1">
            אסמכתא - אישור תשלום
          </h3>
          <p className="text-lg font-serif italic">בנק בוננזה פיננסים בע״מ</p>
        </div>
        <div className="text-right text-lg mb-4">
          <p className="mb-2">
            {/*  {playerName} */}
            <strong>שחקן: </strong>
            {playerName}
          </p>
          <p className="mb-2">
            <strong>כניסות: </strong>
            {entryNumber}
          </p>
          <p className="mb-2">
            <strong>עודכן לפני: </strong>
            {elapsedTime}
            שניות
          </p>
        </div>
        <div className="text-center mt-6">
          <button
            className="bg-blue-500 text-white p-3 rounded-md font-semibold shadow-md hover:bg-blue-600 transition"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Asmachta;
