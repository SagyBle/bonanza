import React, { useState } from "react";
import { getDocs, collection, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const FetchGroupsData = () => {
  const [groupId, setGroupId] = useState("");
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchStats, setFetchStats] = useState(null);

  const fetchAllGroupData = async () => {
    if (!groupId.trim()) {
      setError("Please enter a group ID");
      return;
    }

    setLoading(true);
    setError(null);
    setGroupData(null);
    setFetchStats(null);

    try {
      const groupPath = `groups/${groupId}`;
      
      // Fetch main group document
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        setError(`Group "${groupId}" not found`);
        setLoading(false);
        return;
      }

      const mainGroupData = groupSnap.data();
      
      // Initialize data structure
      const completeData = {
        groupInfo: {
          id: groupId,
          ...mainGroupData,
        },
        generalPlayers: [],
        unions: [],
        tables: [],
      };

      const stats = {
        generalPlayers: 0,
        unions: 0,
        tables: 0,
        totalPlayers: 0,
        totalHistoryEntries: 0,
      };

      // Fetch generalPlayers
      const generalPlayersSnap = await getDocs(collection(db, `${groupPath}/generalPlayers`));
      completeData.generalPlayers = generalPlayersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      stats.generalPlayers = completeData.generalPlayers.length;

      // Fetch unions
      const unionsSnap = await getDocs(collection(db, `${groupPath}/unions`));
      completeData.unions = unionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      stats.unions = completeData.unions.length;

      // Fetch tables with their subcollections
      const tablesSnap = await getDocs(collection(db, `${groupPath}/tables`));
      
      for (const tableDoc of tablesSnap.docs) {
        const tableId = tableDoc.id;
        const tableData = {
          id: tableId,
          ...tableDoc.data(),
          players: [],
          history: [],
        };

        // Fetch players for this table
        const playersSnap = await getDocs(
          collection(db, `${groupPath}/tables/${tableId}/players`)
        );
        tableData.players = playersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        stats.totalPlayers += tableData.players.length;

        // Fetch history for this table
        const historySnap = await getDocs(
          collection(db, `${groupPath}/tables/${tableId}/history`)
        );
        tableData.history = historySnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        stats.totalHistoryEntries += tableData.history.length;

        completeData.tables.push(tableData);
      }
      
      stats.tables = completeData.tables.length;

      setGroupData(completeData);
      setFetchStats(stats);
      
      // Automatically download the JSON file
      downloadJSON(completeData, mainGroupData.groupName || groupId);
      
      console.log("Fetched complete group data:", completeData);
    } catch (err) {
      console.error("Error fetching group data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = (data, groupName) => {
    // Create timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, -5); // Format: YYYY-MM-DDTHH-MM-SS
    
    // Create filename
    const filename = `${groupName}-${timestamp}.json`;
    
    // Convert data to JSON string
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Fetch Group Data with All Nested Collections
      </h1>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group ID
            </label>
            <input
              type="text"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              placeholder="Enter group ID (e.g., flop-lovers)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            onClick={fetchAllGroupData}
            disabled={loading || !groupId.trim()}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-lg font-semibold"
          >
            {loading ? "Fetching Data..." : "Fetch & Download Group Data"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          <p className="font-semibold">Fetching data...</p>
          <p className="text-sm">Please wait while we collect all nested collections</p>
        </div>
      )}

      {fetchStats && groupData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-2">✅</span>
            <h2 className="text-xl font-bold text-green-800">
              Data Successfully Downloaded!
            </h2>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Group Info:</h3>
            <p className="text-sm">
              <span className="font-medium">Name:</span> {groupData.groupInfo.groupName || "N/A"}
            </p>
            <p className="text-sm">
              <span className="font-medium">ID:</span> {groupData.groupInfo.id}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {fetchStats.generalPlayers}
              </div>
              <div className="text-sm text-gray-600">General Players</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {fetchStats.unions}
              </div>
              <div className="text-sm text-gray-600">Unions</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {fetchStats.tables}
              </div>
              <div className="text-sm text-gray-600">Tables</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {fetchStats.totalPlayers}
              </div>
              <div className="text-sm text-gray-600">Total Players</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600">
                {fetchStats.totalHistoryEntries}
              </div>
              <div className="text-sm text-gray-600">History Entries</div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>📁 File downloaded to your computer</p>
            <p className="font-mono text-xs bg-white px-2 py-1 rounded mt-1">
              {groupData.groupInfo.groupName || groupId}-{new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-")}.json
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">ℹ️ What gets fetched:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Group information</li>
          <li>General Players</li>
          <li>Unions</li>
          <li>All Tables with their Players and History</li>
        </ul>
      </div>
    </div>
  );
};

export default FetchGroupsData;
