import { useState } from "react";

function Login({ setShowRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Bienvenido ${data.role}`);

        if (data.role === "doctor") {
          console.log("Ir a dashboard doctor");
        } else if (data.role === "administrador") {
          console.log("Ir a panel administrador");
        } else {
          console.log("Ir a panel paciente");
        }
      } else {
        alert("Credenciales incorrectas");
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* PANEL IZQUIERDO */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-blue-700">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              "url('/hospital.jpg')",
          }}
        ></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-16">
          <h1 className="text-4xl font-bold mb-4">
            Sistema de Gestión Hospitalaria
          </h1>
          <p className="text-lg text-center max-w-md">
            Administra pacientes, doctores y procesos administrativos de forma
            segura.
          </p>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="flex flex-col w-full lg:w-1/2 justify-center px-8 sm:px-16 lg:px-24 py-12 bg-white dark:bg-gray-900">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-3xl font-bold mb-6 dark:text-white">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                className="w-full h-12 px-4 border rounded-lg dark:bg-gray-800 dark:text-white"
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <input
                className="w-full h-12 px-4 border rounded-lg dark:bg-gray-800 dark:text-white"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Ingresar
            </button>
          </form>

          <p className="mt-6 text-sm dark:text-gray-300">
            ¿No tienes cuenta?{" "}
            <span
              onClick={() => setShowRegister(true)}
              className="text-blue-600 cursor-pointer"
            >
              Regístrate
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
