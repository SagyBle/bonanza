import { useState, useEffect, useRef } from "react";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";

const DropdownWithSearch = ({ groupId, onSelectPlayer }) => {
  const [inputValue, setInputValue] = useState("");
  const [playersList, setPlayersList] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Fetch players from Firestore
  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(
        collection(db, `groups/${groupId}/generalPlayers`)
      );
      const players = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setPlayersList(players);
      setFilteredPlayers(players);
    };
    fetchPlayers();
  }, []);

  // Filter players based on search input
  useEffect(() => {
    setFilteredPlayers(
      inputValue
        ? playersList.filter((player) =>
            player.name.toLowerCase().includes(inputValue.toLowerCase())
          )
        : []
    );
    setHighlightedIndex(-1);
  }, [inputValue, playersList]);

  // Handle input change
  const handleInputChange = (e) => setInputValue(e.target.value);

  // Handle player selection
  const handlePlayerSelect = (player) => {
    if (!selectedPlayers.some((p) => p.id === player.id)) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
    setInputValue("");
    setFilteredPlayers([]);
    onSelectPlayer?.(player);
    setHighlightedIndex(-1);

    // Keep input field active
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Handle player removal
  const handleRemovePlayer = (playerId) => {
    setSelectedPlayers(
      selectedPlayers.filter((player) => player.id !== playerId)
    );
  };

  const handleKeyDown = (e) => {
    if (filteredPlayers.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        setHighlightedIndex((prev) =>
          prev < filteredPlayers.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        if (highlightedIndex >= 0) {
          handlePlayerSelect(filteredPlayers[highlightedIndex]);
        } else if (filteredPlayers.length > 0) {
          handlePlayerSelect(filteredPlayers[0]); // Select the first item if none is highlighted
        }
        break;
      case "Escape":
        setInputValue("");
        setFilteredPlayers([]);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative">
      {/* Selected players */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {selectedPlayers.map((player) => (
          <span
            key={player.id}
            className="flex items-center bg-green-500 text-white py-1 px-3 rounded-full"
          >
            {player.name}
            <button
              onClick={() => handleRemovePlayer(player.id)}
              className="ml-2 text-red-500"
            >
              &times;
            </button>
          </span>
        ))}
      </div>

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full p-3 mt-2 rounded-lg bg-gray-900 text-white shadow-lg border border-green-500 focus:ring-2 focus:ring-green-600 focus:outline-none"
        dir="rtl"
        placeholder="חפש שחקן..."
      />

      {/* Dropdown list */}
      {inputValue && filteredPlayers.length > 0 && (
        <ul
          ref={listRef}
          className="absolute w-full mt-2 bg-gray-800 text-white rounded-lg shadow-lg max-h-40 overflow-y-auto z-10"
        >
          {filteredPlayers
            .filter(
              (player) =>
                !selectedPlayers.some((selected) => selected.id === player.id)
            )
            .map((player, index) => (
              <li
                key={player.id}
                onClick={() => handlePlayerSelect(player)}
                className={`p-2 cursor-pointer hover:bg-gray-600 ${
                  index === highlightedIndex ? "bg-gray-700" : ""
                }`}
              >
                {player.name}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default DropdownWithSearch;
