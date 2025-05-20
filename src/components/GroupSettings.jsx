import React, { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

const GroupSettings = ({ groupId }) => {
  const [forMoney, setForMoney] = useState("");
  const [getChips, setGetChips] = useState("");
  const [isLeftovers, setIsLeftovers] = useState(false);

  const [originalForMoney, setOriginalForMoney] = useState("");
  const [originalGetChips, setOriginalGetChips] = useState("");
  const [originalIsLeftovers, setOriginalIsLeftovers] = useState(false);

  const [editMoneyChips, setEditMoneyChips] = useState(false);
  const [editLeftovers, setEditLeftovers] = useState(false);

  const [loadingMoneyChips, setLoadingMoneyChips] = useState(false);
  const [loadingLeftovers, setLoadingLeftovers] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    const groupRef = doc(db, "groups", groupId);
    const unsubscribe = onSnapshot(groupRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        const hasMoneyData =
          data.forMoney !== undefined && data.getChips !== undefined;
        const hasLeftoversData = data.isLeftovers !== undefined;

        setForMoney(data.forMoney ?? "");
        setGetChips(data.getChips ?? "");
        setIsLeftovers(data.isLeftovers ?? false);

        setOriginalForMoney(data.forMoney ?? "");
        setOriginalGetChips(data.getChips ?? "");
        setOriginalIsLeftovers(data.isLeftovers ?? false);

        // פתיחת עריכה אוטומטית אם אין ערך קיים
        setEditMoneyChips(!hasMoneyData);
        setEditLeftovers(!hasLeftoversData);
      } else {
        // אם המסמך לא קיים כלל - מצב ראשוני לגמרי
        setEditMoneyChips(true);
        setEditLeftovers(true);
      }
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleCancelMoneyChips = () => {
    setForMoney(originalForMoney);
    setGetChips(originalGetChips);
    setEditMoneyChips(false);
  };

  const handleCancelLeftovers = () => {
    setIsLeftovers(originalIsLeftovers);
    setEditLeftovers(false);
  };

  const handleSaveMoneyChips = async () => {
    const relation = Number(getChips) / Number(forMoney);
    const groupRef = doc(db, "groups", groupId);
    setLoadingMoneyChips(true);

    try {
      await updateDoc(groupRef, {
        forMoney: Number(forMoney),
        getChips: Number(getChips),
        moneyChipsRelation: relation,
      });
      setEditMoneyChips(false);
    } catch (err) {
      console.error("Failed to update money-chips settings:", err);
    } finally {
      setLoadingMoneyChips(false);
    }
  };

  const handleSaveLeftovers = async () => {
    const groupRef = doc(db, "groups", groupId);
    setLoadingLeftovers(true);

    try {
      await updateDoc(groupRef, {
        isLeftovers,
      });
      setEditLeftovers(false);
    } catch (err) {
      console.error("Failed to update leftovers setting:", err);
    } finally {
      setLoadingLeftovers(false);
    }
  };

  const moneyChipsChanged =
    forMoney !== originalForMoney || getChips !== originalGetChips;

  const leftoversChanged = isLeftovers !== originalIsLeftovers;

  return (
    <div className="p-4" dir="rtl">
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
        <div
          onClick={() => setOpen(!open)}
          className="flex justify-between items-center p-4 cursor-pointer bg-gray-100 rounded-t-lg hover:bg-gray-200"
        >
          <h1 className="text-xl font-semibold text-blue-800">הגדרות חבורה</h1>
          <span className="text-lg text-gray-600">{open ? "▲" : "▼"}</span>
        </div>

        {open && (
          <div className="p-4 space-y-6">
            {/* יחס ז׳יטונים כסף */}
            <div
              className={`p-4 rounded-lg border ${
                forMoney && getChips
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h2 className="text-lg font-medium mb-2 text-gray-800">
                יחס ז׳יטונים כסף
              </h2>
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span className="flex items-center gap-2">
                  עבור
                  <input
                    type="number"
                    disabled={!editMoneyChips}
                    className={`border rounded p-1 w-20 ${
                      editMoneyChips
                        ? "border-gray-300"
                        : "border-transparent bg-gray-100"
                    }`}
                    value={forMoney}
                    onChange={(e) => setForMoney(e.target.value)}
                  />
                  ש״ח מקבלים
                  <input
                    type="number"
                    disabled={!editMoneyChips}
                    className={`border rounded p-1 w-20 ${
                      editMoneyChips
                        ? "border-gray-300"
                        : "border-transparent bg-gray-100"
                    }`}
                    value={getChips}
                    onChange={(e) => setGetChips(e.target.value)}
                  />
                  ז׳יטונים.
                </span>
                <button
                  onClick={
                    editMoneyChips
                      ? moneyChipsChanged
                        ? handleSaveMoneyChips
                        : handleCancelMoneyChips
                      : () => setEditMoneyChips(true)
                  }
                  disabled={loadingMoneyChips}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingMoneyChips
                    ? "שומר..."
                    : editMoneyChips
                    ? moneyChipsChanged
                      ? "שמור"
                      : "סגור"
                    : "ערוך"}
                </button>
              </div>
            </div>

            {/* שאריות */}
            <div
              className={`p-4 rounded-lg border ${
                originalIsLeftovers !== undefined
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h2 className="text-lg font-medium mb-2 text-gray-800">
                שאריות?
              </h2>
              <div className="flex items-center justify-between text-sm text-gray-700">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      disabled={!editLeftovers}
                      checked={isLeftovers}
                      onChange={() => setIsLeftovers(true)}
                    />
                    כן
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      disabled={!editLeftovers}
                      checked={!isLeftovers}
                      onChange={() => setIsLeftovers(false)}
                    />
                    לא
                  </label>
                </div>
                <button
                  onClick={
                    editLeftovers
                      ? leftoversChanged
                        ? handleSaveLeftovers
                        : handleCancelLeftovers
                      : () => setEditLeftovers(true)
                  }
                  disabled={loadingLeftovers}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingLeftovers
                    ? "שומר..."
                    : editLeftovers
                    ? leftoversChanged
                      ? "שמור"
                      : "סגור"
                    : "ערוך"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSettings;
