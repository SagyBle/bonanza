import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

const AddFoodExpenses = ({ groupId, tableId, isManagerMode }) => {
  const [players, setPlayers] = useState([]);
  const [title, setTitle] = useState("");
  const [totalPayer, setTotalPayer] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [orderDetails, setOrderDetails] = useState("");
  const [subOrders, setSubOrders] = useState([]);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [amount, setAmount] = useState("");
  const [subOrderDetails, setSubOrderDetails] = useState("");
  const [subOrderPayer, setSubOrderPayer] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [foodExpenses, setFoodExpenses] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [splitters, setSplitters] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null); // Track selected expense
  const [isEditMode, setIsEditMode] = useState(false); // Track if editing
  const [isFinishingOrder, setIsFinishingOrder] = useState(false);
  const [finishOrderError, setFinishOrderError] = useState("");

  useEffect(() => {
    if (!groupId || !tableId) return;

    const playersRef = collection(
      db,
      `groups/${groupId}/tables/${tableId}/players`
    );

    // Set up real-time subscription to players
    const unsubscribe = onSnapshot(
      playersRef,
      (snapshot) => {
        const playersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlayers(playersList);
      },
      (error) => {
        console.error("שגיאה בשליפת שחקנים:", error);
      }
    );

    // Cleanup subscription on unmount or when dependencies change
    return () => unsubscribe();
  }, [groupId, tableId]);

  useEffect(() => {
    if (!groupId || !tableId) return;

    const expensesRef = collection(
      db,
      `groups/${groupId}/tables/${tableId}/foodExpenses`
    );

    // Set up real-time subscription to food expenses
    const unsubscribe = onSnapshot(
      expensesRef,
      (snapshot) => {
        const expensesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFoodExpenses(expensesList);
      },
      (error) => {
        console.error("שגיאה בשליפת הזמנות אוכל:", error);
      }
    );

    // Cleanup subscription on unmount or when dependencies change
    return () => unsubscribe();
  }, [groupId, tableId]);

  useEffect(() => {
    const totalSubOrderAmount = subOrders.reduce(
      (sum, order) => sum + order.amount,
      0
    );
    let newRemainingAmount = totalAmount - totalSubOrderAmount;

    // Round to zero if the remaining amount is less than 1
    if (Math.abs(newRemainingAmount) < 1) {
      newRemainingAmount = 0;
    }

    setRemainingAmount(newRemainingAmount);
  }, [subOrders, totalAmount]);

  // Recalculate split amounts when splitters change
  useEffect(() => {
    if (splitters.length === 0) return;

    setSubOrders((prevSubOrders) => {
      // Calculate the sum of amounts of non-splitters
      const nonSplittersTotal = prevSubOrders
        .filter((order) => !order.split)
        .reduce((sum, order) => sum + order.amount, 0);

      const remainingSplitAmount = totalAmount - nonSplittersTotal;
      const newSplitterAmount =
        splitters.length > 0
          ? Math.round((remainingSplitAmount / splitters.length) * 100) / 100
          : 0;

      // Update only the split orders with new amounts
      return prevSubOrders.map((subOrder) =>
        subOrder.split
          ? {
              ...subOrder,
              amount: newSplitterAmount,
            }
          : subOrder
      );
    });
  }, [splitters, totalAmount]);

  const handleAddSubOrder = () => {
    if (!subOrderPayer || !amount || amount <= 0) return;

    const newSubOrder = {
      playerId: subOrderPayer,
      amount: parseFloat(amount),
      details: subOrderDetails,
    };

    setSubOrders((prevSubOrders) => {
      const newSubOrders = [...prevSubOrders, newSubOrder]; // Add the new order

      setSplitters((prevSplitters) => {
        // Keep existing splitters and check if we need to update them
        const updatedSplitters = prevSplitters.filter(
          (splitter) => splitter.playerId !== subOrderPayer
        );

        console.log("Updated Splitters after addition:", { updatedSplitters });

        // Calculate the sum of amounts of non-splitters
        const nonSplittersTotal = newSubOrders
          .filter((order) => !order.split)
          .reduce((sum, order) => sum + order.amount, 0);

        console.log({ totalAmount, updatedSplitters });

        // Compute the new amount for splitters after reducing the new suborder's amount
        const remainingSplitAmount = totalAmount - nonSplittersTotal;
        const newSplitterAmount =
          updatedSplitters.length > 0
            ? remainingSplitAmount / updatedSplitters.length
            : 0;

        console.log(
          "Assigning new split amounts after addition:",
          newSplitterAmount
        );

        // Update subOrders immutably to reflect new split amounts
        const updatedSubOrders = newSubOrders.map((subOrder) =>
          subOrder.split ? { ...subOrder, amount: newSplitterAmount } : subOrder
        );

        setSubOrders(updatedSubOrders); // Ensure subOrders are updated immutably

        return updatedSplitters;
      });

      return newSubOrders;
    });

    setSubOrderPayer("");
    setAmount("");
    setSubOrderDetails("");
  };

  const handleSplitEqually = () => {
    if (remainingAmount <= 0 || availablePlayersForSubOrder.length === 0)
      return;

    const splitAmount = remainingAmount / availablePlayersForSubOrder.length;

    const newSubOrders = availablePlayersForSubOrder.map((player) => ({
      playerId: player.id,
      amount: parseFloat(splitAmount.toFixed(2)), // Ensure two decimal precision
      details: "חלק שווה",
      split: true,
    }));
    setSplitters(newSubOrders);

    setSubOrders((prev) => [...prev, ...newSubOrders]);
  };

  const clearForm = () => {
    setTitle("");
    setTotalPayer("");
    setTotalAmount(0);
    setOrderDetails("");
    setSubOrders([]);
    setSplitters([]);
    setRemainingAmount(0);
    setAmount("");
    setSubOrderDetails("");
    setSubOrderPayer("");
    setIsFormVisible(false);
  };

  const handleFinishOrder = async () => {
    // Clear any previous errors
    setFinishOrderError("");

    // Set loading state
    setIsFinishingOrder(true);

    try {
      // נחשב את סכום תתי ההזמנות
      const totalSubOrderAmount = subOrders.reduce(
        (sum, order) => sum + order.amount,
        0
      );

      console.log("sagy1", totalSubOrderAmount);

      let remainder = totalAmount - totalSubOrderAmount;

      console.log("sagy2", remainder);

      // נעגל לשתי ספרות עשרוניות
      remainder = Math.round(remainder * 100) / 100;

      console.log("sagy3", remainder);

      // אם יש splitter והשארית קטנה מ-1, נעדכן את האחרון
      if (splitters.length > 0 && Math.abs(remainder) < 1) {
        console.log("sagy4", "here");

        const updatedSubOrders = [...subOrders];
        const lastSplitterIndex = updatedSubOrders
          .map((s, i) => (s.split ? i : -1))
          .filter((i) => i !== -1)
          .pop();

        if (lastSplitterIndex !== undefined) {
          updatedSubOrders[lastSplitterIndex].amount = parseFloat(
            (updatedSubOrders[lastSplitterIndex].amount + remainder).toFixed(2)
          );
          setSubOrders(updatedSubOrders);
          remainder = 0; // נחשב כאילו תיקנו את השארית
        }
      }

      // נוודא שהיתרה באמת אפס עכשיו
      const finalTotal = subOrders.reduce((sum, o) => sum + o.amount, 0);
      const finalRemainder = Math.round((totalAmount - finalTotal) * 100) / 100;

      if (Math.abs(finalRemainder) >= 1) {
        setFinishOrderError(
          "יש לוודא שסכום השארית שווה לאפס או שארית קטנה תתוקן אוטומטית."
        );
        return;
      }

      const foodExpenseData = {
        title,
        totalPayer,
        totalAmount,
        orderDetails,
        subOrders,
        createdAt: new Date().toISOString(),
      };

      await addDoc(
        collection(db, `groups/${groupId}/tables/${tableId}/foodExpenses`),
        foodExpenseData
      );

      clearForm();
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
    } catch (error) {
      console.error("שגיאה בהוספת הוצאה:", error);
      setFinishOrderError("אירעה שגיאה בעת הוספת ההזמנה. אנא נסה שוב.");
    } finally {
      setIsFinishingOrder(false);
    }
  };

  const availablePlayersForSubOrder = players.filter(
    (player) => !subOrders.some((order) => order.playerId === player.id)
  );

  const handleDeleteFoodExpense = async (expenseId) => {
    const confirmDelete = window.confirm(
      "האם אתה בטוח שברצונך למחוק את ההזמנה?"
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(
        doc(db, `groups/${groupId}/tables/${tableId}/foodExpenses`, expenseId)
      );
      console.log("ההזמנה נמחקה בהצלחה");
    } catch (err) {
      console.error("שגיאה במחיקת ההזמנה:", err);
      alert("אירעה שגיאה בעת המחיקה");
    }
  };

  const handleRemoveSubOrder = (index) => {
    setSubOrders((prevSubOrders) => {
      const removedOrder = prevSubOrders[index]; // Get the removed player's order
      const newSubOrders = prevSubOrders.filter((_, i) => i !== index); // Remove the order

      // Update splitters state
      setSplitters((prevSplitters) => {
        const updatedSplitters = prevSplitters.filter(
          (splitter) => splitter.playerId !== removedOrder.playerId
        );
        return updatedSplitters;
      });

      return newSubOrders;
    });
  };

  return (
    <div>
      {showSuccessPopup && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>הזמנת האוכל נוספה בהצלחה!</span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={() => setIsFormVisible((prev) => !prev)}
          className={`w-full py-2 px-4 text-white rounded-md transition text-base font-medium shadow-md flex items-center justify-center gap-2 ${
            isFormVisible
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isFormVisible ? (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              סגור הזמנת אוכל
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              הוספת הזמנת אוכל
            </>
          )}
        </button>
      </div>

      {isFormVisible && (
        <div
          className="mt-4 bg-gray-800 text-white p-6 rounded-lg shadow-lg"
          dir="rtl"
        >
          {/* Order Metadata - Locked when sub-orders exist */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4">פרטי הזמנה</h1>
            <div
              className={`p-4 rounded-lg ${
                subOrders.length > 0
                  ? "bg-gray-700 border-2 border-gray-500 opacity-70"
                  : ""
              }`}
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="כותרת ההזמנה"
                className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700 text-right"
                disabled={subOrders.length > 0}
              />
              <select
                value={totalPayer}
                onChange={(e) => setTotalPayer(e.target.value)}
                className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700 text-right"
                disabled={subOrders.length > 0}
              >
                <option value="">בחר משלם</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value))}
                placeholder="סכום כולל"
                className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700 text-right"
                disabled={subOrders.length > 0}
              />
              <input
                type="text"
                value={orderDetails}
                onChange={(e) => setOrderDetails(e.target.value)}
                placeholder="פרטי ההזמנה"
                className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700 text-right"
                disabled={subOrders.length > 0}
              />
            </div>
          </div>

          {/* Add Sub Order */}
          {
            <div className="mb-6 transition-opacity duration-300 ease-in-out">
              <h1 className="text-2xl font-bold mb-4">הוספת תת-הזמנה</h1>
              <select
                value={subOrderPayer}
                onChange={(e) => setSubOrderPayer(e.target.value)}
                className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700 text-right"
              >
                <option value="">בחר שחקן</option>
                {availablePlayersForSubOrder.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="סכום"
                className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700 text-right"
              />
              <input
                type="text"
                value={subOrderDetails}
                onChange={(e) => setSubOrderDetails(e.target.value)}
                placeholder="פרטי תת-הזמנה"
                className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700 text-right"
              />

              <button
                onClick={handleAddSubOrder}
                className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg"
              >
                הוסף תת-הזמנה
              </button>

              <button
                onClick={handleSplitEqually}
                className="w-full py-2 bg-sky-500 hover:bg-sky-600 rounded-lg mt-8"
              >
                חלק שווה בשווה
                {subOrders && subOrders.length > 0 ? " בין היתר" : " בין כולם"}
              </button>
            </div>
          }

          {/* Players' Sub Orders */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4 text-blue-400">
              תתי-הזמנות של השחקנים
            </h1>
            {subOrders.length > 0 ? (
              <div className="space-y-4">
                {subOrders.map((order, index) => (
                  <div
                    key={index}
                    className="bg-gray-900 p-4 rounded-xl shadow-md flex justify-between items-center"
                  >
                    <div className="flex flex-col text-white">
                      <span className="font-semibold text-lg text-blue-300">
                        {players.find((p) => p.id === order.playerId)?.name ||
                          "לא ידוע"}
                      </span>
                      <span className="text-gray-300 text-sm">
                        {order.details || ""}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-green-400 font-semibold bg-gray-800 py-1 px-3 rounded-lg">
                        ₪{order.amount}
                      </span>
                      <button
                        onClick={() => handleRemoveSubOrder(index)}
                        className="text-red-400 bg-gray-800 px-3 py-1 rounded-lg hover:bg-red-600 hover:text-white transition"
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center">
                לא נוספו תתי-הזמנות עדיין.
              </p>
            )}
          </div>

          {/* Finish Order */}
          <div className="mb-6">
            {remainingAmount !== 0 && (
              <h1 className="text-2xl font-bold mb-4">
                יתרה נותרה: {remainingAmount}
              </h1>
            )}

            {/* Error Message */}
            {finishOrderError && (
              <div className="mb-4 p-3 bg-red-600 text-white rounded-lg flex items-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{finishOrderError}</span>
              </div>
            )}

            <div className="relative group">
              <button
                onClick={handleFinishOrder}
                disabled={remainingAmount !== 0 || isFinishingOrder}
                className={`w-full py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                  remainingAmount === 0 && !isFinishingOrder
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                }`}
              >
                {isFinishingOrder ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    מוסיף הזמנה...
                  </>
                ) : (
                  "סיים הזמנה"
                )}
              </button>
              {remainingAmount !== 0 && !isFinishingOrder && (
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max text-xs text-white bg-gray-700 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  היתרה חייבת להיות 0 על מנת לסיים את ההזמנה
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddFoodExpenses;
