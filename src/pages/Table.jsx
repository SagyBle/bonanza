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
import shufflePlayers from "../utils/shufflePlayers"
import useShuffledPlayers from '../hooks/useShuffledPlayers'

// Import icons and sounds
import sheepIcon from "../assets/icons/sheep.svg";
import cachingSound from "../assets/sounds/caching.mp3";
import sheepSound from "../assets/sounds/sheep.mp3";
import policeSound from "../assets/sounds/police.mp3";
import History from "../components/hisotry/History";
import Whatsapp from "../components/whatsapp/Whatsapp";
import SumupPlayerModal from "../components/SumupPlayer";
import { HistoryObjectTypes } from "../constants/enums/history.enum";
import runawayIcon from "../assets/icons/runningaway.svg";

import SumupTable from "../components/SumupTable";
import CloseTableModal from "../components/CloseTableModal";
import DropdownWithSearch from "../components/DropdownWithSearch";
import AddFoodExpenses from "../components/AddFoodExpenses";
import AddPlayerDropdown from "../components/AddPlayerDropdown";
import AddPlayerModal from "../components/AddPlayerModal";
import WideDisplayNew from "../components/wideDisplay/WideDisplayNew";

const Table = ({ isManagerMode, soundEnabled }) => {
  const { groupId, tableId } = useParams();
  const navigate = useNavigate();
  const [recentlyUpdated, setRecentlyUpdated] = useState({});
  const [showAsmachta, setShowAsmachta] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [tableData, setTableData] = useState({ title: "", description: "" });
  // const [soundEnabled, setSoundEnabled] = useState(true); // State for sound toggle
  const [showSumupPlayerModal, setShowSumupPlayerModal] = useState(false);
  const [showCloseTableModal, setShowCloseTableModal] = useState(false);
  const [playerToSumUp, setPlayerToSumUp] = useState(null);
  const [playerToAdd, setPlayerToAdd] = useState();
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showWideDisplay, setShowWideDisplay] = useState(false);
  const { players, loading, setPlayers } = useShuffledPlayers(groupId, tableId);


  // Add effect to handle body scroll when modal is open
  useEffect(() => {
    if (showWideDisplay) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showWideDisplay]);

  const UPDATE_DURATION = 4 * 60 * 1000; // 4 minutes in milliseconds

  const cachingAudio = new Audio(cachingSound);
  const sheepAudio = new Audio(sheepSound);
  const policeAudio = new Audio(policeSound);

  useEffect(() => {
    const checkTableExists = async () => {
      const tableDocRef = doc(db, `groups/${groupId}/tables/${tableId}`);
      const tableDocSnap = await getDoc(tableDocRef);

      if (!tableDocSnap.exists()) {
        navigate("/");
      } else {
        setTableData(tableDocSnap.data());
      }
    };

    checkTableExists();
  }, [groupId, tableId, navigate]);

  const handleAddEntry = async (playerId) => {
    try {
      const playerDocRef = doc(
        db,
        `groups/${groupId}/tables/${tableId}/players`,
        playerId
      );
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
      const historyCollectionRef = collection(
        db,
        `groups/${groupId}/tables/${tableId}/history`
      );
      await addDoc(historyCollectionRef, {
        playerId: playerDocRef.id, // Add playerId
        playerName: player.name, // Add playerName
        timestamp: new Date().toISOString(),
        type: "entry_increased",
        updatedEntries: player.entries + 1, // Incremented value
      });

      // Play sound based on the number of entries if sound is enabled
      if (soundEnabled) {
        const entries = player.entries + 1;
        let soundSrc = null;

        if (entries < 4) {
          soundSrc = cachingSound;
        } else if (entries === 4) {
          soundSrc = sheepSound;
        } else if (entries > 4) {
          soundSrc = policeSound;
        }

        if (soundSrc) {
          const audio = new Audio(soundSrc);
          audio.play().catch((e) => {
            console.warn("Autoplay blocked or failed:", e);
          });
        }
      }
    } catch (error) {
      console.error("Error updating player: ", error);
    }
  };

  const handleReduceEntry = async (playerId) => {
    try {
      const playerDocRef = doc(
        db,
        `groups/${groupId}/tables/${tableId}/players`,
        playerId
      );
      const playerSnapshot = await getDoc(playerDocRef);
      const player = playerSnapshot.data();

      // Decrement the 'entries' field, but ensure it doesn't go below 1
      const newEntries = Math.max(player.entries - 1, 1);
      await updateDoc(playerDocRef, {
        entries: newEntries,
      });

      // Add history record for the entry decrease
      const historyCollectionRef = collection(
        db,
        `groups/${groupId}/tables/${tableId}/history`
      );
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
      const playersRef = collection(
        db,
        `groups/${groupId}/tables/${tableId}/players`
      );
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

  const handleRemovePlayer = async (playerId) => {
    try {
      // Prompt confirmation before deleting the player
      const confirmDelete = window.confirm(
        "האם אתה בטוח שברצונך למחוק את השחקן?"
      );
      if (!confirmDelete) return;

      // Get the reference to the player document
      const playerDocRef = doc(
        db,
        `groups/${groupId}/tables/${tableId}/players`,
        playerId
      );

      // Delete the player from Firestore
      await deleteDoc(playerDocRef);

      // Optionally, you can add a history entry to track the deletion
      const historyRef = collection(
        db,
        `groups/${groupId}/tables/${tableId}/history`
      );
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

    const playerDocRef = doc(
      db,
      `groups/${groupId}/tables/${tableId}/players`,
      playerToAdd.id
    );

    try {
      const maxOrder = players.reduce((max, p) => Math.max(max, p.order ?? -1), -1);
      const nextOrder = maxOrder + 1;

      await setDoc(playerDocRef, {
        name: playerToAdd.name,
        entries: 1,
        timestamp: new Date().toISOString(),
        order: nextOrder,
        ...playerToAdd,
      });

      // Add a history entry for the added player
      const historyRef = collection(
        db,
        `groups/${groupId}/tables/${tableId}/history`
      );
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
    <div className="p-6 max-w-4xl mx-auto bg-white">
      {/* Wide Display Toggle Button */}
      <button
        onClick={() => {
          setShowWideDisplay(true);
          document.documentElement.requestFullscreen().catch(() => {});
        }}
        className="mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-2 px-4 rounded-lg shadow-lg hover:from-yellow-500 hover:to-yellow-700 transition-all flex items-center gap-2"
      >
        <span>Show Wide Display</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
          />
        </svg>
      </button>

      {/* Wide Display Modal */}
      {showWideDisplay && (
        <div className="fixed inset-0 z-50">
          <WideDisplayNew
            onClose={() => setShowWideDisplay(false)}
            players={players}
            groupId={groupId}
            tableId={tableId}
          />
        </div>
      )}

      <AddFoodExpenses
        tableId={tableId}
        groupId={groupId}
        isManagerMode={isManagerMode}
      />

      <span>{groupId}</span>

      {/* Display the title and description of the table */}
      {tableData.tableImageUrl && (
        <div className="w-full mb-4 rounded-lg overflow-hidden shadow-lg">
          <img
            src={tableData.tableImageUrl}
            alt="Hero Image"
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <div className="text-white p-6 pb-0 rounded-lg shadow-lg text-center">
        <h2 className="text-3xl font-bold text-blue-500">
          {tableData.title
            ? `🃏 ${tableData.title}`
            : `🃏 שולחן יום ${new Date().toLocaleDateString("he-IL", {
                weekday: "long",
              })} - ${new Date().toLocaleDateString("he-IL", {
                day: "numeric",
                month: "numeric",
              })}`}
        </h2>
        {tableData.description && (
          <p className="mt-2 text-gray-300 text-lg">{tableData.description}</p>
        )}
      </div>

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
        <div className="bg-white p-6 pt-0 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-right mb-4">שחקנים</h3>
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
                    <span className="text-m text-gray-800 flex items-center justify-center gap-2 pt-1">
                      <img
                        className="w-10"
                        alt="runawayicon"
                        src={runawayIcon}
                      />
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
          groupId={groupId}
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
          groupId={groupId}
          tableId={tableId}
        />
      )}

      <h2 className="mt-16">הוספת שחקנים נוספים</h2>
      {/* <DropdownWithSearch onSelectPlayer={handlePlayerSelect} /> */}
      <AddPlayerDropdown
        groupId={groupId}
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
      {/* <History tableId={tableId} /> */}
      <History groupId={groupId} tableId={tableId} />
    </div>
  );
};

export default Table;
