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

  // Fetch players from Firestore
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
        console.error("Error fetching players:", error);
      }
    };

    fetchPlayers();
  }, [tableId]);

  // Update remaining amount whenever subOrders or totalAmount changes
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
      alert("Remaining amount must be 0 before finishing the order!");
      return;
    }

    try {
      const foodExpenseData = {
        title,
        totalPayer,
        totalAmount,
        orderDetails,
        subOrders,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "AddFoodExpenses"), foodExpenseData);
      alert("Order added successfully!");
    } catch (error) {
      console.error("Error adding food expense:", error);
    }
  };

  // Filter out players who have already added a suborder
  const availablePlayersForSubOrder = players.filter(
    (player) => !subOrders.some((order) => order.playerId === player.id)
  );

  // Handle suborder removal
  const handleRemoveSubOrder = (index) => {
    setSubOrders((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-3xl mx-auto bg-gray-800 text-white p-6 rounded-lg shadow-lg">
      {/* Order Metadata */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Order Meta Data</h1>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Order Title"
          className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700"
        />
        <select
          value={totalPayer}
          onChange={(e) => setTotalPayer(e.target.value)}
          className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700"
        >
          <option value="">Select Payer</option>
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
          placeholder="Total Amount"
          className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700"
        />
        <input
          type="text"
          value={orderDetails}
          onChange={(e) => setOrderDetails(e.target.value)}
          placeholder="Order Details"
          className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700"
        />
      </div>

      {/* Add Sub Order */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Add Sub Order</h1>
        <select
          value={subOrderPayer}
          onChange={(e) => setSubOrderPayer(e.target.value)}
          className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700"
        >
          <option value="">Select Player</option>
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
          placeholder="Amount"
          className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700"
        />
        <input
          type="text"
          value={subOrderDetails}
          onChange={(e) => setSubOrderDetails(e.target.value)}
          placeholder="Suborder Details"
          className="w-full p-2 mb-4 rounded-lg bg-gray-900 border border-gray-700"
        />
        <button
          onClick={handleAddSubOrder}
          className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg"
        >
          Add Sub Order
        </button>
      </div>

      {/* Players' Sub Orders */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Players' Sub Orders</h1>
        {subOrders.length > 0 ? (
          <ul className="list-disc ml-6">
            {subOrders.map((order, index) => (
              <li key={index}>
                Player:{" "}
                {players.find((p) => p.id === order.playerId)?.name ||
                  "Unknown"}{" "}
                - Amount: {order.amount} - Details: {order.details}
                <button
                  onClick={() => handleRemoveSubOrder(index)}
                  className="ml-4 text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No sub orders added yet.</p>
        )}
      </div>

      {/* Finish Order */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">
          Total Money Remaining: {remainingAmount}
        </h1>
        <button
          onClick={handleFinishOrder}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Finish Order
        </button>
      </div>
    </div>
  );
};
export default AddFoodExpenses;
