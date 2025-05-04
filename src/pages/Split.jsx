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
import { generalMinimalSettlement } from "@/utils/generalBalance.utils";
import whatsappIcon from "../assets/icons/whatsapp.svg";
import AddFoodExpenses from "@/components/AddFoodExpenses";

const Split = ({ isManagerMode }) => {
  const { tableId, groupId } = useParams();
  const [players, setPlayers] = useState([]);
  const [generalPlayers, setGeneralPlayers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [foodTransactions, setFoodTransactions] = useState([]);

  const [moneyChipsRelation, setMoneyChipsRelation] = useState(null);
  const [editRelation, setEditRelation] = useState(false);
  const [newRelation, setNewRelation] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tableRef = doc(db, `groups/${groupId}/tables/${tableId}`);
        const groupRef = doc(db, `groups/${groupId}`);

        const [tableSnap, groupSnap] = await Promise.all([
          getDoc(tableRef),
          getDoc(groupRef),
        ]);

        if (tableSnap.exists()) {
          const tableData = tableSnap.data();

          setTransactions(tableData.pokerSettlement || []);
          setFoodTransactions(tableData.foodSettlement || []);

          const relation =
            tableData.moneyChipsRelation ??
            (groupSnap.exists()
              ? groupSnap.data().moneyChipsRelation ?? null
              : null);

          setMoneyChipsRelation(relation);
        }

        const playersSnapshot = await getDocs(
          collection(db, `groups/${groupId}/tables/${tableId}/players`)
        );
        setPlayers(
          playersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [groupId, tableId]);

  useEffect(() => {
    const fetchGeneralPlayers = async () => {
      try {
        const ids = players.map((p) => p.id);
        if (!ids.length) return setGeneralPlayers([]);

        const q = query(
          collection(db, `groups/${groupId}/generalPlayers`),
          where("__name__", "in", ids)
        );
        const snap = await getDocs(q);
        setGeneralPlayers(
          snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (err) {
        console.error("Error fetching general players:", err);
      }
    };

    fetchGeneralPlayers();
  }, [players]);

  const getPlayerDetails = (id) => {
    const p = generalPlayers.find((gp) => gp.id === id);
    return p
      ? { name: p.name, id: p.id, phoneNumber: p.phoneNumber }
      : { name: "Unknown", id, phoneNumber: "N/A" };
  };

  const calculateSplit = async () => {
    const playerObjs = players.map((p) => ({
      user: p.id,
      buy_ins: p.entries,
      final_value: p.finalTotalChips,
    }));
    const txs = minimalSettlement(playerObjs);

    const results = txs.map(([debtor, creditor, amt]) => ({
      debtor: getPlayerDetails(debtor),
      creditor: getPlayerDetails(creditor),
      amount: amt / moneyChipsRelation,
    }));

    setTransactions(results);
    await updateDoc(doc(db, `groups/${groupId}/tables/${tableId}`), {
      pokerSettlement: results,
    });
  };

  const calculateFoodSplit = async () => {
    try {
      const foodRef = collection(
        db,
        `groups/${groupId}/tables/${tableId}/foodExpenses`
      );
      const snap = await getDocs(foodRef);
      const expenses = snap.docs.map((d) => d.data());

      if (!expenses.length) return alert("אין חישובי אוכל לבצע.");

      const balance = {};
      expenses.forEach(({ totalPayer, totalAmount, subOrders }) => {
        if (!balance[totalPayer]) balance[totalPayer] = { paid: 0, due: 0 };
        balance[totalPayer].paid += totalAmount;
        subOrders.forEach(({ playerId, amount }) => {
          if (!balance[playerId]) balance[playerId] = { paid: 0, due: 0 };
          balance[playerId].due += amount;
        });
      });

      const playerArr = Object.entries(balance).map(([id, { paid, due }]) => ({
        user: id,
        amountPaid: due,
        amountDue: paid,
      }));
      const txs = generalMinimalSettlement(playerArr);

      const results = txs.map(([debtor, creditor, amt]) => ({
        debtor: getPlayerDetails(debtor),
        creditor: getPlayerDetails(creditor),
        amount: amt,
      }));

      setFoodTransactions(results);
      await updateDoc(doc(db, `groups/${groupId}/tables/${tableId}`), {
        foodSettlement: results,
      });
    } catch (err) {
      console.error("❌ Error calculating food split:", err);
    }
  };

  const sendToWhatsApp = (arr, label) => {
    if (!arr.length) return alert(`אין ${label} לשליחה!`);
    const lines = arr.map(
      (tx) =>
        `${tx.debtor.name} מעביר ל${tx.creditor.name} ${tx.amount} ש״ח${
          label === "אוכל" ? " עבור אוכל" : ""
        }`
    );
    const link = `https://bonanzapp.com/group/${groupId}/table/${tableId}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        lines.join("\n") + "\n\nנוצר ע״י bonanzApp\n" + link
      )}`,
      "_self"
    );
  };

  const saveRelation = async () => {
    const value = Number(newRelation);
    if (!value) return;
    const updates = { moneyChipsRelation: value };
    await Promise.all([
      updateDoc(doc(db, `groups/${groupId}/tables/${tableId}`), updates),
      updateDoc(doc(db, `groups/${groupId}`), updates),
    ]);
    setMoneyChipsRelation(value);
    setEditRelation(false);
  };

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-6" dir="rtl">
        חישוב העברות
      </h1>

      <AddFoodExpenses
        tableId={tableId}
        groupId={groupId}
        isManagerMode={isManagerMode}
      />

      <div className="mb-6" dir="rtl">
        <h2 className="text-xl font-semibold">רשימת שחקנים:</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((p) => (
            <li
              key={p.id}
              className="p-4 border rounded-lg bg-white shadow-sm border-gray-300"
            >
              <h4 className="text-lg font-semibold">{p.name}</h4>
              <p className="text-gray-700">כניסות: {p.entries}</p>
              <p className="text-gray-700">
                ז׳יטונים סופיים: {p.finalTotalChips || 0}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="mt-6 border rounded-lg p-4 bg-white shadow-sm max-w-md mx-auto"
        dir="rtl"
      >
        <h2 className="text-lg font-semibold mb-2">יחס ש״ח לז׳יטונים</h2>
        {moneyChipsRelation !== null && !editRelation ? (
          <div className="flex justify-between items-center">
            <span>על כל 1 ש״ח → {moneyChipsRelation.toFixed(2)} ז׳יטונים</span>
            <button
              onClick={() => {
                setNewRelation(moneyChipsRelation);
                setEditRelation(true);
              }}
              className="text-blue-600 hover:underline"
            >
              ערוך
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={newRelation}
              onChange={(e) => setNewRelation(e.target.value)}
              className="border p-1 rounded w-24"
              placeholder="הכנס יחס"
            />
            <button
              onClick={saveRelation}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              שמור
            </button>
            {moneyChipsRelation !== null && (
              <button
                onClick={() => {
                  setEditRelation(false);
                  setNewRelation("");
                }}
                className="text-gray-500 hover:underline"
              >
                ביטול
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center mt-6 gap-4 flex-wrap">
        <button
          onClick={calculateSplit}
          disabled={!moneyChipsRelation}
          className={`py-2 px-4 rounded-lg text-white transition ${
            moneyChipsRelation
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-400 cursor-not-allowed"
          }`}
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
            onClick={() => sendToWhatsApp(transactions, "העברות")}
            className="flex items-center bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600"
            dir="rtl"
          >
            <span>שלח כהודעה בwhatsapp</span>
            <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5 mr-2" />
          </button>
        )}
        {foodTransactions.length > 0 && (
          <button
            onClick={() => sendToWhatsApp(foodTransactions, "אוכל")}
            className="flex items-center bg-green-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-700"
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
            {transactions.map((tx, i) => (
              <li
                key={i}
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
            {foodTransactions.map((tx, i) => (
              <li
                key={i}
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
