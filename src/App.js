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

function App() {
  const [isManagerMode, setIsManagerMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  return (
    <div className="App">
      <Router>
        <Header
          isManagerMode={isManagerMode}
          setIsManagerMode={setIsManagerMode}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
        />
        <Routes>
          <Route
            path="/"
            element={<TablesManager isManagerMode={isManagerMode} />}
          />
          <Route
            path="/table/:tableId"
            element={
              <Table
                isManagerMode={isManagerMode}
                soundEnabled={soundEnabled}
              />
            }
          />
          <Route
            path="/sumup/:tableId"
            element={<Sumup isManagerMode={isManagerMode} />}
          />
          <Route
            path="/leftovers/:tableId"
            element={<Leftovers isManagerMode={isManagerMode} />}
          />
          <Route
            path="/split/:tableId"
            element={<Split isManagerMode={isManagerMode} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
