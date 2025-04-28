import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import PrevCurrInput from "@/components/PrevCurrInput";

const Sumup = () => {
  // const { tableId } = useParams();
  const { tableId, groupId } = useParams();
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
          `groups/${groupId}/tables/${tableId}/players`
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
        let takeFromLeftovers = 0;
        let joiningLeftovers = false;
        let originalChipsAmount = chips;
        let afterLeftoversChipsAmount = chips; // Default to original

        if (disabledInputs[player.id]) {
          if (remainder === 0) {
            donatedToLeftovers = 0;
            takeFromLeftovers = 0;
            joiningLeftovers = false;
          } else if (1 <= remainder && remainder <= 9) {
            donatedToLeftovers = remainder;
            takeFromLeftovers = 0;
            joiningLeftovers = false;
          } else if (10 <= remainder && remainder <= 40) {
            donatedToLeftovers = remainder;
            takeFromLeftovers = 0;
            joiningLeftovers = true;
            acc.participants.push({
              id: player.id,
              name: player.name,
              remainder,
            });
          } else if (41 <= remainder && remainder <= 49) {
            donatedToLeftovers = 0;
            takeFromLeftovers = 50 - remainder;
            joiningLeftovers = false;
            acc.takingFromLeftovers.push({
              id: player.id,
              name: player.name,
              taken: takeFromLeftovers,
            });
          }

          afterLeftoversChipsAmount =
            chips - donatedToLeftovers + takeFromLeftovers;
        }

        player.donatedToLeftovers = donatedToLeftovers;
        player.takeFromLeftovers = takeFromLeftovers;
        player.joiningLeftovers = joiningLeftovers;
        player.originalChipsAmount = originalChipsAmount;
        player.afterLeftoversChipsAmount = afterLeftoversChipsAmount;

        return acc;
      },
      {
        total: 0,
        participants: [],
        donatingButNotParticipating: [],
        takingFromLeftovers: [],
      }
    );

    // 🔥 Correct leftovers calculation: Sum donations & subtract takings
    const totalLeftovers = players.reduce(
      (sum, player) =>
        sum + player.donatedToLeftovers - player.takeFromLeftovers,
      0
    );

    setLeftovers({
      ...leftoverDetails,
      total: totalLeftovers, // ✅ Make sure this total is correctly calculated
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
      if (player.takeFromLeftovers) {
        finalTotalChips += player.takeFromLeftovers;
      }

      return {
        id: player.id,
        name: player.name,
        originalChipsAmount: player.originalChipsAmount, // Save the original amount before leftovers
        finalTotalChips,
        afterLeftoversChipsAmount: finalTotalChips, // Save the adjusted amount after leftovers
        isParticipatesLeftovers: player.joiningLeftovers, // Add participation status
      };
    });

    // Prepare Firebase update tasks for each player
    const batchUpdates = updatedPlayers.map(
      ({
        id,
        finalTotalChips,
        afterLeftoversChipsAmount,
        originalChipsAmount,
        isParticipatesLeftovers,
      }) => {
        const playerDocRef = doc(db, `tables/${tableId}/players`, id);
        return updateDoc(playerDocRef, {
          finalTotalChips,
          afterLeftoversChipsAmount,
          originalChipsAmount,
          isParticipatesLeftovers,
        });
      }
    );

    // Update leftovers total in the table document
    const tableDocRef = doc(db, `groups/${groupId}/tables/${tableId}`);
    const updateTableDoc = updateDoc(tableDocRef, {
      leftovers: totalLeftovers,
    });

    try {
      await Promise.all([...batchUpdates, updateTableDoc]);

      navigate(`/leftovers/group/${groupId}/table/${tableId}`);
    } catch (error) {
      console.error("Error updating players or table:", error);
      alert("An error occurred while finalizing the table.");
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">סיכום השולחן</h1>

      <div
        className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 rounded-lg"
        dir="rtl"
      >
        <h2 className="text-lg font-semibold">🔔 שימו לב!</h2>
        <p className="mt-1">
          יש להכניס את כמות הז'יטונים המדוייקת שיש לכל שחקן.
        </p>
        <p className="mt-1">
          המערכת תחשב עבור כל שחקן אם עליו לקחת מהשאריות, לתרום או לא לבצע
          שינוי.
        </p>
        <p className="mt-1 font-semibold">
          אין צורך לבצע חישובים בעצמכם – המערכת תעשה זאת באופן אוטומטי! ✅
        </p>
      </div>

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
              <span className="text-gray-600" dir="rtl">
                ז׳יטונים שנשארו:
              </span>

              {disabledInputs[player.id] &&
              player.originalChipsAmount !==
                player.afterLeftoversChipsAmount ? (
                <PrevCurrInput
                  finalAmount={player.afterLeftoversChipsAmount}
                  originalAmount={player.originalChipsAmount}
                />
              ) : (
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
              )}
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
                // ✅ Case 1: Participating in Leftovers
                <p className="text-green-600">
                  <span className="font-semibold">משתתף בשאריות </span>
                  <span className="ml-1 font-semibold text-green-800">
                    ותורם {player.donatedToLeftovers} ז'יטונים
                  </span>
                </p>
              ) : player.donatedToLeftovers > 0 ? (
                // ✅ Case 2: Donating to Leftovers but Not Participating
                <p className="text-yellow-600">
                  <span className="font-semibold">תורם </span>
                  <span className="ml-1 font-semibold text-yellow-800">
                    {player.donatedToLeftovers} ז'יטונים
                  </span>
                  <span className="ml-1">אך לא משתתף בשאריות</span>
                </p>
              ) : player.takeFromLeftovers > 0 ? (
                // ✅ Case 3: Taking from Leftovers but Not Participating
                <p className="text-blue-600">
                  <span className="font-semibold">לוקח מהשאריות </span>
                  <span className="ml-1 font-semibold text-blue-800">
                    {player.takeFromLeftovers} ז'יטונים
                  </span>
                  <span className="ml-1">ולא משתתף בשאריות</span>
                </p>
              ) : (
                // ✅ Case 4: Not Participating & Not Donating
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
              {", "}
              תקלה בספירת הז׳יטונים: נספרו יותר מדי ז׳יטונים
              {", "}
              מאזן הספירה:{" "}
              <span dir="ltr">
                {-1 * Math.abs(totalChipsOnTable - totalChipsInInputs)}
              </span>
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
        {/* {leftovers.participants && leftovers.participants.length > 0 && (
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
        )} */}

        {/* {leftovers.donatingButNotParticipating &&
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
          )} */}
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
        סגור שולחן
      </button>
    </div>
  );
};

export default Sumup;
