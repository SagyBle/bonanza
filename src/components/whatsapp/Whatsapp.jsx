import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

import whatsappIcon from "../../assets/icons/whatsapp.svg";

const Whatsapp = ({ players }) => {
  //   const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!players) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [players]);
  //   useEffect(() => {
  //     const fetchPlayers = async () => {
  //       try {
  //         const playersCollectionRef = collection(
  //           db,
  //           `tables/${tableId}/players`
  //         );
  //         const snapshot = await getDocs(playersCollectionRef);
  //         const playersData = snapshot.docs.map((doc) => ({
  //           id: doc.id,
  //           ...doc.data(),
  //         }));
  //         console.log({ playersData });

  //         setPlayers(playersData);
  //         setLoading(false);
  //       } catch (error) {
  //         console.error("Error fetching players: ", error);
  //         setLoading(false);
  //       }
  //     };

  //     fetchPlayers();
  //   }, [tableId]);

  const generateMessage = () => {
    return players
      .map((player) => `${player.name} ${player.entries}`)
      .join("\n");
  };

  const sendToWhatsApp = () => {
    const message = generateMessage();
    console.log({ message });

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
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
  );
};

export default Whatsapp;
