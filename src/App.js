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

function App() {
  const [isManagerMode, setIsManagerMode] = useState(false);
  return (
    <div className="App">
      <Router>
        <Header
          isManagerMode={isManagerMode}
          setIsManagerMode={setIsManagerMode}
        />
        <Routes>
          <Route
            path="/"
            element={<TablesManager isManagerMode={isManagerMode} />}
          />
          <Route
            path="/table/:tableId"
            element={<Table isManagerMode={isManagerMode} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      {/* <TablesManager /> */}
    </div>
  );
}

export default App;
