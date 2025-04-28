import React, { useEffect, useState } from "react";
import {
  getDocs,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate, useParams } from "react-router-dom";
import TableCreated from "../components/TableCreated";

const UnionsManager = () => {
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [unions, setUnions] = useState([]);
  const [unionTitle, setUnionTitle] = useState("");
  const navigate = useNavigate();

  const { groupId } = useParams(); // תוודא שיש לך את זה בראש הקובץ

  // Fetch tables from Firestore
  useEffect(() => {
    const fetchTables = async () => {
      try {
        // const querySnapshot = await getDocs(collection(db, "tables"));
        const querySnapshot = await getDocs(
          collection(db, `groups/${groupId}/tables`)
        );
        const tablesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort tables by creation date (most recent first)
        tablesData.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setTables(tablesData);
      } catch (error) {
        console.error("Error fetching tables: ", error);
      }
    };

    fetchTables();
  }, []);

  // Fetch unions from Firestore
  useEffect(() => {
    const fetchUnions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "unions"));
        const unionsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort unions by creation date (most recent first)
        unionsData.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setUnions(unionsData);
      } catch (error) {
        console.error("Error fetching unions: ", error);
      }
    };

    fetchUnions();
  }, []);

  // Toggle the selection of a table
  const toggleTableSelection = (tableId) => {
    setSelectedTables((prevSelected) => {
      if (prevSelected.includes(tableId)) {
        return prevSelected.filter((id) => id !== tableId);
      } else {
        return [...prevSelected, tableId];
      }
    });
  };

  // Handle uniting the selected tables
  const handleUniteTables = async () => {
    // Make sure at least two tables are selected and a union title is provided
    if (selectedTables.length < 2 || unionTitle.trim() === "") return;

    const unionData = {
      title: unionTitle,
      tables: selectedTables, // Array of table IDs
      createdAt: serverTimestamp(),
      groupId: groupId, // 🛑 חשוב מאוד - חובה לשמור לאיזה group שייך האיחוד
    };

    try {
      const unionDocRef = await addDoc(collection(db, "unions"), unionData);
      console.log("Union created successfully:", unionData);
      // Clear the selection and union title after successful creation
      setSelectedTables([]);
      setUnionTitle("");
      // Navigate to the new union's page
      navigate(`/union/${unionDocRef.id}`);
    } catch (error) {
      console.error("Error creating union:", error);
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-6" dir="rtl">
        איחוד שולחנות
      </h1>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4" dir="rtl">
          איחודים קיימים
        </h2>
        {unions.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4">
            {unions.map((union) => (
              <li
                key={union.id}
                onClick={() => navigate(`/union/${union.id}`)}
                className="p-4 border rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition"
                dir="rtl"
              >
                <div className="flex flex-col">
                  {/* Display the union title (i.e. union name) */}
                  <span className="font-bold">{union.title}</span>
                  {/* Show the union id in small text */}
                  <span className="text-xs text-gray-500">
                    איחוד: {union.id}
                  </span>
                  {/* Show creation date */}
                  <span className="text-sm text-gray-600">
                    <TableCreated createdAt={union.createdAt.toDate()} />
                  </span>
                  {/* Show united table names joined by a hyphen */}
                  <span className="text-sm text-gray-700 mt-2">
                    {union.tables
                      .map((tableId) => {
                        const tableDetail = tables.find(
                          (table) => table.id === tableId
                        );
                        return tableDetail ? tableDetail.title : tableId;
                      })
                      .join(" - ")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600" dir="rtl">
            אין איחודים קיימים.
          </p>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-4 mt-8" dir="rtl">
        יצירת איחוד חדש
      </h2>

      {tables.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {tables.map((table) => (
            <li
              key={table.id}
              onClick={() => toggleTableSelection(table.id)}
              dir="rtl"
              className={`p-4 border rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition ${
                selectedTables.includes(table.id)
                  ? "bg-blue-100 border-blue-500"
                  : "bg-white border-gray-300"
              }`}
            >
              <div className="flex flex-col">
                <span className="font-bold text-lg">{table.title}</span>
                <span className="text-sm text-gray-600">
                  <TableCreated createdAt={table.createdAt} />
                </span>
                <span className="text-xs text-gray-500">{table.id}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600" dir="rtl">
          אין שולחנות זמינים.
        </p>
      )}

      {/* Show union name input if at least two tables are selected */}
      {selectedTables.length >= 2 && (
        <div className="flex flex-col items-center mb-4">
          <input
            type="text"
            value={unionTitle}
            onChange={(e) => setUnionTitle(e.target.value)}
            placeholder="הכנס שם לאיחוד (למשל: רווקים לקורן או וילה בדרום)"
            className="w-full max-w-md p-2 border border-gray-300 rounded mb-2"
            dir="rtl"
          />
        </div>
      )}

      <div className="flex justify-center mb-8">
        <button
          onClick={handleUniteTables}
          disabled={selectedTables.length < 2 || unionTitle.trim() === ""}
          className={`py-2 px-4 rounded-lg text-white transition ${
            selectedTables.length < 2 || unionTitle.trim() === ""
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          dir="rtl"
        >
          איחוד שולחנות
        </button>
      </div>
    </div>
  );
};

export default UnionsManager;
