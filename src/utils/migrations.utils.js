import { getDocs, setDoc, collection, doc } from "firebase/firestore";
import { db } from "../config/firebase"; // Update to your Firebase config path

export const migrateToGroup = async (groupId) => {
  const groupPath = `groups/${groupId}`;

  try {
    // ✅ Create root group document so Firestore doesn't show "document does not exist" warning
    await setDoc(doc(db, "groups", groupId), {
      createdAt: new Date().toISOString(),
    });

    // Step 1: Copy generalPlayers
    const generalPlayersSnap = await getDocs(collection(db, "generalPlayers"));
    for (const docSnap of generalPlayersSnap.docs) {
      await setDoc(
        doc(db, `${groupPath}/generalPlayers`, docSnap.id),
        docSnap.data()
      );
    }

    // Step 2: Copy unions
    const unionsSnap = await getDocs(collection(db, "unions"));
    for (const docSnap of unionsSnap.docs) {
      console.log("found union", docSnap.id);

      await setDoc(doc(db, `${groupPath}/unions`, docSnap.id), docSnap.data());
    }

    // Step 3: Copy tables (and subcollections)
    const tablesSnap = await getDocs(collection(db, "tables"));
    for (const tableDoc of tablesSnap.docs) {
      const tableId = tableDoc.id;
      const tableData = tableDoc.data();

      await setDoc(doc(db, `${groupPath}/tables`, tableId), tableData);

      // Copy players
      const playersSnap = await getDocs(
        collection(db, `tables/${tableId}/players`)
      );
      for (const playerDoc of playersSnap.docs) {
        await setDoc(
          doc(db, `${groupPath}/tables/${tableId}/players`, playerDoc.id),
          playerDoc.data()
        );
      }

      // Copy history
      const historySnap = await getDocs(
        collection(db, `tables/${tableId}/history`)
      );
      for (const historyDoc of historySnap.docs) {
        await setDoc(
          doc(db, `${groupPath}/tables/${tableId}/history`, historyDoc.id),
          historyDoc.data()
        );
      }
    }

    console.log(`✅ Migration to group "${groupId}" completed successfully.`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
};
