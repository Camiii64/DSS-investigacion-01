import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Paciente from "./components/Paciente";
import Doctor from "./components/Doctor";
import "./styles/Auth.css";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/paciente" element={<Paciente />} />
        <Route path="/doctor" element={<Doctor />} />

      </Routes>
    </Router>
  );
}

export default App;
