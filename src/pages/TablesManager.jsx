import React, { useEffect, useState } from "react";
import CreateATable from "./CreateATable";
import { getDocs, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate, useParams } from "react-router-dom";
import TableCreated from "../components/TableCreated";
import AddGeneralPlayer from "../components/AddGeneralPlayer";
import tableIcon from "../assets/icons/table.svg";
import sheepIcon from "../assets/icons/sheep.svg";
import AddFoodExpenses from "../components/AddFoodExpenses";
import { migrateToGroup } from "@/utils/migrations.utils";

const TablesManager = ({ isManagerMode }) => {
  const { groupId } = useParams();
  const [tables, setTables] = useState([]);
  const [activeTable, setActiveTable] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null); // Track which table to delete
  const [showAddGeneralPlayer, setShowAddGeneralPlayer] = useState(false);
  const navigate = useNavigate();

  const tablesCollection = collection(db, `groups/${groupId}/tables`);

  useEffect(() => {
    const getTables = async () => {
      try {
        const data = await getDocs(tablesCollection);
        const mappedData = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        // Sort tables by creation date, most recent first
        mappedData.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Set the active table (most recent one created within today or yesterday)
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const recentTable = mappedData.find((table) => {
          const tableCreatedDate = new Date(table.createdAt);
          return (
            tableCreatedDate.toDateString() === today.toDateString() ||
            tableCreatedDate.toDateString() === yesterday.toDateString()
          );
        });

        setActiveTable(recentTable);

        // Remove active table from the previous tables list
        const previousTables = mappedData.filter(
          (table) => table.id !== recentTable?.id
        );

        setTables(previousTables); // Set previous tables excluding the active one
      } catch (error) {
        console.log(error);
      }
    };

    getTables();
  }, []);

  const handleTableClick = (tableId) => {
    navigate(`/group/${groupId}/table/${tableId}`);
  };

  const toggleCreateForm = () => {
    setShowCreateForm((prev) => !prev);
  };
  const toggleAddGeneralPlayer = () => {
    setShowAddGeneralPlayer((prev) => !prev);
  };

  // const deleteTable = async () => {
  //   try {
  //     if (!tableToDelete) return;

  //     await deleteDoc(doc(db, "tables", tableToDelete));
  //     setTables((prevTables) =>
  //       prevTables.filter((table) => table.id !== tableToDelete)
  //     );
  //     if (activeTable?.id === tableToDelete) {
  //       setActiveTable(null);
  //     }
  //     setShowConfirmDelete(false);
  //   } catch (error) {
  //     console.error("Error deleting table:", error);
  //   }
  // };

  const deleteTable = async () => {
    try {
      if (!tableToDelete) return;

      // const tableRef = doc(db, "tables", tableToDelete);
      const tableRef = doc(db, `groups/${groupId}/tables`, tableToDelete);

      // Step 1: Delete players subcollection
      const playersSnapshot = await getDocs(collection(tableRef, "players"));
      const playerDeletes = playersSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      // Step 2: Delete history subcollection
      const historySnapshot = await getDocs(collection(tableRef, "history"));
      const historyDeletes = historySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      // Wait for all deletes to complete
      await Promise.all([...playerDeletes, ...historyDeletes]);

      // Step 3: Delete the table document itself
      await deleteDoc(tableRef);

      // Step 4: Update local state
      setTables((prevTables) =>
        prevTables.filter((table) => table.id !== tableToDelete)
      );

      if (activeTable?.id === tableToDelete) {
        setActiveTable(null);
      }

      setShowConfirmDelete(false);
    } catch (error) {
      console.error("Error deleting table and subcollections:", error);
    }
  };

  const handleDeleteClick = (tableId) => {
    setTableToDelete(tableId);
    setShowConfirmDelete(true);
  };

  const handleNetlifyFunction = async () => {
    try {
      const response = await fetch(
        "/.netlify/functions/cloudinary?search=searchthisplease"
      );
      const data = await response.json();
      console.log("Response from Netlify function:", data);
      alert("Response: " + JSON.stringify(data));
    } catch (error) {
      console.error("Error calling Netlify function:", error);
      alert("Error calling Netlify function.");
    }
  };

  const handleNetlifyPost = async () => {
    try {
      const response = await fetch("/.netlify/functions/cloudinary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search: "searchthisplease",
          userId: "12345",
        }),
      });

      const data = await response.json();
      console.log("Response from cloudinarypost:", data);
      alert("Response: " + JSON.stringify(data));
    } catch (error) {
      console.error("Error calling cloudinarypost function:", error);
      alert("Error calling cloudinarypost function.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div
        className="flex flex-col items-center gap-4"
        style={{ marginTop: "40px" }}
      >
        {!showCreateForm && (
          <button
            onClick={toggleCreateForm}
            className="flex items-center gap-2 px-4  bg-blue-500 text-white rounded-md hover:opacity-80 shadow-md"
          >
            <img className="w-16 h-14" alt="table" src={tableIcon} />
            צור שולחן חדש
          </button>
        )}

        {!showAddGeneralPlayer && (
          <button
            onClick={toggleAddGeneralPlayer}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:opacity-80 shadow-md"
          >
            <img src={sheepIcon} alt="sheep" className="w-10 h-10" />
            הוסף שחקן כללי
          </button>
        )}
      </div>

      <div style={{ marginTop: "20px" }} className="flex flex-col gap-8 ">
        {showCreateForm && <CreateATable groupId={groupId} />}
        {showAddGeneralPlayer && <AddGeneralPlayer groupId={groupId} />}
      </div>

      <div style={{ marginBottom: "40px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "20px",
            marginTop: "20px",
          }}
        >
          שולחן פעיל
        </h1>
        {activeTable ? (
          <div
            onClick={() => handleTableClick(activeTable.id)}
            style={{
              padding: "20px",
              border: "2px solid #007BFF",
              borderRadius: "8px",
              cursor: "pointer",
              marginBottom: "10px",
              backgroundColor: "#e7f1ff", // Light blue background for active table
              boxShadow: "0 4px 12px rgba(0, 123, 255, 0.2)", // Soft shadow effect
            }}
          >
            <h3
              style={{ fontSize: "20px", fontWeight: "bold", color: "#007BFF" }}
            >
              {activeTable.title}
            </h3>
            <p dir="rtl" style={{ margin: "10px 0", color: "#555" }}>
              {activeTable.description}
            </p>
            <TableCreated
              createdAt={new Date(activeTable.createdAt).toLocaleString()}
            />
            {isManagerMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(activeTable.id);
                }}
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                מחק שולחן
              </button>
            )}
          </div>
        ) : (
          <p style={{ color: "#999" }}>אין שולחנות פעילים כרגע</p>
        )}
      </div>

      <div>
        <h1
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}
        >
          שולחנות קודמים
        </h1>
        <ul style={{ listStyle: "none", padding: "0" }}>
          {tables.map((table) => (
            <li
              key={table.id}
              onClick={() => handleTableClick(table.id)}
              style={{
                padding: "20px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              <h4 style={{ fontSize: "18px", fontWeight: "bold" }}>
                {table.title}
              </h4>
              <p dir="rtl" style={{ margin: "10px 0", color: "#555" }}>
                {table.description}
              </p>
              <TableCreated
                createdAt={new Date(table.createdAt).toLocaleString()}
              />
              {isManagerMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(table.id);
                  }}
                  style={{
                    marginTop: "10px",
                    padding: "8px 16px",
                    backgroundColor: "red",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  מחק שולחן
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              maxWidth: "400px",
              width: "100%",
            }}
          >
            <h3 style={{ marginBottom: "20px" }}>
              בטוח שאתה רוצה למחוק את השולחן הזה?
            </h3>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => setShowConfirmDelete(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ccc",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ביטול
              </button>
              <button
                onClick={deleteTable}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "red",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                כן, למחוק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesManager;
