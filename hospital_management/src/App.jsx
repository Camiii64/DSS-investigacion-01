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
        
        <div className="left-panel">
          <img 
            src="https://ayudaadomiciliovalencia.info/wp-content/uploads/2019/01/funciones-enfermera-domicilio.jpg" 
            alt="Hospital" 
          />
        </div>

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
