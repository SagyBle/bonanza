import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase"; // Adjust the path to your firebase config
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import HistoryEntry from "./HistoryEntry";

const History = ({ tableId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const historyCollection = collection(db, "tables", tableId, "history");
    const orderedHistoryQuery = query(
      historyCollection,
      orderBy("timestamp", "asc")
    );

    // Set up a real-time listener
    const unsubscribe = onSnapshot(
      orderedHistoryQuery,
      (snapshot) => {
        const historyData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHistory(historyData);
        setLoading(false); // Stop loading once the first update is received
      },
      (error) => {
        console.error("Error fetching history in real-time:", error);
        setLoading(false);
      }
    );

    // Clean up the listener on component unmount
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-4">היסטוריית השולחן</h1>
      <ul className="space-y-2 bg-white shadow-md p-4 rounded-lg">
        {history.map((entry) => (
          <HistoryEntry key={entry.id} entry={entry} />
        ))}
      </ul>
    </div>
  );
};

export default History;
