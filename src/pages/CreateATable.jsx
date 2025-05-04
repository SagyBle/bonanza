import { useState } from "react";
import { db } from "../config/firebase";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import DropdownWithSearch from "../components/DropdownWithSearch";

const CreateATable = ({ groupId }) => {
  const [roomTitle, setRoomTitle] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [players, setPlayers] = useState([]);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const navigate = useNavigate();

  const handleTitleChange = (e) => {
    setRoomTitle(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setRoomDescription(e.target.value);
  };

  const handlePlayerSelect = (player) => {
    // Check if the player is already in the players array by comparing player ID (or name)
    const playerExists = players.some(
      (existingPlayer) => existingPlayer.id === player.id
    );

    // Only add the player if they don't already exist in the list
    if (!playerExists) {
      setPlayers((prevPlayers) => [...prevPlayers, player]);
    }
  };

  const tablesCollection = collection(db, `groups/${groupId}/tables`);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewImageUrl(URL.createObjectURL(file)); // Show image immediately
      console.log("sagy20", file);
    }
  };

  const handleUploadImage = async () => {
    if (!image) return;

    try {
      const imageUrlResponse = await uploadImageToCloudinaryViaServer(image);

      if (!imageUrlResponse) {
        throw new Error("No image URL returned from server.");
      }

      setImageUrl(imageUrlResponse);
      console.log("✅ Image uploaded:", imageUrlResponse);
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("Image upload failed!");
    }
  };

  const uploadImageToCloudinaryViaServer = async (file) => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const res = await fetch("/.netlify/functions/cloudinary-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file: reader.result }),
          });

          const data = await res.json();
          if (res.ok) {
            resolve(data.url); // ✅ cloudinary secure URL
          } else {
            reject(data.error);
          }
        } catch (error) {
          reject(error.message);
        }
      };

      reader.readAsDataURL(file); // convert file to base64
    });
  };
  // const uploadImage = (files) =>

  const handleCreateRoom = async () => {
    const roomCreationTime = new Date().toISOString();

    const defaultTitle = `השולחן של ${new Date().toLocaleDateString("he-IL", {
      weekday: "long",
    })} - ה${new Date().toLocaleDateString("he-IL", {
      day: "numeric",
      month: "numeric",
      year: "2-digit",
    })}`;

    let imageUrlResponse = null;

    if (image) {
      try {
        imageUrlResponse = await uploadImageToCloudinaryViaServer(image);
        console.log(
          "✅ Image uploaded during room creation:",
          imageUrlResponse
        );
      } catch (err) {
        console.error("❌ Failed to upload image during room creation:", err);
        alert("Image upload failed. Creating table without image.");
      }
    }

    const newTable = {
      createdAt: roomCreationTime,
      title: roomTitle || defaultTitle,
      description: roomDescription,
      ...(imageUrlResponse && { tableImageUrl: imageUrlResponse }),
    };

    try {
      const tableDocRef = await addDoc(tablesCollection, newTable);
      const historyCollectionRef = collection(tableDocRef, "history");

      await addDoc(historyCollectionRef, {
        type: "table_created",
        timestamp: roomCreationTime,
      });

      const playersCollectionRef = collection(tableDocRef, "players");
      for (const player of players) {
        const playerDocRef = doc(playersCollectionRef, player.id);
        await setDoc(playerDocRef, { ...player, entries: 1 });

        await addDoc(historyCollectionRef, {
          type: "player_added",
          playerId: playerDocRef.id,
          playerName: player.name,
          timestamp: new Date().toISOString(),
        });
      }

      navigate(`/group/${groupId}/table/${tableDocRef.id}`);
    } catch (error) {
      console.error("Error creating room: ", error);
    }
  };

  return (
    <div className="w-full mx-auto bg-gradient-to-r from-black via-gray-800 to-black text-white p-8 rounded-xl shadow-xl">
      <h2 className="text-4xl font-bold text-center mb-6 text-yellow-400 drop-shadow-md">
        צור שולחן פוקר
      </h2>

      <DropdownWithSearch
        groupId={groupId}
        onSelectPlayer={handlePlayerSelect}
      />

      <div className="mb-4 flex flex-col">
        <label
          htmlFor="roomTitle"
          className="text-lg font-semibold text-green-500 bg-red-90 self-end mt-4"
          dir="rtl"
        >
          כותרת:
        </label>
        <input
          type="text"
          id="roomTitle"
          value={roomTitle}
          onChange={handleTitleChange}
          className="w-full p-3 mt-2 rounded-lg bg-gray-900 text-white shadow-lg border border-green-500 focus:ring-2 focus:ring-green-600 focus:outline-none"
          placeholder="הכנס כותרת לשולחן..."
          required
          dir="rtl"
        />
      </div>

      <div className="mb-6 flex flex-col">
        <label
          htmlFor="roomDescription"
          className="text-lg font-semibold text-green-500 self-end"
          dir="rtl"
        >
          תיאור:
        </label>
        <textarea
          id="roomDescription"
          value={roomDescription}
          onChange={handleDescriptionChange}
          className="w-full p-3 mt-2 rounded-lg bg-gray-900 text-white shadow-lg border border-green-500 focus:ring-2 focus:ring-green-600 focus:outline-none"
          placeholder="הכנס תיאור לשולחן..."
          rows="4"
          required
          dir="rtl"
        />
      </div>

      <div className="mb-4 flex flex-col">
        <label
          htmlFor="imageInput"
          className="text-lg font-semibold text-green-500 self-end"
          dir="rtl"
        >
          העלה תמונה:
        </label>
        <input
          type="file"
          id="imageInput"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full p-3 mt-2 rounded-lg bg-gray-900 text-white shadow-lg border border-green-500 focus:ring-2 focus:ring-green-600 focus:outline-none"
          dir="rtl"
        />
        {image && (
          <div className="mt-4 flex flex-col items-center border border-green-600 p-4 rounded-lg bg-gray-800 shadow-md">
            {/* <p dir="rtl" className="text-sm text-green-400 mb-2">
              התמונה שנבחרה: {image.name}
            </p> */}
            {previewImageUrl && (
              <img
                src={previewImageUrl}
                alt="תצוגה של תמונה מקומית"
                className="rounded-xl shadow-lg w-full max-w-xs h-auto object-cover border border-green-500"
              />
            )}
          </div>
        )}
        {/* {image && <button onClick={handleUploadImage}>Upload Photo</button>} */}

        {/* {imageUrl && (
          <img
            src={imageUrl}
            alt="תצוגה של תמונה שהועלתה"
            className="mt-4 rounded-lg shadow-lg max-w-xs"
          />
        )} */}
      </div>

      <button
        onClick={handleCreateRoom}
        className="w-full py-3 px-4 mt-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors duration-300"
      >
        צור שולחן
      </button>
    </div>
  );
};

export default CreateATable;
