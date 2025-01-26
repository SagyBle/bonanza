import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const Sumup = () => {
  const { tableId } = useParams();
  const [players, setPlayers] = useState([]);
  const [chipInputs, setChipInputs] = useState({});
  const [disabledInputs, setDisabledInputs] = useState({});
  const [totalChipsInInputs, setTotalChipsInInputs] = useState(0);
  const [allApproved, setAllApproved] = useState(false);
  const [leftovers, setLeftovers] = useState({
    total: 0,
    participants: [],
    donatingButNotParticipating: [],
  });

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const playersCollectionRef = collection(
          db,
          `tables/${tableId}/players`
        );
        const playersSnapshot = await getDocs(playersCollectionRef);
        const playersData = playersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const initialChipInputs = playersData.reduce((acc, player) => {
          acc[player.id] = player.finalTotalChips ?? "";
          return acc;
        }, {});

        const initialDisabledInputs = playersData.reduce((acc, player) => {
          acc[player.id] = player.finalTotalChips !== undefined;
          return acc;
        }, {});

        setPlayers(playersData);
        setChipInputs(initialChipInputs);
        setDisabledInputs(initialDisabledInputs);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };

    fetchPlayers();
  }, [tableId]);

  const totalChipsOnTable = players.reduce(
    (sum, player) => sum + player.entries * 100,
    0
  );

  useEffect(() => {
    const total = Object.keys(chipInputs).reduce((sum, playerId) => {
      if (disabledInputs[playerId]) {
        return sum + (parseInt(chipInputs[playerId] || "0", 10) || 0);
      }
      return sum;
    }, 0);
    setTotalChipsInInputs(total);
  }, [chipInputs, disabledInputs]);

  useEffect(() => {
    const areAllApproved = Object.values(disabledInputs).every(
      (state) => state
    );
    setAllApproved(areAllApproved);
  }, [disabledInputs]);

  useEffect(() => {
    const leftoverDetails = players.reduce(
      (acc, player) => {
        const chips = parseInt(chipInputs[player.id] || "0", 10) || 0;
        const remainder = chips % 50;

        let donatedToLeftovers = 0;
        let joiningLeftovers = false;

        if (disabledInputs[player.id]) {
          if (remainder >= 10) {
            acc.total += remainder;
            acc.participants.push({
              id: player.id,
              name: player.name,
              remainder,
            });
            donatedToLeftovers = remainder;
            joiningLeftovers = true;
          } else {
            donatedToLeftovers = remainder;
          }
        }

        player.donatedToLeftovers = donatedToLeftovers;
        player.joiningLeftovers = joiningLeftovers;

        return acc;
      },
      { total: 0, participants: [], donatingButNotParticipating: [] }
    );

    const donatingButNotParticipating = players
      .filter(
        (player) => player.donatedToLeftovers > 0 && !player.joiningLeftovers
      )
      .map((player) => ({
        id: player.id,
        name: player.name,
        donated: player.donatedToLeftovers,
      }));

    // Include donations from players who donate but don’t participate in the total leftovers
    leftoverDetails.total += donatingButNotParticipating.reduce(
      (sum, player) => sum + player.donated,
      0
    );

    setLeftovers({
      ...leftoverDetails,
      donatingButNotParticipating,
    });
  }, [chipInputs, disabledInputs, players]);

  const handleInputChange = (id, value) => {
    const sanitizedValue = value.replace(/[^0-9]/g, "");
    setChipInputs((prev) => ({ ...prev, [id]: sanitizedValue }));
  };

  const toggleInputState = (id) => {
    setDisabledInputs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEndTable = async () => {
    const totalLeftovers = leftovers.total;

    // Map through players and prepare the updates
    const updatedPlayers = players.map((player) => {
      let finalTotalChips = parseInt(chipInputs[player.id] || "0", 10);

      if (player.donatedToLeftovers) {
        finalTotalChips -= player.donatedToLeftovers;
      }

      return {
        id: player.id,
        name: player.name,
        finalTotalChips,
        isParticipatesLeftovers: player.joiningLeftovers, // Add participation status
      };
    });

    // Prepare Firebase update tasks for each player
    const batchUpdates = updatedPlayers.map(
      ({ id, finalTotalChips, isParticipatesLeftovers }) => {
        const playerDocRef = doc(db, `tables/${tableId}/players`, id);
        return updateDoc(playerDocRef, {
          finalTotalChips,
          isParticipatesLeftovers,
        });
      }
    );

    // Update leftovers total in the table document
    const tableDocRef = doc(db, `tables/${tableId}`);
    const updateTableDoc = updateDoc(tableDocRef, {
      leftovers: totalLeftovers,
    });

    try {
      await Promise.all([...batchUpdates, updateTableDoc]);
      navigate(`/leftovers/${tableId}`);
    } catch (error) {
      console.error("Error updating players or table:", error);
      alert("An error occurred while finalizing the table.");
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">סיכום השולחן</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold" dir="rtl">
          טוטאל שולחן:
        </h2>
        <p className="text-md" dir="rtl">
          {totalChipsOnTable / 100} כניסות
          {", "}
          {totalChipsOnTable} ז׳יטונים
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {players.map((player) => (
          <div
            key={player.id}
            className={`relative p-4 border border-gray-300 rounded-lg shadow-sm ${
              player.joiningLeftovers &&
              "bg-green-100 border-2 border-green-500 text-green-800"
            }`}
          >
            <h3 className="text-lg font-semibold" dir="rtl">
              {player.name}
              {player.joiningLeftovers && " - משתתף בשאריות!"}
            </h3>
            <p className="text-gray-700">כניסות: {player.entries}</p>
            <label className="block mt-4">
              <span className="text-gray-600">Chips Left:</span>
              <input
                type="text"
                inputMode="numeric"
                value={
                  chipInputs[player.id] !== undefined
                    ? chipInputs[player.id]
                    : ""
                }
                onChange={(e) => handleInputChange(player.id, e.target.value)}
                className="mt-1 block w-full p-2 border rounded-md text-gray-700"
                disabled={disabledInputs[player.id]}
              />
            </label>
            <button
              onClick={() => toggleInputState(player.id)}
              className={`mt-2 py-1 px-3 text-sm rounded-lg ${
                disabledInputs[player.id]
                  ? "bg-gray-500 text-white hover:bg-green-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {disabledInputs[player.id] ? "Edit" : "Approve"}
            </button>

            <div className="mt-4 text-sm">
              {player.joiningLeftovers ? (
                <p className="text-green-600">
                  <span className="font-semibold">משתתף בשאריות</span>
                  {player.donatedToLeftovers ? (
                    <span className="ml-2 text-green-800">
                      {" "}
                      ותורם: {player.donatedToLeftovers}
                    </span>
                  ) : (
                    <span className="ml-2 text-gray-600">ולא תורם כלום</span>
                  )}
                </p>
              ) : player.donatedToLeftovers ? (
                <p className="text-yellow-600">
                  <span className="font-semibold">
                    תורם לשאריות אך לא משתתף
                  </span>
                  <span className="ml-2 text-yellow-800">
                    {" "}
                    ותורם: {player.donatedToLeftovers}
                  </span>
                </p>
              ) : (
                disabledInputs[player.id] && (
                  <p className="text-red-600">
                    <span className="font-semibold">לא משתתף בשאריות</span>
                  </p>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="text-l font-semibold" dir="rtl">
          <span className="text-bold text-xl">{totalChipsInInputs}</span>{" "}
          ז׳יטונים נספרו
          {totalChipsOnTable - totalChipsInInputs > 0 && (
            <span dir="rtl">
              {", "}
              נותרו עוד {totalChipsOnTable - totalChipsInInputs} ז׳יטונים חסרים
            </span>
          )}
          {totalChipsOnTable - totalChipsInInputs < 0 && (
            <span dir="rtl">
              תקלה בספירת הז׳יטונים, נספרו יותר מדי:
              {", "}
              מאזן הספירה עומד על:
              {totalChipsOnTable - totalChipsInInputs}
            </span>
          )}
        </h2>
      </div>

      <div className="mb-4 text-lg font-semibold">
        <span dir="rtl">
          כל השחקנים אושרו: {allApproved ? "✔️ כן" : "❌ לא"}
        </span>
      </div>

      <div className="mb-4 p-4 border-2 border-blue-500 rounded-lg bg-blue-50 shadow-lg">
        <h2 className="text-l font-semibold text-blue-700">
          סכום שאריות: {leftovers.total}
        </h2>
        {leftovers.participants && leftovers.participants.length > 0 && (
          <>
            <h3 className="text-md font-medium text-blue-600" dir="rtl">
              שחקנים שמשתתפים בשאריות:
            </h3>
            <ul className=" pl-6 list-none">
              {leftovers.participants.map((player) => (
                <li key={player.id} className="text-gray-800">
                  {player.name}: {player.remainder}
                </li>
              ))}
            </ul>
          </>
        )}

        {leftovers.donatingButNotParticipating &&
          leftovers.donatingButNotParticipating.length > 0 && (
            <>
              <h3 className="text-md font-small text-gray-400 mt-4" dir="rtl">
                שחקנים שתורמים לשאריות אך לא משתתפים:
              </h3>
              <ul className=" pl-6 list-none">
                {leftovers.donatingButNotParticipating.map((player) => (
                  <li key={player.id} className="text-gray-500">
                    {player.name}: {player.donated}
                  </li>
                ))}
              </ul>
            </>
          )}
      </div>

      <button
        onClick={handleEndTable}
        className={`py-2 px-4 rounded-lg text-white transition ${
          totalChipsInInputs === totalChipsOnTable && allApproved
            ? "bg-blue-500 hover:bg-blue-600"
            : "bg-gray-400 cursor-not-allowed"
        }`}
        disabled={totalChipsInInputs !== totalChipsOnTable || !allApproved}
      >
        End Table
      </button>
    </div>
  );
};

export default Sumup;
