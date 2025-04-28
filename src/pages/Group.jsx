import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import TablesManager from "./TablesManager";

const Group = ({ isManagerMode }) => {
  const { groupId } = useParams();
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          const data = groupSnap.data();
          setGroupName(data.groupName || "ללא שם קבוצה");
        } else {
          setGroupName("קבוצה לא נמצאה");
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
        setGroupName("שגיאה בטעינת קבוצה");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        {loading ? "טוען שם קבוצה..." : `קבוצה: ${groupName}`}
      </h1>

      <TablesManager groupId={groupId} isManagerMode={isManagerMode} />
    </div>
  );
};

export default Group;
