import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";

const AddPlayerDropdown = ({ groupId, onSelectPlayer, playersToReduce }) => {
  const [inputValue, setInputValue] = useState("");
  const [playersList, setPlayersList] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(
        collection(db, `groups/${groupId}/generalPlayers`)
      );
      const players = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        avatarUrl: doc.data().avatarUrl || null,
        sheepAvatarUrl: doc.data().sheepAvatarUrl || null,
      }));
      setPlayersList(players);
      setFilteredPlayers(players);
    };
    fetchPlayers();
  }, [groupId]);

  useEffect(() => {
    if (inputValue === "") {
      setFilteredPlayers([]);
    } else {
      setFilteredPlayers(
        playersList.filter((player) =>
          player.name.toLowerCase().includes(inputValue.toLowerCase())
        )
      );
    }
  }, [inputValue, playersList]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handlePlayerSelect = (player) => {
    if (!selectedPlayers.some((p) => p.id === player.id)) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
    setInputValue("");
    setFilteredPlayers([]);

    if (onSelectPlayer) onSelectPlayer(player);
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
