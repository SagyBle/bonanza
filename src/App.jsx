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

function App() {
  const [isManagerMode, setIsManagerMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  return (
    <div className="App">
      <Router>
        <header>
          <Header
            isManagerMode={isManagerMode}
            setIsManagerMode={setIsManagerMode}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
          />
        </header>

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

          <Route path="*" element={<Navigate to="/groups" replace />} />
        </Routes>
        <footer>
          <Footer />
        </footer>
      </Router>
    </div>
  );
}

export default App;
