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

  const generateMessage = () => {
    return players
      .map((player) => `${player.name} ${player.entries}`)
      .join("\n");
  };

  const sendToWhatsApp = () => {
    // const message =
    // console.log({ message });
    const message = generateMessage();
    const footer = "\n\nנוצר ע״י bonanzApp";
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      message + footer
    )}`;
    console.log(whatsappUrl);

    window.open(whatsappUrl, "_self");
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
