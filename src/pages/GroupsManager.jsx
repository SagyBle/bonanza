import React, { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

const GroupsManager = () => {
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const snapshot = await getDocs(collection(db, "groups"));
        const groupsList = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        // Optional: sort by createdAt if available
        groupsList.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setGroups(groupsList);
      } catch (err) {
        console.error("Error fetching groups:", err);
      }
    };

    fetchGroups();
  }, []);

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 className="text-2xl font-bold mb-6 text-center">רשימת קבוצות</h1>

      {groups.length === 0 ? (
        <p className="text-gray-500 text-center">לא נמצאו קבוצות.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((group) => (
            <li
              key={group.id}
              onClick={() => handleGroupClick(group.id)}
              className="p-4 border rounded-md shadow-md hover:shadow-lg transition cursor-pointer bg-white"
            >
              <h2 className="text-lg font-semibold text-blue-600">
                {group.groupName}
              </h2>
              {group.createdBy && (
                <p className="text-sm text-gray-500">
                  נוצר על ידי: {group.createdBy}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GroupsManager;
