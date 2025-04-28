import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

const Leftovers = ({ groupId, isManagerMode }) => {
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [leftoversAmount, setLeftoversAmount] = useState(0);
  const [showMessage, setShowMessage] = useState("");
  const [popup, setPopup] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    const fetchPlayersAndLeftovers = async () => {
      try {
        // Fetch players who participate in leftovers
        const playersCollectionRef = collection(
          db,
          `groups/${groupId}/tables/${tableId}/players`
        );
        const playersSnapshot = await getDocs(playersCollectionRef);
        const playersData = playersSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((player) => player.isParticipatesLeftovers);

        // Fetch leftovers amount from the table doc
        const tableDocRef = doc(db, `groups/${groupId}/tables/${tableId}`);
        const tableSnapshot = await getDoc(tableDocRef);
        const leftoversData = tableSnapshot.data()?.leftovers || 0;

        setPlayers(playersData);
        setLeftoversAmount(leftoversData);

        // Show message if no players or no leftovers exist
        if (playersData.length === 0 && leftoversData === 0) {
          setShowMessage(
            "אין משתתפים לשאריות ואין שאריות לחלק, עוברים לספליט..."
          );
        } else if (playersData.length === 0) {
          setShowMessage(
            "אין משתתפים לשאריות, השולחן מועבר אוטומטית לחישוב ספליט..."
          );
        } else if (leftoversData === 0) {
          setShowMessage(
            "אין שאריות לחלק, השולחן מועבר אוטומטית לחישוב ספליט..."
          );
        }

        if (playersData.length === 0 || leftoversData === 0) {
          setTimeout(() => {
            // navigate(`/split/${tableId}`);
            navigate(`/split/group/${groupId}/table/${tableId}`);
          }, 2500); // Redirect after 2.5 seconds
        }
      } catch (error) {
        console.error("Error fetching players or leftovers:", error);
      }
    };

    fetchPlayersAndLeftovers();
  }, [tableId, navigate]);

  const handleSubmit = async () => {
    if (!selectedPlayerId) {
      setPopup({
        show: true,
        message: "יש לבחור שחקן לפני שממשיכים!",
        type: "error",
      });
      return;
    }

    try {
      // Update the selected player
      const playerDocRef = doc(
        db,
        `groups/${groupId}/tables/${tableId}/players`,
        selectedPlayerId
      );
      const selectedPlayer = players.find(
        (player) => player.id === selectedPlayerId
      );
      const updatedTotalChips =
        (selectedPlayer.finalTotalChips || 0) + leftoversAmount;

      await updateDoc(playerDocRef, {
        isWinnerOfLeftovers: true,
        finalTotalChips: updatedTotalChips,
      });

      setPopup({
        show: true,
        message: `השאריות הועברו לשחקן: ${selectedPlayer.name} (₪${leftoversAmount})!`,
        type: "success",
      });

      // Wait 2 seconds before redirecting
      setTimeout(() => {
        // navigate(`/split/${tableId}`);
        navigate(`/split/group/${groupId}/table/${tableId}`);
      }, 2000);
    } catch (error) {
      console.error("Error updating player:", error);
      setPopup({
        show: true,
        message: "אירעה שגיאה בעת עדכון נתוני השחקן.",
        type: "error",
      });
    }
  };

  if (showMessage) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h2 className="text-xl font-semibold text-gray-700" dir="rtl">
          {showMessage}
        </h2>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-6" dir="rtl">
        שאריות השולחן
      </h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold" dir="rtl">
          סכום שאריות: ₪{leftoversAmount}
        </h2>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium" dir="rtl">
          בחר את השחקן שזכה בשאריות:
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <li
              key={player.id}
              className={`p-4 border rounded-lg shadow-sm cursor-pointer ${
                selectedPlayerId === player.id
                  ? "bg-blue-100 border-blue-500"
                  : "bg-white border-gray-300"
              }`}
              onClick={() => setSelectedPlayerId(player.id)}
            >
              <h4 className="text-lg font-semibold" dir="rtl">
                {player.name}
              </h4>
              <p className="text-gray-700" dir="rtl">
                ז׳יטונים סופיים: {player.finalTotalChips || 0}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSubmit}
          disabled={!selectedPlayerId}
          className={`py-2 px-4 rounded-lg text-white transition ${
            selectedPlayerId
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          סיים ועבור לספליט
        </button>
      </div>

      {/* Popup Modal */}
      {popup.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            <h3
              className={`text-xl font-semibold ${
                popup.type === "success" ? "text-green-500" : "text-red-500"
              }`}
            >
              {popup.type === "success" ? "✅ הצלחה" : "❌ שגיאה"}
            </h3>
            <p className="text-gray-700 mt-2">{popup.message}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={() => setPopup({ show: false, message: "", type: "" })}
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leftovers;
