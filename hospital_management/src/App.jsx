import { useState } from 'react'
import Login from "./components/Login";
import Register from "./components/Register";
import "./styles/Auth.css";
import './App.css'

function App() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="app">
      <div className="auth-container">



        <div className="right-panel">
          {showRegister ? (
            <Register setShowRegister={setShowRegister} />
          ) : (
            <Login setShowRegister={setShowRegister} />
          )}
        </div>

      </div>
    </div>
  );
}

export default App
