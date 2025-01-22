import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  onSnapshot,
  increment,
  serverTimestamp,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import Asmachta from "../components/Asmachta";

// Import icons and sounds
import sheepIcon from "../assets/icons/sheep.svg";
import cachingSound from "../assets/sounds/caching.mp3";
import sheepSound from "../assets/sounds/sheep.mp3";
import policeSound from "../assets/sounds/police.mp3";

const Table = ({ isManagerMode }) => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState({});
  const [showAsmachta, setShowAsmachta] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [tableData, setTableData] = useState({ title: "", description: "" });
  const [soundEnabled, setSoundEnabled] = useState(true); // State for sound toggle
  const [loading, setLoading] = useState(true); // Loading state for players

  const UPDATE_DURATION = 4 * 60 * 1000; // 4 minutes in milliseconds

  // Load sounds
  const cachingAudio = new Audio(cachingSound);
  const sheepAudio = new Audio(sheepSound);
  const policeAudio = new Audio(policeSound);

  useEffect(() => {
    const checkTableExists = async () => {
      const tableDocRef = doc(db, `tables`, tableId);
      const tableDocSnap = await getDoc(tableDocRef);

      if (!tableDocSnap.exists()) {
        // If the table does not exist, navigate to the homepage
        navigate("/");
      } else {
        setTableData(tableDocSnap.data());
      }
    };

    checkTableExists();

    const playersRef = collection(db, `tables/${tableId}/players`);

    // Set up a real-time listener for the players collection
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const playersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlayers(playersList);
      setLoading(false); // Stop loading once players are fetched
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [tableId, navigate]);

  const handleAddEntry = async (playerId) => {
    try {
      const playerDocRef = doc(db, `tables/${tableId}/players`, playerId);

      // Update the 'lastUpdated' field and increment the 'entries' field
      await updateDoc(playerDocRef, {
        lastUpdated: serverTimestamp(),
        entries: increment(1),
      });

      setRecentlyUpdated((prev) => ({
        ...prev,
        [playerId]: new Date().getTime(),
      }));

      // Play sound based on the number of entries if sound is enabled
      if (soundEnabled) {
        const player = players.find((p) => p.id === playerId);
        const entries = player.entries + 1; // Since we're incrementing by 1 here
        if (entries < 4) {
          cachingAudio.play(); // Play caching sound
        } else if (entries === 4) {
          sheepAudio.play(); // Play sheep sound
        } else if (entries > 4) {
          policeAudio.play(); // Play police sound
        }
      }
    } catch (error) {
      console.error("Error updating player: ", error);
    }
  };

  const handleReduceEntry = async (playerId) => {
    try {
      const playerDocRef = doc(db, `tables/${tableId}/players`, playerId);

      // Decrement the 'entries' field, but ensure it doesn't go below 1
      await updateDoc(playerDocRef, {
        entries: increment(-1),
      });
    } catch (error) {
      console.error("Error reducing entry: ", error);
    }
  };

  const handleAsmachta = (player) => {
    const now = new Date().getTime();
    const elapsed = Math.floor((now - recentlyUpdated[player.id]) / 1000); // in seconds
    setSelectedPlayer(player);
    setElapsedTime(elapsed);
    setShowAsmachta(true); // Show the popup
  };

  const closeModal = () => {
    setShowAsmachta(false);
    setSelectedPlayer(null);
    setElapsedTime(0);
  };

  const resetEntriesToOne = async () => {
    try {
      const playersRef = collection(db, `tables/${tableId}/players`);
      const snapshot = await getDocs(playersRef);

      const updatePromises = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { entries: 1 })
      );

      await Promise.all(updatePromises);
      console.log("All entries reset to 1.");
    } catch (error) {
      console.error("Error resetting entries: ", error);
    }
  };

  const handleAddPlayer = async () => {
    if (newPlayerName.trim() === "") {
      alert("Please enter a player name");
      return;
    }

    try {
      const newPlayer = {
        name: newPlayerName,
        entries: 1,
        lastUpdated: serverTimestamp(),
      };

      // Add the new player to the Firestore table's players collection
      const playersRef = collection(db, `tables/${tableId}/players`);
      await addDoc(playersRef, newPlayer);

      // Clear the input field
      setNewPlayerName("");
    } catch (error) {
      console.error("Error adding player: ", error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-md">
      {/* Display the title and description of the table */}
      <h2 className="text-2xl font-bold mb-4">
        {tableData.title ||
          `Table of the day ${new Date().toLocaleDateString()}`}
      </h2>
      <p className="mb-4">{tableData.description || ""}</p>

      {isManagerMode && (
        <>
          {/* Sound Toggle */}
          <div className="mb-4">
            <label htmlFor="soundToggle" className="text-lg font-semibold">
              Enable Sounds:
            </label>
            <input
              type="checkbox"
              id="soundToggle"
              checked={soundEnabled}
              onChange={() => setSoundEnabled(!soundEnabled)}
              className="ml-2"
            />
          </div>

          {/* Reset All Entries to 1 */}
          <button
            onClick={resetEntriesToOne}
            className="mb-4 bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
          >
            Reset All Entries to 1
          </button>
        </>
      )}

      {/* Add New Player Form */}

      {loading ? (
        <p>טוען...</p>
      ) : players.length === 0 ? (
        <p>אין שחקנים בשולחן הזה</p>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="mt-4 text-lg font-medium text-right mb-4">שחקנים</h3>
          <ul className="list-none p-0 space-y-4">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex justify-between items-center p-4 bg-gray-100 rounded-md shadow-md transition-all hover:bg-gray-200"
              >
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAddEntry(player.id)}
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    הוסף כניסה
                  </button>

                  {/* Show reduce entry button only in manager mode */}
                  {isManagerMode && player.entries > 1 && (
                    <button
                      onClick={() => handleReduceEntry(player.id)}
                      className="bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      הורד כניסה
                    </button>
                  )}

                  {recentlyUpdated[player.id] &&
                    new Date().getTime() - recentlyUpdated[player.id] <=
                      UPDATE_DURATION && (
                      <button
                        onClick={() => handleAsmachta(player)}
                        className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
                      >
                        אסמכתא
                      </button>
                    )}
                </div>
                <div className="flex items-center space-x-3">
                  {/* Display Sheep Icon next to Player's Name */}
                  <span className="text-sm text-gray-500">
                    כניסות: {player.entries || 0}
                  </span>
                  {player.entries >= 4 && (
                    <img src={sheepIcon} alt="Sheep Icon" className="w-6 h-6" />
                  )}
                  <strong className="text-gray-800 text-lg">
                    {player.name}
                  </strong>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showAsmachta && selectedPlayer && (
        <Asmachta
          playerName={selectedPlayer.name}
          entryNumber={selectedPlayer.entries}
          elapsedTime={elapsedTime}
          onClose={closeModal}
        />
      )}

      <h2 className="mt-16">הוספת שחקנים נוספים</h2>
      <div className="mt-4 flex items-center justify-between space-x-4">
        {/* Add Player Button */}
        <button
          onClick={handleAddPlayer}
          className="bg-green-500 text-white p-3 rounded-md hover:bg-green-600 transition-all ease-in-out duration-300"
        >
          הוסף
        </button>

        {/* Input for Player Name */}
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="הכנס את שם השחקן..."
          className="border p-3 rounded-md flex-1 text-right bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          dir="rtl"
        />
      </div>
    </div>
  );
};

export default Table;
