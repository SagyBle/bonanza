import "./App.css";
import "./index.css"; // Or the path to your main CSS file

import Header from "./components/Header";
import Table from "./pages/Table";
import TablesManager from "./pages/TablesManager";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import Sumup from "./pages/Sumup";
import Leftovers from "./pages/Leftovers";
import Split from "./pages/Split";
import Footer from "./components/Footer";
import UnionsManager from "./pages/UnionsManager";
import Union from "./pages/Union";
import GroupsManager from "./pages/GroupsManager";
import Group from "./pages/Group";
import WideDisplayNewPage from "./pages/WideDisplayNew";

function App() {
  const [isManagerMode, setIsManagerMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  return (
    <div className="App min-h-screen flex flex-col">
      <Router>
        <Header
          isManagerMode={isManagerMode}
          setIsManagerMode={setIsManagerMode}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
        />

        {/* Version indicator - moved to top right */}
        <div className="absolute top-20 right-4 z-10 bg-red-100 px-2 py-1 rounded text-xs text-red-700">
          v2.2.0
        </div>

        {/* Main content area - takes up all available space */}
        <main className="flex-1">
          <Routes>
            <Route
              path="/groups"
              element={<GroupsManager isManagerMode={isManagerMode} />}
            />
            <Route
              path="/group/:groupId"
              element={<Group isManagerMode={isManagerMode} />}
            />
            {/* <Route
              path="/group/:groupId/tables"
              element={<TablesManager isManagerMode={isManagerMode} />}
            /> */}
            {/* <Route
              path="group/:groupId/table/:tableId"
              element={
                <Table
                  isManagerMode={isManagerMode}
                  soundEnabled={soundEnabled}
                />
              }
            /> */}
            <Route
              path="/group/:groupId/table/:tableId"
              element={
                <Table
                  isManagerMode={isManagerMode}
                  soundEnabled={soundEnabled}
                />
              }
            />
            <Route
              // path="/sumup/:tableId"
              path="/sumup/group/:groupId/table/:tableId"
              element={<Sumup isManagerMode={isManagerMode} />}
            />
            <Route
              // path="/leftovers/:tableId"
              path="/leftovers/group/:groupId/table/:tableId"
              element={<Leftovers isManagerMode={isManagerMode} />}
            />
            <Route
              path="/split/group/:groupId/table/:tableId"
              element={<Split isManagerMode={isManagerMode} />}
            />
            <Route
              path="/unions"
              element={<UnionsManager isManagerMode={isManagerMode} />}
            />
            <Route
              path="/union/:unionId"
              element={<Union isManagerMode={isManagerMode} />}
            />
            <Route
              path="/union/:unionId"
              element={<Union isManagerMode={isManagerMode} />}
            />
            <Route path="/wide-display" element={<WideDisplayNewPage />} />

            <Route path="*" element={<Navigate to="/groups" replace />} />
          </Routes>
        </main>

        <Footer />
      </Router>
    </div>
  );
}

export default App;
