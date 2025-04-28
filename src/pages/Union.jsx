import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { minimalSettlement } from "../utils/balance.utils";
import whatsappIcon from "../assets/icons/whatsapp.svg";

const Union = ({ isManagerMode }) => {
  const { unionId } = useParams();
  const [unionData, setUnionData] = useState(null);
  const [tablesData, setTablesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTables, setExpandedTables] = useState({}); // Tracks expanded state per table
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchUnionAndTables = async () => {
      try {
        // Fetch the union document
        const unionDocRef = doc(db, "unions", unionId);
        const unionSnap = await getDoc(unionDocRef);
        if (!unionSnap.exists()) {
          console.error("Union not found");
          setLoading(false);
          return;
        }
        const union = { id: unionSnap.id, ...unionSnap.data() };
        setUnionData(union);

        // For each table ID in the union, fetch the table document and its players
        const tableIds = union.tables || [];
        const fetchedTables = [];
        for (const tableId of tableIds) {
          // const tableDocRef = doc(db, "tables", tableId);
          const tableDocRef = doc(
            db,
            `groups/${union.groupId}/tables`,
            tableId
          );
          const tableSnap = await getDoc(tableDocRef);
          if (tableSnap.exists()) {
            const table = { id: tableSnap.id, ...tableSnap.data() };
            // Fetch players from the table's "players" subcollection
            const playersQuerySnapshot = await getDocs(
              // collection(db, "tables", tableId, "players")
              collection(
                db,
                `groups/${union.groupId}/tables/${tableId}/players`
              )
            );
            const players = playersQuerySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            table.players = players;
            fetchedTables.push(table);
          }
        }
        setTablesData(fetchedTables);
      } catch (error) {
        console.error("Error fetching union and tables: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnionAndTables();
  }, [unionId]);

  // Calculate per‑player summary across all tables in the union.
  const playerSummary = {};
  tablesData.forEach((table) => {
    (table.players || []).forEach((player) => {
      if (playerSummary[player.id]) {
        playerSummary[player.id].finalTotalChips += player.finalTotalChips || 0;
        playerSummary[player.id].entries += player.entries || 0;
      } else {
        playerSummary[player.id] = {
          name: player.name,
          finalTotalChips: player.finalTotalChips || 0,
          entries: player.entries || 0,
        };
      }
    });
  });

  // Helper to get player details based on the aggregated summary
  const getPlayerDetails = (playerId) => {
    const player = playerSummary[playerId];
    return player
      ? { name: player.name, id: playerId }
      : { name: "Unknown", id: playerId };
  };

  // Calculate transactions using the minimalSettlement function and save finalSettlement to the union document
  const calculateSplit = async () => {
    // Convert playerSummary into an array of player objects with renamed properties
    const playersArray = Object.entries(playerSummary).map(([id, data]) => ({
      user: id,
      buy_ins: data.entries,
      final_value: data.finalTotalChips,
    }));

    const txs = minimalSettlement(playersArray);
    const formattedTransactions = txs.map(([debtor, creditor, amt]) => ({
      debtor: getPlayerDetails(debtor),
      creditor: getPlayerDetails(creditor),
      amount: amt / 2, // adjust division if needed
    }));

    // Save the computed transactions to the union document as finalSettlement
    try {
      await updateDoc(doc(db, "unions", unionId), {
        finalSettlement: formattedTransactions,
      });
      console.log(
        "Final settlement saved successfully:",
        formattedTransactions
      );
    } catch (error) {
      console.error("Error saving final settlement:", error);
    }
    console.log("this is transactions:", { formattedTransactions });

    setTransactions(formattedTransactions);
  };

  // Toggle the expansion of a table's details
  const toggleExpand = (tableId) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableId]: !prev[tableId],
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-lg" dir="rtl">
        טוען...
      </div>
    );
  }

  if (!unionData) {
    return (
      <div className="text-center py-10 text-lg" dir="rtl">
        לא נמצא איחוד.
      </div>
    );
  }

  const sendToWhatsApp = () => {
    let finalTransactions;
    if (transactions.length > 0) {
      finalTransactions = transactions;
    } else if (
      unionData.finalSettlement &&
      unionData.finalSettlement.length > 0
    ) {
      finalTransactions = unionData.finalSettlement;
    } else {
      alert("אין חישובים לשליחה!");
      return;
    }

    const message = finalTransactions
      .map(
        (tx) => `${tx.debtor.name} מעביר ל${tx.creditor.name} ${tx.amount} ש״ח`
      )
      .join("\n");

    const footer = "\n\nנוצר ע״י bonanzApp";
    const linkToTable = `\nhttps://bonanzapp.netlify.app/union/${unionId}`;

    // Encode the entire message only once
    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(
      message + footer + linkToTable
    )}`;

    window.open(whatsappURL, "_self");
  };

  // Use finalSettlement from unionData if transactions state is empty.
  const finalTransactions =
    transactions.length > 0 ? transactions : unionData.finalSettlement || [];

  return (
    <div className="max-w-5xl mx-auto p-6" dir="rtl">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-center">
          {unionData.title || `איחוד ${unionData.id}`}
        </h1>
      </header>

      {/* Overall Summary Section */}
      <section className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-center">סיכום משתתפים</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-md p-4">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="bg-blue-100">
                <th className="w-1/3 px-4 py-2 text-center">שם</th>
                <th className="w-1/3 px-4 py-2 text-center">כניסות</th>
                <th className="w-1/3 px-4 py-2 text-center">צ'יפים סה"כ</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(playerSummary).map((player) => (
                <tr key={player.name} className="border-t">
                  <td className="px-4 py-2 font-medium">{player.name}</td>
                  <td className="px-4 py-2 text-center">{player.entries}</td>
                  <td className="px-4 py-2 text-center">
                    {player.finalTotalChips}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Split Calculation Button */}
      <div className="flex justify-center my-6">
        <button
          onClick={calculateSplit}
          className="py-2 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
          dir="rtl"
        >
          {unionData.finalSettlement ? "חשב העברות שוב" : "חשב העברות"}
        </button>
      </div>
      {/* {transactions && transactions.length > 0 && ( */}
      {
        <div className="flex justify-center mt-8">
          <button
            onClick={sendToWhatsApp}
            className="flex items-center bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition duration-200"
            dir="rtl"
          >
            <span>שלח כהודעה בwhatsapp</span>
            <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5 mr-2" />
          </button>
        </div>
      }

      {/* Transactions Section */}
      {finalTransactions.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-center" dir="rtl">
            תוצאות העברות
          </h2>
          <ul className="space-y-4">
            {finalTransactions.map((tx, index) => (
              <li
                key={index}
                className="p-4 border rounded-lg shadow-sm bg-white"
                dir="rtl"
              >
                <p className="text-gray-700">
                  <span className="font-bold">{tx.debtor.name}</span>מעביר ל
                  <span className="font-bold"> {tx.creditor.name} </span>
                  {tx.amount} ש"ח
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tables Section */}
      <section className="grid gap-6">
        {tablesData.map((table) => (
          <div
            key={table.id}
            onClick={() => toggleExpand(table.id)}
            className={`group bg-gray-200 shadow-md rounded-lg p-6 border border-gray-200 cursor-pointer transition ${
              expandedTables[table.id]
                ? "opacity-100"
                : "opacity-40 hover:opacity-100"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{table.title}</h2>
              <div className="text-2xl opacity-0 group-hover:opacity-100 transition">
                {expandedTables[table.id] ? "▲" : "▼"}
              </div>
            </div>
            {expandedTables[table.id] ? (
              table.players && table.players.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-fixed text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="w-1/3 px-4 py-2 text-center">שם שחקן</th>
                        <th className="w-1/3 px-4 py-2 text-center">כניסות</th>
                        <th className="w-1/3 px-4 py-2 text-center">צ'יפים</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.players.map((player) => (
                        <tr key={player.id} className="border-t">
                          <td className="px-4 py-2 font-medium">
                            {player.name}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {player.entries || 0}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {player.finalTotalChips || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">אין משתתפים</p>
              )
            ) : (
              <p className="text-gray-500 text-center">לחץ להרחבת פרטים</p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};

export default Union;
