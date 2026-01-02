import React, { useEffect, useState } from "react";
import { getDocs, collection, addDoc, setDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

const GroupsManager = ({ isManagerMode }) => {
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      const snapshot = await getDocs(collection(db, "groups"));
      const groupsList = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      // Optional: sort by createdAt if available
      groupsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setGroups(groupsList);
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  // Auto-suggest group ID based on group name
  const generateGroupId = (name) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05FF\s-_]/g, "") // Remove invalid chars, keep Hebrew
      .replace(/[\u0590-\u05FF]/g, "") // Remove Hebrew characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/--+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
      .substring(0, 30); // Limit to 30 characters
  };

  // Handle group name change with auto-suggestion
  const handleGroupNameChange = (e) => {
    const newName = e.target.value;
    setGroupName(newName);

    // Auto-suggest group ID if it's empty or was auto-generated
    if (!groupId || groupId === generateGroupId(groupName)) {
      setGroupId(generateGroupId(newName));
    }
  };

  // Validate group ID format
  const validateGroupId = (id) => {
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(id);
  };

  const validateForm = () => {
    setError("");

    // Check group name length
    if (groupName.trim().length < 3) {
      setError("שם הקבוצה חייב להכיל לפחות 3 תווים");
      return false;
    }

    // Check group ID length
    if (groupId.trim().length < 3 || groupId.trim().length > 30) {
      setError("מזהה הקבוצה חייב להכיל 3-30 תווים");
      return false;
    }

    // Check group ID format
    if (!validateGroupId(groupId.trim())) {
      setError(
        "מזהה הקבוצה יכול להכיל רק אותיות אנגליות, מספרים, מקפים וקווים תחתונים"
      );
      return false;
    }

    // Check for duplicate group ID (case insensitive)
    const duplicateGroup = groups.find(
      (group) => group.id?.toLowerCase() === groupId.trim().toLowerCase()
    );
    if (duplicateGroup) {
      setError("מזהה קבוצה זה כבר תפוס. אנא בחר מזהה אחר");
      return false;
    }

    // Check if created by is provided
    if (!createdBy.trim()) {
      setError("נא להזין את שם היוצר");
      return false;
    }

    return true;
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsCreating(true);
    try {
      // Create the group document with custom ID
      const customGroupId = groupId.trim().toLowerCase();
      const groupData = {
        groupName: groupName.trim(),
        createdBy: createdBy.trim(),
        description: description.trim() || "",
        createdAt: new Date().toISOString(),
        // Default settings
        forMoney: 1,
        getChips: 1,
        moneyChipsRelation: 1,
        isLeftovers: false,
      };

      await setDoc(doc(db, "groups", customGroupId), groupData);
      console.log("Group created with custom ID:", customGroupId);

      // Reset form
      setGroupName("");
      setGroupId("");
      setCreatedBy("");
      setDescription("");
      setShowCreateModal(false);
      setError("");

      // Navigate to the new group
      navigate(`/group/${customGroupId}`);
    } catch (error) {
      console.error("Error creating group:", error);
      setError("שגיאה ביצירת הקבוצה. אנא נסה שוב.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setGroupName("");
    setGroupId("");
    setCreatedBy("");
    setDescription("");
    setError("");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 className="text-2xl font-bold mb-6 text-center">רשימת קבוצות</h1>

      {/* Create Group Button - Only in Manager Mode */}
      {isManagerMode && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:opacity-80 shadow-md"
          >
            <span className="text-xl">👥</span>
            צור קבוצה חדשה
          </button>
        </div>
      )}

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

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  צור קבוצה חדשה
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם הקבוצה *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={handleGroupNameChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="הכנס שם קבוצה"
                    required
                    minLength={3}
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מזהה קבוצה * (3-30 תווים)
                  </label>
                  <input
                    type="text"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value.toLowerCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="flop-lovers"
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[a-zA-Z0-9_-]+"
                    disabled={isCreating}
                  />
                  {groupId && (
                    <p className="mt-1 text-xs text-gray-500">
                      🔗 כתובת URL:{" "}
                      <span className="font-mono bg-gray-100 px-1 rounded">
                        /group/{groupId}
                      </span>
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    רק אותיות אנגליות, מספרים, מקפים (_) וקווים תחתונים (-)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    נוצר על ידי *
                  </label>
                  <input
                    type="text"
                    value={createdBy}
                    onChange={(e) => setCreatedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="השם שלך"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תיאור (אופציונלי)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
                    placeholder="תיאור קצר של הקבוצה"
                    disabled={isCreating}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                    disabled={isCreating}
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCreating}
                  >
                    {isCreating ? "יוצר..." : "צור קבוצה"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsManager;
