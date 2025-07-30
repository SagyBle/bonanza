import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import shufflePlayers from "../utils/shufflePlayers";

export default function useShuffledPlayers(groupId, tableId) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (!groupId || !tableId) return;

    const playersRef = collection(
      db,
      `groups/${groupId}/tables/${tableId}/players`
    );

    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const incomingPlayers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (!initialized.current) {
        const allHaveOrder = incomingPlayers.every(
          (p) => typeof p.order === "number"
        );

        if (allHaveOrder) {
          // Players already have order — just sort and use
          const sorted = [...incomingPlayers].sort((a, b) => a.order - b.order);
          setPlayers(sorted);
        } else {
          // First-time table load — shuffle and persist order
          const shuffled = shufflePlayers(incomingPlayers);
          setPlayers(shuffled);

          // Save 'order' field to Firestore
          shuffled.forEach((player, index) => {
            const playerRef = doc(
              db,
              `groups/${groupId}/tables/${tableId}/players`,
              player.id
            );
            updateDoc(playerRef, { order: index }).catch((err) =>
              console.error("Failed to save order for player:", player.id, err)
            );
          });
        }

        initialized.current = true;
      } else {
        // Only detect and add new players
        setPlayers((prevPlayers) => {
          const existingIds = new Set(prevPlayers.map((p) => p.id));
          const newPlayers = incomingPlayers
            .filter((p) => !existingIds.has(p.id))
            .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999)); // sort new ones if needed

          return [...prevPlayers, ...newPlayers];
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, tableId]);

  return { players, loading, setPlayers };
}
