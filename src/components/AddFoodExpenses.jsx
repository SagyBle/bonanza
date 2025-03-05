import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

const AddFoodExpenses = ({ tableId }) => {
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

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const playersRef = collection(db, `tables/${tableId}/players`);
        const playerDocs = await getDocs(playersRef);
        const playersList = playerDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlayers(playersList);
      } catch (error) {
        console.error("שגיאה בשליפת שחקנים:", error);
      }
    };

    fetchPlayers();
  }, [tableId]);

  useEffect(() => {
    const fetchFoodExpenses = async () => {
      try {
        const expensesRef = collection(db, "AddFoodExpenses");
        const expenseDocs = await getDocs(expensesRef);
        const expensesList = expenseDocs.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((expense) => expense.tableId === tableId); // Filter by tableId

        setFoodExpenses(expensesList);
      } catch (error) {
        console.error("שגיאה בשליפת הזמנות אוכל:", error);
      }
    };

    fetchFoodExpenses();
  }, [tableId]);

  useEffect(() => {
    const totalSubOrderAmount = subOrders.reduce(
      (sum, order) => sum + order.amount,
      0
    );
    setRemainingAmount(totalAmount - totalSubOrderAmount);
  }, [subOrders, totalAmount]);

  const handleAddSubOrder = () => {
    if (!subOrderPayer || !amount || amount <= 0) return;

    const newSubOrder = {
      playerId: subOrderPayer,
      amount: parseFloat(amount),
      details: subOrderDetails,
    };

    setSubOrders((prev) => [...prev, newSubOrder]);
    setSubOrderPayer("");
    setAmount("");
    setSubOrderDetails("");
  };

  const handleFinishOrder = async () => {
    if (remainingAmount !== 0) {
      alert("יש לוודא שסכום השארית שווה לאפס לפני סגירת ההזמנה!");
      return;
    }

    try {
      const foodExpenseData = {
        title,
        totalPayer,
        totalAmount,
        orderDetails,
        subOrders,
        tableId,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(
        collection(db, "AddFoodExpenses"),
        foodExpenseData
      );

      // Update local state with the new order
      setFoodExpenses((prev) => [
        ...prev,
        { id: docRef.id, ...foodExpenseData },
      ]);

      alert("ההזמנה נוספה בהצלחה!");
    } catch (error) {
      console.error("שגיאה בהוספת הוצאה:", error);
    }
  };

  const availablePlayersForSubOrder = players.filter(
    (player) => !subOrders.some((order) => order.playerId === player.id)
  );

  const handleRemoveSubOrder = (index) => {
    setSubOrders((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <button
        onClick={() => setIsFormVisible((prev) => !prev)}
        className={`w-full py-3 text-white rounded-lg transition ${
          isFormVisible
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isFormVisible ? "סגור הזמנת אוכל" : "הוספת הזמנת אוכל"}
      </button>
      {foodExpenses.length > 0 && (
        <div
          className="mb-6 p-4 bg-gray-800 text-white rounded-lg shadow-lg"
          dir="rtl"
        >
          <h2 className="text-xl font-bold mb-3 text-blue-300">
            הזמנות אוכל קודמות
          </h2>
          <ul className="space-y-3">
            {foodExpenses.map((expense) => (
              <li
                key={expense.id}
                className="p-3 bg-gray-900 rounded-md shadow-md"
              >
                <p className="text-lg font-semibold text-blue-400">
                  {expense.title}
                </p>
                <p className="text-sm text-gray-300">
                  משלם:{" "}
                  {players.find((p) => p.id === expense.totalPayer)?.name ||
                    "לא ידוע"}{" "}
                  | סכום: ₪{expense.totalAmount}
                </p>
                <p className="text-xs text-gray-400">
                  נוצר בתאריך:{" "}
                  {new Date(expense.createdAt).toLocaleDateString("he-IL")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isFormVisible && (
        <div
          className="max-w-3xl mx-auto bg-gray-800 text-white p-6 rounded-lg shadow-lg"
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
          {remainingAmount !== 0 && (
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
            </div>
          )}

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
                        {order.details || "ללא פרטים"}
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
            <h1 className="text-2xl font-bold mb-4">
              יתרה נותרה: {remainingAmount}
            </h1>
            <div className="relative group">
              <button
                onClick={handleFinishOrder}
                disabled={remainingAmount !== 0}
                className={`w-full py-2 rounded-lg transition ${
                  remainingAmount === 0
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                }`}
              >
                סיים הזמנה
              </button>
              {remainingAmount !== 0 && (
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max text-xs text-white bg-gray-700 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  היתרה חייבת להיות 0 על מנת לסיים את ההזמנה
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddFoodExpenses;
