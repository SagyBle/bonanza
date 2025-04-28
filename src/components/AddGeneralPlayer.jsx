import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const AddGeneralPlayer = () => {
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const generalPlayersCollection = collection(
        db,
        `groups/${groupId}/generalPlayers`
      );
      await addDoc(generalPlayersCollection, {
        name: playerName,
        phoneNumber: playerPhone,
        createdAt: new Date().toISOString(),
      });

      alert("Player added successfully!");
      setPlayerName("");
      setPlayerPhone("");
    } catch (error) {
      console.error("Error adding player:", error);
      alert("Failed to add the player. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-gradient-to-r from-black via-gray-800 to-black text-white p-8 rounded-xl shadow-xl mt-8 w-full">
      <h2 className="text-4xl font-bold text-center mb-6 text-yellow-400 drop-shadow-md">
        הוסף שחקן כללי
      </h2>
      <form onSubmit={handleAddPlayer} className="flex flex-col">
        <label
          htmlFor="playerName"
          dir="rtl"
          className="mb-2 text-lg font-semibold"
        >
          שם שחקן:
        </label>
        <input
          id="playerName"
          type="text"
          placeholder="הזן שם שחקן"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          required
          dir="rtl"
          className="mb-4 p-3 rounded-lg bg-gray-900 text-white shadow border border-green-500 focus:ring-2 focus:ring-green-600"
        />

        <label
          htmlFor="playerPhone"
          dir="rtl"
          className="mb-2 text-lg font-semibold"
        >
          מספר טלפון:
        </label>
        <input
          id="playerPhone"
          type="tel"
          placeholder="הזן מספר טלפון"
          value={playerPhone}
          onChange={(e) => setPlayerPhone(e.target.value)}
          required
          dir="rtl"
          className="mb-6 p-3 rounded-lg bg-gray-900 text-white shadow border border-green-500 focus:ring-2 focus:ring-green-600"
        />

        <button
          type="submit"
          disabled={isAdding}
          className="py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition duration-300 disabled:opacity-50"
          dir="rtl"
        >
          {isAdding ? "מוסיף..." : "הוסף שחקן"}
        </button>
      </form>
    </div>
  );
};

export default AddGeneralPlayer;
