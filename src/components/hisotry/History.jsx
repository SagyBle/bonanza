import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase"; // Adjust the path to your firebase config
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import HistoryEntry from "./HistoryEntry";

const History = ({ tableId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const historyCollection = collection(db, "tables", tableId, "history");
    const orderedHistoryQuery = query(
      historyCollection,
      orderBy("timestamp", "desc") // Fetch in descending order (newest first)
    );

    const unsubscribe = onSnapshot(
      orderedHistoryQuery,
      (snapshot) => {
        const historyData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHistory(historyData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching history in real-time:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tableId]);

  if (loading) {
    return (
      <p className="text-center text-gray-500">טוען את היסטוריית השולחן...</p>
    );
  }

  if (history.length === 0) {
    return (
      <p className="text-center text-gray-500">
        אין היסטוריה זמינה עבור שולחן זה.
      </p>
    );
  }

  const displayedHistory = showAll ? history : history.slice(0, 8);

  return (
    <div className="p-4 relative">
      <h1 className="text-2xl font-bold text-center mb-4">היסטוריית השולחן</h1>
      <ul className="space-y-2 bg-white shadow-md p-4 rounded-lg relative overflow-hidden">
        {displayedHistory.map((entry) => (
          <HistoryEntry key={entry.id} entry={entry} />
        ))}
        {/* Visual indicator (faded effect) when more history exists */}
        {!showAll && history.length > 8 && (
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </ul>

      {/* Toggle button to show more/less history */}
      {history.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full text-center text-blue-600 font-semibold"
        >
          {showAll ? "הסתר היסטוריה" : "הצג את כל ההיסטוריה"}
        </button>
      )}
    </div>
  );
};

export default History;
