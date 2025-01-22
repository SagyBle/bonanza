import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import { db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

const CreateATable = () => {
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [roomCreatedTime, setRoomCreatedTime] = useState(null);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setPlayerName(e.target.value);
  };

  const handleTitleChange = (e) => {
    setRoomTitle(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setRoomDescription(e.target.value);
  };

  const tablesCollection = collection(db, "tables");

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      const currentDate = new Date().toLocaleString();
      const newPlayer = {
        name: playerName,
        timestamp: currentDate,
        entries: 1,
      };

      if (editingIndex !== null) {
        // Update the existing player
        const updatedPlayers = [...players];
        updatedPlayers[editingIndex] = newPlayer;
        setPlayers(updatedPlayers);
        setEditingIndex(null);
      } else {
        // Add a new player
        setPlayers([...players, newPlayer]);
      }

      setPlayerName("");
    }
  };

  const handleEditPlayer = (index) => {
    setPlayerName(players[index].name);
    setEditingIndex(index);
  };

  const handleCreateRoom = async () => {
    const roomCreationTime = new Date().toLocaleString();
    setRoomCreatedTime(roomCreationTime);

    const newTable = {
      createdAt: roomCreationTime,
      title: roomTitle,
      description: roomDescription,
    };

    try {
      const tableDocRef = await addDoc(tablesCollection, newTable);
      const playersCollectionRef = collection(tableDocRef, "players");
      for (const player of players) {
        await addDoc(playersCollectionRef, player);
      }

      console.log("Room created with ID:", tableDocRef.id);
      navigate(`/table/${tableDocRef.id}`);
    } catch (error) {
      console.error("Error creating room: ", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-gradient-to-r from-black via-gray-800 to-black text-white p-8 rounded-xl shadow-xl">
      <h2 className="text-4xl font-bold text-center mb-6 text-yellow-400 drop-shadow-md">
        צור שולחן פוקר
      </h2>

      <div className="mb-4">
        <label
          htmlFor="roomTitle"
          className="text-lg font-semibold text-green-500"
          dir="rtl"
        >
          כותרת:
        </label>
        <input
          type="text"
          id="roomTitle"
          value={roomTitle}
          onChange={handleTitleChange}
          className="w-full p-3 mt-2 rounded-lg bg-gray-900 text-white shadow-lg border border-green-500 focus:ring-2 focus:ring-green-600 focus:outline-none"
          placeholder="הכנס כותרת לשולחן..."
          required
          dir="rtl"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="roomDescription"
          className="text-lg font-semibold text-green-500"
          dir="rtl"
        >
          תיאור:
        </label>
        <textarea
          id="roomDescription"
          value={roomDescription}
          onChange={handleDescriptionChange}
          className="w-full p-3 mt-2 rounded-lg bg-gray-900 text-white shadow-lg border border-green-500 focus:ring-2 focus:ring-green-600 focus:outline-none"
          placeholder="הכנס תיאור לשולחן..."
          rows="4"
          required
          dir="rtl"
        />
      </div>

      <form onSubmit={handleAddPlayer} className="mb-6">
        <div className="mb-4">
          <label
            htmlFor="playerName"
            className="text-lg font-semibold text-green-500"
          >
            הוספת שחקנים
          </label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={handleInputChange}
            className="w-full p-3 mt-2 rounded-lg bg-gray-900 text-white shadow-lg border border-green-500 focus:ring-2 focus:ring-green-600 focus:outline-none"
            placeholder="Enter player name"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 mt-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-colors duration-300"
        >
          {editingIndex !== null ? "Update Player" : "Add Player"}
        </button>
      </form>

      <h3 className="text-xl font-semibold text-yellow-400 mb-4">שחקנים:</h3>
      <ul className="list-none p-0">
        {players.map((player, index) => (
          <li
            key={index}
            className="flex justify-between items-center bg-gray-700 p-4 mb-3 rounded-lg shadow-lg"
          >
            <div>
              <strong>{player.name}</strong> - <em>{player.timestamp}</em>
            </div>
            <div>
              <button
                onClick={() => handleEditPlayer(index)}
                className="ml-4 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg"
              >
                ערוך
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={handleCreateRoom}
        className="w-full py-3 px-4 mt-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors duration-300"
      >
        צור שולחן
      </button>

      {roomCreatedTime && (
        <div className="mt-6 text-center">
          <h4 className="font-semibold text-green-400">Room Created At:</h4>
          <p>{roomCreatedTime}</p>
        </div>
      )}
    </div>
  );
};

export default CreateATable;
