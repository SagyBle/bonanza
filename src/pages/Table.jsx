import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  onSnapshot,
  increment,
  getDoc,
  addDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import Asmachta from "../components/Asmachta";

// Import icons and sounds
import sheepIcon from "../assets/icons/sheep.svg";
import cachingSound from "../assets/sounds/caching.mp3";
import sheepSound from "../assets/sounds/sheep.mp3";
import policeSound from "../assets/sounds/police.mp3";
import History from "../components/hisotry/History";
import Whatsapp from "../components/whatsapp/Whatsapp";
import SumupPlayerModal from "../components/SumupPlayer";
import { HistoryObjectTypes } from "../constants/enums/history.enum";
import runawayIcon from "../assets/icons/runaway.svg";
import SumupTable from "../components/SumupTable";
import CloseTableModal from "../components/CloseTableModal";
import DropdownWithSearch from "../components/DropdownWithSearch";
import AddFoodExpenses from "../components/AddFoodExpenses";
import AddPlayerDropdown from "../components/AddPlayerDropdown";
import AddPlayerModal from "../components/AddPlayerModal";

const Table = ({ isManagerMode, soundEnabled }) => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState({});
  const [showAsmachta, setShowAsmachta] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [tableData, setTableData] = useState({ title: "", description: "" });
  // const [soundEnabled, setSoundEnabled] = useState(true); // State for sound toggle
  const [loading, setLoading] = useState(true); // Loading state for players
  const [showSumupPlayerModal, setShowSumupPlayerModal] = useState(false);
  const [showCloseTableModal, setShowCloseTableModal] = useState(false);
  const [playerToSumUp, setPlayerToSumUp] = useState(null);
  const [playerToAdd, setPlayerToAdd] = useState();
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  const UPDATE_DURATION = 4 * 60 * 1000; // 4 minutes in milliseconds

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
      const playerSnapshot = await getDoc(playerDocRef);
      const player = playerSnapshot.data();

      // Update the 'lastUpdated' field and increment the 'entries' field
      await updateDoc(playerDocRef, {
        timestamp: new Date().toISOString(),
        entries: increment(1),
      });

      setRecentlyUpdated((prev) => ({
        ...prev,
        [playerId]: new Date().getTime(),
      }));

      // Add history record for the entry increase
      const historyCollectionRef = collection(db, `tables/${tableId}/history`);
      await addDoc(historyCollectionRef, {
        playerId: playerDocRef.id, // Add playerId
        playerName: player.name, // Add playerName
        timestamp: new Date().toISOString(),
        type: "entry_increased",
        updatedEntries: player.entries + 1, // Incremented value
      });

      // Play sound based on the number of entries if sound is enabled
      if (soundEnabled) {
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
      const playerSnapshot = await getDoc(playerDocRef);
      const player = playerSnapshot.data();

      // Decrement the 'entries' field, but ensure it doesn't go below 1
      const newEntries = Math.max(player.entries - 1, 1);
      await updateDoc(playerDocRef, {
        entries: newEntries,
      });

      // Add history record for the entry decrease
      const historyCollectionRef = collection(db, `tables/${tableId}/history`);
      await addDoc(historyCollectionRef, {
        playerId: playerDocRef.id, // Add playerId
        playerName: player.name, // Add playerName
        timestamp: new Date().toISOString(),
        type: HistoryObjectTypes.ENTRY_DECREASED,
        updatedEntries: newEntries, // Updated value after reduction
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

  const handleCloseTable = () => {
    setShowCloseTableModal(true);
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

  // need to change this part
  // const handleAddPlayer = async () => {
  //   if (newPlayerName.trim() === "") {
  //     alert("Please enter a player name");
  //     return;
  //   }

  //   try {
  //     const newPlayer = {
  //       name: newPlayerName,
  //       entries: 1,
  //       timestamp: new Date().toISOString(),
  //     };

  //     // Add the new player to the Firestore table's players collection
  //     const playersRef = collection(db, `tables/${tableId}/players`);
  //     const playerDocRef = await addDoc(playersRef, newPlayer);

  //     // Add a history entry for the new player
  //     const historyRef = collection(db, `tables/${tableId}/history`);
  //     await addDoc(historyRef, {
  //       type: "player_added",
  //       playerName: newPlayerName,
  //       playerId: playerDocRef.id,
  //       timestamp: new Date().toISOString(),
  //     });

  //     // Clear the input field
  //     setNewPlayerName("");
  //   } catch (error) {
  //     console.error("Error adding player: ", error);
  //   }
  // };

  const handleRemovePlayer = async (playerId) => {
    try {
      // Prompt confirmation before deleting the player
      const confirmDelete = window.confirm(
        "האם אתה בטוח שברצונך למחוק את השחקן?"
      );
      if (!confirmDelete) return;

      // Get the reference to the player document
      const playerDocRef = doc(db, `tables/${tableId}/players`, playerId);

      // Delete the player from Firestore
      await deleteDoc(playerDocRef);

      // Optionally, you can add a history entry to track the deletion
      const historyRef = collection(db, `tables/${tableId}/history`);
      await addDoc(historyRef, {
        type: "player_deleted",
        playerId,
        timestamp: new Date().toISOString(),
      });

      // You can also remove the player from the local state to reflect the deletion immediately
      setPlayers((prevPlayers) =>
        prevPlayers.filter((player) => player.id !== playerId)
      );
    } catch (error) {
      console.error("Error deleting player: ", error);
    }
  };

  const getPlayer = (playerId) => {
    return players.find((player) => player.id === playerId);
  };

  const handleFinishPlayer = (playerId) => {
    // console.log("finish player", playerId);
    setShowSumupPlayerModal(true);
    const player = getPlayer(playerId);
    console.log("sagy1", { player });

    setPlayerToSumUp(player);
  };

  const onCloseSumupPlayerModal = () => {
    setShowSumupPlayerModal(false);
    setPlayerToSumUp(null);
  };

  const handleAddPlayer = (player) => {
    console.log("player selcted from table component: ", player);
    setPlayerToAdd(player);
    setShowAddPlayerModal(true);
  };

  const onCloseAddPlayerModal = () => {
    setShowAddPlayerModal(false);
    setPlayerToAdd("");
  };

  const handleSubmitPlayer = async () => {
    if (!playerToAdd) return;

    const playerDocRef = doc(db, `tables/${tableId}/players`, playerToAdd.id);

    try {
      await setDoc(playerDocRef, {
        name: playerToAdd.name,
        entries: 1,
        timestamp: new Date().toISOString(),
      });

      // Add a history entry for the added player
      const historyRef = collection(db, `tables/${tableId}/history`);
      await addDoc(historyRef, {
        type: "player_added",
        playerName: playerToAdd.name,
        playerId: playerToAdd.id,
        timestamp: new Date().toISOString(),
      });

      console.log("Player added successfully:", playerToAdd);
      setShowAddPlayerModal(false);
      setPlayerToAdd(null);
    } catch (error) {
      console.error("Error adding player:", error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white ">
      {/* <AddFoodExpenses tableId={tableId} /> */}

      {/* Display the title and description of the table */}
      <h2 className="text-2xl font-bold mb-4">
        {tableData.title ||
          // `Table of the day ${new Date().toLocaleDateString()}`}

          `שולחן של ${new Date().toLocaleDateString("he-IL", {
            weekday: "long",
          })} ה${new Date().toLocaleDateString("he-IL", {
            day: "numeric",
            month: "numeric",
          })}`}
      </h2>
      <p className="mb-4">{tableData.description || ""}</p>

      {isManagerMode && (
        <>
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
                className={`flex justify-between items-center p-4 rounded-md shadow-md transition-all hover:bg-gray-200 ${
                  player.finalTotalChips || player.finalTotalChips === 0
                    ? "bg-gray-300 opacity-50" // If player has finalTotalChips, apply these styles
                    : "bg-gray-100"
                }`}
              >
                <div className="flex space-x-3">
                  {!player.finalTotalChips && player.finalTotalChips !== 0 ? (
                    <>
                      <button
                        onClick={() => handleAddEntry(player.id)}
                        className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        הוסף כניסה
                      </button>
                      {isManagerMode && (
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          מחק שחקן
                        </button>
                      )}
                      {isManagerMode && player.entries > 1 && (
                        <button
                          onClick={() => handleReduceEntry(player.id)}
                          className="bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          הורד כניסה
                        </button>
                      )}
                      {isManagerMode && (
                        <button
                          onClick={() => handleFinishPlayer(player.id)}
                          className="bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors"
                        >
                          סכם ונעל
                        </button>
                      )}

                      {/* Show reduce entry button only in manager mode */}
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
                    </>
                  ) : (
                    <span className="text-m text-gray-800 flex justify-center gap-2 pt-1">
                      <img alt="runawayicon" src={runawayIcon} />
                      {`יצא עם ${
                        player.finalTotalChips < 0 ? "-" : ""
                      }${Math.abs(player.finalTotalChips)}`}{" "}
                      ז׳יטונים
                    </span>
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

      {showSumupPlayerModal && (
        <SumupPlayerModal
          player={playerToSumUp}
          tableId={tableId}
          onClose={onCloseSumupPlayerModal}
        />
      )}

      <Whatsapp players={players} />
      <button
        onClick={handleCloseTable}
        className="bg-black text-white  py-2 px-4 rounded-lg hover:opacity-80 transition-opacity mt-8"
      >
        {" "}
        סגור שולחן ועבור לשאריות
      </button>

      {showCloseTableModal && (
        <CloseTableModal
          isOpen={showCloseTableModal}
          onClose={() => setShowCloseTableModal(false)}
          tableId={tableId}
        />
      )}

      <h2 className="mt-16">הוספת שחקנים נוספים</h2>
      {/* <DropdownWithSearch onSelectPlayer={handlePlayerSelect} /> */}
      <AddPlayerDropdown
        onSelectPlayer={(player) => handleAddPlayer(player)}
        playersToReduce={players}
      />
      {showAddPlayerModal && (
        <AddPlayerModal
          // player={playerToSumUp}
          // tableId={tableId}
          // onClose={onCloseSumupPlayerModal}
          onConfirm={handleSubmitPlayer}
          player={playerToAdd}
          onClose={onCloseAddPlayerModal}
        />
      )}
      <div className="mt-4 flex items-center justify-between space-x-4"></div>
      <History tableId={tableId} />
    </div>
  );
};

export default Table;
