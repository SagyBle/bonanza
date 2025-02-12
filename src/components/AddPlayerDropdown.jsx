import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";

const AddPlayerDropdown = ({ onSelectPlayer, playersToReduce }) => {
  const [inputValue, setInputValue] = useState("");
  const [playersList, setPlayersList] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  // Fetch players from Firestore (or any other source)
  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, "generalPlayers"));
      const players = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setPlayersList(players);
      setFilteredPlayers(players); // Initially show all players
    };
    fetchPlayers();
  }, []);

  // Filter players based on the search input
  useEffect(() => {
    if (inputValue === "") {
      setFilteredPlayers([]); // Set to empty array when input is empty
    } else {
      setFilteredPlayers(
        playersList.filter((player) =>
          player.name.toLowerCase().includes(inputValue.toLowerCase())
        )
      );
    }
  }, [inputValue, playersList]);

  // Handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handle player selection
  const handlePlayerSelect = (player) => {
    // Add to the selected players list
    if (!selectedPlayers.some((p) => p.id === player.id)) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
    setInputValue(""); // Clear input after selecting player
    setFilteredPlayers([]); // Reset the filtered players list

    if (onSelectPlayer) onSelectPlayer(player); // Call the onSelectPlayer callback
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        className="w-full p-3 mt-2 rounded-lg bg-gray-900 text-white shadow-lg border border-green-500 focus:ring-2 focus:ring-green-600 focus:outline-none"
        dir="rtl"
        placeholder="חפש שחקן..."
      />

      {inputValue && filteredPlayers.length > 0 && (
        <ul className="absolute w-full mt-2 bg-gray-800 text-white rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
          {filteredPlayers
            .filter(
              (player) => !playersToReduce.some((p) => p.id === player.id)
            )
            .map((player) => (
              <li
                key={player.id}
                onClick={() => handlePlayerSelect(player)}
                className="p-2 cursor-pointer hover:bg-gray-600"
              >
                {player.name}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default AddPlayerDropdown;
