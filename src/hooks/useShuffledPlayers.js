import { useEffect, useRef, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
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
        // Merge updates for existing players + add new ones
        setPlayers((prevPlayers) => {
          const updatedMap = new Map(incomingPlayers.map((p) => [p.id, p]));

          return prevPlayers
            .map((p) => updatedMap.get(p.id) || p) // update existing players
            .concat(
              incomingPlayers.filter(
                (p) => !prevPlayers.some((prev) => prev.id === p.id)
              )
            )
            .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999)); // keep order consistent
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, tableId]);

  if (players) {
    players.sort((a, b) => a.order - b.order);
  }
  return { players, loading, setPlayers };
}
