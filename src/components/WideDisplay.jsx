import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

export default function WideDisplay({ groupId, tableId, players, onClose }) {
  const [chipLeaderId, setChipLeaderId] = useState(null);

  useEffect(() => {
    if (!groupId || !tableId) return;

    // Subscribe to table data to track chip leader
    const tableRef = doc(db, "groups", groupId, "tables", tableId);
    const unsubscribeTable = onSnapshot(tableRef, (docSnap) => {
      const data = docSnap.data();
      setChipLeaderId(data?.chipLeader || null);
    });

    return () => {
      unsubscribeTable();
    };
  }, [groupId, tableId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative w-full h-full flex items-center justify-center bg-green-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-red-500 hover:bg-red-600 rounded-full p-2 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="w-[600px] h-[600px] rounded-full bg-green-700 relative">
          {players.map((player, index) => {
            const angle = (360 / players.length) * index;
            const rotation = `rotate(${angle}deg) translate(260px) rotate(-${angle}deg)`;

            return (
              <div
                key={player.id}
                className="absolute top-1/2 left-1/2 w-[120px] text-center p-2 rounded-xl transform"
                style={{
                  transform: rotation,
                  marginTop: "-60px",
                  marginLeft: "-60px",
                  backgroundColor:
                    player.id === chipLeaderId ? "gold" : "rgba(0,0,0,0.6)",
                  color: player.id === chipLeaderId ? "black" : "white",
                }}
              >
                {player.imageUrl && (
                  <img
                    src={player.imageUrl}
                    alt={player.name}
                    className="w-12 h-12 mx-auto rounded-full mb-1 object-cover border border-white"
                  />
                )}
                <div className="font-bold">{player.name}</div>
                <div>🎟️ {player.entries || 0}</div>
                {player.id === chipLeaderId && (
                  <div className="text-sm mt-1">🏆 Chip Leader</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
