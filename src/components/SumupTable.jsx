import React, { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const SumupTable = ({ players, tableId }) => {
  const [chipInputs, setChipInputs] = useState();
  const [totalChipsInInput, setTotalChipsInInput] = useState();

  useEffect(() => {
    setChipInputs(
      players?.reduce((acc, player) => {
        console.log(player);

        acc[player.id] = player.finalTotalChips ?? ""; // Ensure default value is a string
        return acc;
      }, {})
    );
  }, [players]);

  // Calculate the total chips based on the inputs
  const totalChipsOnTable = players.reduce(
    (sum, player) => sum + player.entries * 100,
    0
  );

  useEffect(() => {
    // const totalChips = Object.values(chipInputs).reduce(
    //   (sum, chips) => sum + (parseInt(chips || "0", 10) || 0),
    //   0
    // );
    // setTotalChipsInInput(totalChips);
  }, [players]);

  const handleInputChange = (id, value) => {
    const sanitizedValue = value.replace(/[^0-9]/g, ""); // Allow only numbers
    setChipInputs((prev) => ({ ...prev, [id]: sanitizedValue }));
  };

  const handleEndTable = async () => {
    const updatedPlayers = players.map((player) => ({
      id: player.id,
      name: player.name,
      finalTotalChips: parseInt(chipInputs[player.id] || "0", 10),
    }));

    // Print all players' data to the console
    console.log(updatedPlayers);

    // Update all players in the database
    const batchUpdates = updatedPlayers.map(({ id, finalTotalChips }) => {
      const playerDocRef = doc(db, `tables/${tableId}/players`, id);
      return updateDoc(playerDocRef, { finalTotalChips });
    });

    await Promise.all(batchUpdates);
    alert("Table has been finalized!");
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <button
        onClick={() => {
          console.log({ chipInputs });
        }}
      >
        show chip inputs
      </button>
      <h2 className="text-2xl font-bold mb-6">Sumup Table</h2>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Total Chips on Table:</h3>
        <p className="text-lg">{totalChipsOnTable}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {players.map((player) => (
          <div
            key={player.id}
            className="p-4 border border-gray-300 rounded-lg shadow-sm"
          >
            <h4 className="text-lg font-semibold">{player.name}</h4>
            <p className="text-gray-700">Entries: {player.entries}</p>
            <label className="block mt-4">
              <span className="text-gray-600">;ז׳יטונים שנשארו:</span>
              <input
                type="text"
                inputMode="numeric"
                value={chipInputs[player.id] || ""} // Ensure a default value is always provided
                onChange={(e) => handleInputChange(player.id, e.target.value)}
                className="mt-1 block w-full p-2 border rounded-md text-gray-700"
              />
            </label>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Total Chips in Inputs:</h3>
        {/* <p className="text-lg">{totalChipsInInputs}</p> */}
      </div>

      <button
        onClick={handleEndTable}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
      >
        סגור שולחן
      </button>
    </div>
  );
};

export default SumupTable;
