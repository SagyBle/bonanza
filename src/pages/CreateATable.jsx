import { useState } from "react";
import { db } from "../config/firebase";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import DropdownWithSearch from "../components/DropdownWithSearch";

const CreateATable = () => {
  const [roomTitle, setRoomTitle] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();

  const handleTitleChange = (e) => {
    setRoomTitle(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setRoomDescription(e.target.value);
  };

  const handlePlayerSelect = (player) => {
    // Check if the player is already in the players array by comparing player ID (or name)
    const playerExists = players.some(
      (existingPlayer) => existingPlayer.id === player.id
    );

    // Only add the player if they don't already exist in the list
    if (!playerExists) {
      setPlayers((prevPlayers) => [...prevPlayers, player]);
    }
  };

  const tablesCollection = collection(db, "tables");

  const handleCreateRoom = async () => {
    const roomCreationTime = new Date().toISOString();

    const defaultTitle = `השולחן של ${new Date().toLocaleDateString("he-IL", {
      weekday: "long",
    })} - ה${new Date().toLocaleDateString("he-IL", {
      day: "numeric",
      month: "numeric",
      year: "2-digit",
    })}`;

    const newTable = {
      createdAt: roomCreationTime,
      title: roomTitle || defaultTitle,
      description: roomDescription,
    };

    try {
      const tableDocRef = await addDoc(tablesCollection, newTable);
      const historyCollectionRef = collection(tableDocRef, "history");

      await addDoc(historyCollectionRef, {
        type: "table_created",
        timestamp: roomCreationTime,
      });

      const playersCollectionRef = collection(tableDocRef, "players");
      for (const player of players) {
        const playerDocRef = doc(playersCollectionRef, player.id); // Use the player's ID as the doc ID
        await setDoc(playerDocRef, { ...player, entries: 1 }); // Add the player document with the custom ID

        await addDoc(historyCollectionRef, {
          type: "player_added",
          playerId: playerDocRef.id,
          playerName: player.name,
          timestamp: new Date().toISOString(),
        });
      }

      navigate(`/table/${tableDocRef.id}`);
    } catch (error) {
      console.error("Error creating room: ", error);
    }
  };

  return (
    <div className="w-full mx-auto bg-gradient-to-r from-black via-gray-800 to-black text-white p-8 rounded-xl shadow-xl">
      <h2 className="text-4xl font-bold text-center mb-6 text-yellow-400 drop-shadow-md">
        צור שולחן פוקר
      </h2>

      <DropdownWithSearch onSelectPlayer={handlePlayerSelect} />

      <div className="mb-4 flex flex-col">
        <label
          htmlFor="roomTitle"
          className="text-lg font-semibold text-green-500 bg-red-90 self-end mt-4"
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

      <div className="mb-6 flex flex-col">
        <label
          htmlFor="roomDescription"
          className="text-lg font-semibold text-green-500 self-end"
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

      <button
        onClick={handleCreateRoom}
        className="w-full py-3 px-4 mt-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors duration-300"
      >
        צור שולחן
      </button>
    </div>
  );
};

export default CreateATable;
