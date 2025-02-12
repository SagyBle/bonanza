import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const AddGeneralPlayer = () => {
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const generalPlayersCollection = collection(db, "generalPlayers");
      await addDoc(generalPlayersCollection, {
        name: playerName,
        phoneNumber: playerPhone,
        createdAt: new Date().toISOString(),
      });

      alert("Player added successfully!");
      setPlayerName("");
      setPlayerPhone("");
    } catch (error) {
      console.error("Error adding player:", error);
      alert("Failed to add the player. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        borderRadius: "8px",
        backgroundColor: "#e7f1ff", // Light blue background for consistency
        boxShadow: "0 4px 12px rgba(0, 123, 255, 0.2)", // Soft shadow effect
        marginTop: "20px",
        maxWidth: "800px",
        margin: "0 auto", // Center align like TablesManager
        border: "2px solid #007BFF", // Consistent border style
      }}
    >
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#007BFF",
          marginBottom: "20px",
        }}
      >
        הוסף שחקן כללי
      </h2>
      <form
        onSubmit={handleAddPlayer}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <label
          htmlFor="playerName"
          dir="rtl"
          style={{
            marginBottom: "5px",
            fontSize: "16px",
            color: "#333",
            fontWeight: "bold",
          }}
        >
          שם שחקן:
        </label>
        <input
          id="playerName"
          type="text"
          placeholder="הזן שם שחקן"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          required
          dir="rtl"
          style={{
            marginBottom: "15px",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
        />

        <label
          htmlFor="playerPhone"
          dir="rtl"
          style={{
            marginBottom: "5px",
            fontSize: "16px",
            color: "#333",
            fontWeight: "bold",
          }}
        >
          מספר טלפון:
        </label>
        <input
          id="playerPhone"
          type="tel"
          placeholder="הזן מספר טלפון"
          value={playerPhone}
          onChange={(e) => setPlayerPhone(e.target.value)}
          required
          dir="rtl"
          style={{
            marginBottom: "20px",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
        />

        <button
          type="submit"
          disabled={isAdding}
          style={{
            padding: "10px 20px",
            backgroundColor: isAdding ? "#ccc" : "#007BFF",
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            borderRadius: "4px",
            cursor: isAdding ? "not-allowed" : "pointer",
            transition: "background-color 0.3s",
          }}
        >
          {isAdding ? "מוסיף..." : "הוסף שחקן"}
        </button>
      </form>
    </div>
  );
};

export default AddGeneralPlayer;
