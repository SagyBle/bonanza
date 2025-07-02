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
    <div className="p-2 sm:p-4 max-w-2xl mx-auto w-full" dir="rtl">
      <div className="bg-white border border-gray-300 rounded-2xl shadow-md overflow-hidden">
        <div
          onClick={() => setOpen(!open)}
          className="flex justify-between items-center p-4 cursor-pointer bg-gray-100 rounded-t-2xl hover:bg-gray-200 select-none"
        >
          <h1 className="text-lg sm:text-xl font-semibold text-blue-800">
            הגדרות חבורה
          </h1>
          <span className="text-lg text-gray-600">{open ? "▲" : "▼"}</span>
        </div>

        {open && (
          <div className="p-3 sm:p-4 space-y-6">
            {/* יחס ז׳יטונים כסף */}
            <div
              className={`p-3 sm:p-4 rounded-xl border flex flex-col gap-3 sm:gap-0 ${
                forMoney && getChips
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h2 className="text-base sm:text-lg font-medium mb-2 text-gray-800">
                יחס ז׳יטונים כסף
              </h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-700 gap-3 sm:gap-0">
                <span className="flex flex-wrap items-center gap-2">
                  עבור
                  <input
                    type="number"
                    disabled={!editMoneyChips}
                    className={`border rounded p-1 w-20 text-base focus:ring-2 focus:ring-blue-200 transition ${
                      editMoneyChips
                        ? "border-gray-300 bg-white"
                        : "border-transparent bg-gray-100"
                    }`}
                    value={forMoney}
                    onChange={(e) => setForMoney(e.target.value)}
                  />
                  ש״ח מקבלים
                  <input
                    type="number"
                    disabled={!editMoneyChips}
                    className={`border rounded p-1 w-20 text-base focus:ring-2 focus:ring-blue-200 transition ${
                      editMoneyChips
                        ? "border-gray-300 bg-white"
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
                  className="mt-2 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-base font-semibold transition"
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
              className={`p-3 sm:p-4 rounded-xl border flex flex-col gap-3 sm:gap-0 ${
                originalIsLeftovers !== undefined
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h2 className="text-base sm:text-lg font-medium mb-2 text-gray-800">
                שאריות?
              </h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-700 gap-3 sm:gap-0">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!editLeftovers}
                      checked={isLeftovers}
                      onChange={() => setIsLeftovers(true)}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <span className="text-base">כן</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!editLeftovers}
                      checked={!isLeftovers}
                      onChange={() => setIsLeftovers(false)}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <span className="text-base">לא</span>
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
                  className="mt-2 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-base font-semibold transition"
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
