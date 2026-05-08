import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./components/Landing";
import Login from "./components/Login";
import Register from "./components/Register";
import Paciente from "./components/Paciente";
import Doctor from "./components/Doctor";
import Admin from "./components/Admin";
import Emergencia from "./components/Emergencia";
import "./styles/Auth.css";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/paciente" element={<Paciente />} />
        <Route path="/doctor" element={<Doctor />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/emergencia" element={<Emergencia />} />

      </Routes>
    </Router>
  );
}

export default App;
