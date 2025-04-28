import React from "react";
import { useNavigate } from "react-router-dom";

const CloseTableModal = ({ isOpen, onClose, groupId, tableId }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleConfirm = () => {
    navigate(`/group/${groupId}/sumup/${tableId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-lg w-96 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4" dir="rtl">
          זהו? סיימנו?
        </h2>
        <p className="text-gray-600">האם אתה בטוח שאנחנו סוגרים את השולחן?</p>
        <p className="text-gray-600 mb-6">אישור יעביר אותך לעמוד השאריות</p>
        <div className="flex justify-between space-x-4 mr-4 ml-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            כן, בטוח
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloseTableModal;
