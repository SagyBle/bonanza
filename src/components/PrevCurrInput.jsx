import React from "react";

const PrevCurrInput = ({ originalAmount, finalAmount }) => {
  return (
    <div
      className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm flex items-center 
      justify-start hover:border-blue-500 cursor-text"
    >
      {originalAmount !== finalAmount ? (
        <div className="flex items-center gap-1">
          {/* Original Amount (Crossed Out) */}
          <span className="text-red-500 line-through">{originalAmount}</span>

          {/* Final Amount (Bold) */}
          <span className="font-bold text-green-700">{finalAmount}</span>
        </div>
      ) : (
        <span className="font-bold text-green-700">{finalAmount}</span>
      )}
    </div>
  );
};

export default PrevCurrInput;
