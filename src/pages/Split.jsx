import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { minimalSettlement } from "../utils/balance.utils";
import whatsappIcon from "../assets/icons/whatsapp.svg";
import Paybox from "../components/Paybox";
import AddFoodExpenses from "@/components/AddFoodExpenses";
import { generalMinimalSettlement } from "@/utils/generalBalance.utils";

const Split = ({ isManagerMode }) => {
  const { tableId } = useParams();
  const [players, setPlayers] = useState([]);
  const [generalPlayers, setGeneralPlayers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [foodTransactions, setFoodTransactions] = useState([]);

  useEffect(() => {
    const fetchTableAndPlayers = async () => {
      try {
        const tableDocSnap = await getDoc(doc(db, "tables", tableId));
        if (tableDocSnap.exists()) {
          const tableData = tableDocSnap.data();
          if (tableData.pokerSettlement?.length > 0) {
            setTransactions(tableData.pokerSettlement);
          }
          if (tableData.foodSettlement?.length > 0) {
            setFoodTransactions(tableData.foodSettlement);
          }
        }

        const playersCollectionRef = collection(
          db,
          `tables/${tableId}/players`
        );
        const playersSnapshot = await getDocs(playersCollectionRef);
        const playersData = playersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlayers(playersData);
      } catch (error) {
        console.error("Error fetching players or table:", error);
      }
    };

    fetchTableAndPlayers();
  }, [tableId]);

  useEffect(() => {
    const fetchGeneralPlayers = async () => {
      try {
        const playerIds = players.map((player) => player.id);
        if (playerIds.length === 0) {
          setGeneralPlayers([]);
          return;
        }

        const generalPlayersQuery = query(
          collection(db, "generalPlayers"),
          where("__name__", "in", playerIds)
        );
        const querySnapshot = await getDocs(generalPlayersQuery);
        const fetchedPlayers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGeneralPlayers(fetchedPlayers);
      } catch (error) {
        console.error("Error fetching general players:", error);
      }
    };

    fetchGeneralPlayers();
  }, [players]);

  const getPlayerDetails = (playerId) => {
    const player = generalPlayers.find((gp) => gp.id === playerId);
    return player
      ? { name: player.name, id: player.id, phoneNumber: player.phoneNumber }
      : { name: "Unknown", id: playerId, phoneNumber: "N/A" };
  };

  const calculateSplit = async () => {
    const playerObjects = players.map((player) => ({
      user: player.id,
      buy_ins: player.entries,
      final_value: player.finalTotalChips,
    }));

    const txs = minimalSettlement(playerObjects);

    const formattedTransactions = txs.map(([debtor, creditor, amt]) => ({
      debtor: getPlayerDetails(debtor),
      creditor: getPlayerDetails(creditor),
      amount: amt / 2,
    }));

    setTransactions(formattedTransactions);

    try {
      await updateDoc(doc(db, "tables", tableId), {
        pokerSettlement: formattedTransactions,
      });
      console.log("Poker settlement saved successfully.");
    } catch (error) {
      console.error("Error saving poker settlement:", error);
    }
  };

  const calculateFoodSplit = async () => {
    try {
      console.log("🔄 Starting food split calculation...");

      const foodExpensesRef = collection(db, `tables/${tableId}/foodExpenses`);
      const foodExpensesSnapshot = await getDocs(foodExpensesRef);
      const foodExpenses = foodExpensesSnapshot.docs.map((doc) => doc.data());

      console.log("📦 Fetched food expenses from Firestore:", foodExpenses);

      if (foodExpenses.length === 0) {
        alert("אין חישובי אוכל לבצע.");
        return;
      }

      const balance = {};

      foodExpenses.forEach((expense, index) => {
        const { totalPayer, totalAmount, subOrders } = expense;

        console.log(`➡️ Expense #${index + 1}:`, expense);

        if (!balance[totalPayer]) balance[totalPayer] = { paid: 0, due: 0 };
        balance[totalPayer].paid += totalAmount;

        subOrders.forEach(({ playerId, amount }) => {
          if (!balance[playerId]) balance[playerId] = { paid: 0, due: 0 };
          balance[playerId].due += amount;
        });
      });

      console.log("📊 Calculated balance map:", balance);

      const playersArray = Object.entries(balance).map(
        ([playerId, { paid, due }]) => ({
          user: playerId,
          amountPaid: due,
          amountDue: paid,
        })
      );

      console.log("👥 Players array for minimalSettlement:", playersArray);

      const txs = generalMinimalSettlement(playersArray);

      console.log("✅ Transactions returned from minimalSettlement:", txs);

      const formattedFoodTransactions = txs.map(([debtor, creditor, amt]) => ({
        debtor: getPlayerDetails(debtor),
        creditor: getPlayerDetails(creditor),
        amount: amt,
      }));

      console.log("📤 Formatted food transactions:", formattedFoodTransactions);

      setFoodTransactions(formattedFoodTransactions);

      await updateDoc(doc(db, "tables", tableId), {
        foodSettlement: formattedFoodTransactions,
      });

      console.log("📦 Food settlement saved to Firestore.");
    } catch (error) {
      console.error("❌ Error calculating food split:", error);
    }
  };

  const sendToWhatsApp = () => {
    if (transactions.length === 0) {
      alert("אין חישובים לשליחה!");
      return;
    }

    const message = transactions
      .map(
        (tx) => `${tx.debtor.name} מעביר ל${tx.creditor.name} ${tx.amount} ש״ח`
      )
      .join("\n");

    const footer = "\n\nנוצר ע״י bonanzApp";
    const link = `\nhttps://bonanzapp.netlify.app/table/${tableId}`;

    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(
      message + footer + link
    )}`;
    window.open(whatsappURL, "_self");
  };

  const sendFoodToWhatsApp = () => {
    if (foodTransactions.length === 0) {
      alert("אין חישובי אוכל לשליחה!");
      return;
    }

    const message = foodTransactions
      .map(
        (tx) =>
          `${tx.debtor.name} מעביר ל${tx.creditor.name} ${tx.amount} ש״ח עבור אוכל`
      )
      .join("\n");

    const footer = "\n\nנוצר ע״י bonanzApp";
    const link = `\nhttps://bonanzapp.netlify.app/table/${tableId}`;

    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(
      message + footer + link
    )}`;
    window.open(whatsappURL, "_self");
  };

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-6" dir="rtl">
        חישוב העברות
      </h1>

      <AddFoodExpenses tableId={tableId} isManagerMode={isManagerMode} />

      <div className="mb-6">
        <h2 className="text-xl font-semibold" dir="rtl">
          רשימת שחקנים:
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <li
              key={player.id}
              className="p-4 border rounded-lg shadow-sm bg-white border-gray-300"
            >
              <h4 className="text-lg font-semibold" dir="rtl">
                {player.name}
              </h4>
              <p className="text-gray-700" dir="rtl">
                כניסות: {player.entries}
              </p>
              <p className="text-gray-700" dir="rtl">
                ז׳יטונים סופיים: {player.finalTotalChips || 0}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-center mt-6 gap-4 flex-wrap">
        <button
          onClick={calculateSplit}
          className="py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition"
        >
          חשב העברות
        </button>

        <button
          onClick={calculateFoodSplit}
          className="py-2 px-4 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition"
        >
          חשב העברות אוכל
        </button>

        {transactions.length > 0 && (
          <button
            onClick={sendToWhatsApp}
            className="flex items-center bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition duration-200"
            dir="rtl"
          >
            <span>שלח כהודעה בwhatsapp</span>
            <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5 mr-2" />
          </button>
        )}

        {foodTransactions.length > 0 && (
          <button
            onClick={sendFoodToWhatsApp}
            className="flex items-center bg-green-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition duration-200"
            dir="rtl"
          >
            <span>שלח הוצאות אוכל כהודעה בwhatsapp</span>
            <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5 mr-2" />
          </button>
        )}
      </div>

      {transactions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4" dir="rtl">
            תוצאות החישוב:
          </h2>
          <ul className="space-y-4">
            {transactions.map((tx, index) => (
              <li
                key={index}
                className="p-4 border rounded-lg shadow-sm bg-white border-gray-300"
                dir="rtl"
              >
                <p className="text-gray-700">
                  <span className="font-bold">{tx.debtor.name}</span> משלם ל
                  <span className="font-bold">{tx.creditor.name}</span>{" "}
                  <span className="font-bold">{tx.amount} ש״ח</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {foodTransactions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4" dir="rtl">
            תוצאות חישוב אוכל:
          </h2>
          <ul className="space-y-4">
            {foodTransactions.map((tx, index) => (
              <li
                key={index}
                className="p-4 border rounded-lg shadow-sm bg-white border-gray-300"
                dir="rtl"
              >
                <p className="text-gray-700">
                  <span className="font-bold">{tx.debtor.name}</span> משלם ל
                  <span className="font-bold">{tx.creditor.name}</span>{" "}
                  <span className="font-bold">{tx.amount} ש״ח</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Split;
