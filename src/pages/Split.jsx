import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { minimalSettlement } from "../utils/balance.utils";
import whatsappIcon from "../assets/icons/whatsapp.svg";
import Paybox from "../components/Paybox";

const Split = () => {
  const { tableId } = useParams();
  const [players, setPlayers] = useState([]);
  const [generalPlayers, setGeneralPlayers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
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
        console.error("Error fetching players:", error);
      }
    };

    fetchPlayers();
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

  const calculateSplit = () => {
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

    const encodedMessage = encodeURIComponent(message);
    const footer = "\n\nנוצר ע״י bonazApp";

    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(
      encodedMessage + footer
    )}`;
    window.open(whatsappURL, "_self");
  };

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-6" dir="rtl">
        חישוב העברות
      </h1>

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

      <div className="flex justify-center mt-6">
        <button
          onClick={calculateSplit}
          className="py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition"
        >
          חשב העברות
        </button>
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
                  <span className="font-bold">{tx.debtor.name}</span> משלם ל{" "}
                  <span className="font-bold">{tx.creditor.name}</span> סכום של{" "}
                  <span className="font-bold">
                    {tx.amount} {"ש״ח "}
                  </span>
                </p>

                {/* <Paybox
                  amount={tx.amount}
                  creditorName={tx.creditor.name}
                  creditorPhoneNumber={tx.creditor.phoneNumber}
                /> */}
              </li>
            ))}
          </ul>

          <div className="flex justify-center mt-6">
            <button
              onClick={sendToWhatsApp}
              className="flex items-center bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition duration-200"
              dir="rtl"
            >
              <span>שלח כהודעה בwhatsapp</span>
              <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5 mr-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Split;
