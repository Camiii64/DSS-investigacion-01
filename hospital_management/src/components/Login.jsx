import { useState } from "react";

function Login({ setShowRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Estado para el ojito

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
        // Aquí agregarás la navegación más adelante
        if (data.role === "doctor") {
          console.log("Ir a dashboard doctor");
        } else if (data.role === "admin") {
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
    <div className="flex min-h-screen w-full font-['Inter',sans-serif] bg-[#f6f6f8] dark:bg-[#101622]">
      {/* PANEL IZQUIERDO (IMAGEN Y BRANDING) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#135bec]">
        {/* Imagen de fondo */}
        <div
          className="absolute inset-0 z-0 opacity-40 bg-center bg-no-repeat bg-cover"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop')", // Puse una imagen médica real de Unsplash
          }}
        ></div>

        {/* Gradiente superpuesto */}
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#135bec]/80 to-[#135bec]/40"></div>

        {/* Contenido del panel izquierdo */}
        <div className="relative z-20 flex flex-col justify-between p-16 w-full text-white h-full">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
              <span className="material-symbols-outlined text-white text-3xl">
                local_hospital
              </span>
            </div>
            <span className="text-2xl font-bold tracking-tight">
              MediConnect Pro
            </span>
          </div>

          <div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Advanced Healthcare Management System
            </h1>
            <p className="text-xl text-white/90 max-w-lg leading-relaxed">
              Streamlining patient care, doctor schedules, and administrative
              workflows in one secure, unified platform.
            </p>
          </div>

          <div className="flex gap-8 text-sm font-medium text-white/70">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                verified_user
              </span>
              HIPAA Compliant
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">lock</span>
              Secure Encryption
            </span>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO (FORMULARIO) */}
      <div className="flex flex-col w-full lg:w-1/2 bg-white dark:bg-[#101622] justify-center px-8 sm:px-16 lg:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-[#0d121b] dark:text-white mb-3">
              Welcome Back
            </h2>
            <p className="text-[#4c669a] dark:text-gray-400">
              Please enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* INPUT EMAIL */}
            <div>
              <label
                className="block text-sm font-semibold text-[#0d121b] dark:text-gray-200 mb-2"
                htmlFor="username"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 text-[20px]">
                    person
                  </span>
                </div>
                <input
                  id="username"
                  type="email"
                  className="block w-full pl-11 pr-4 h-14 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all placeholder:text-gray-400 text-gray-900 dark:text-white"
                  placeholder="e.g. paciente@hospital.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* INPUT PASSWORD */}
            {/* INPUT PASSWORD CORREGIDO */}
            <div>
              <div className="flex justify-between mb-2">
                <label
                  className="block text-sm font-semibold text-[#0d121b] dark:text-gray-200"
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  className="text-sm font-medium text-[#135bec] hover:underline"
                  href="#"
                >

                </a>
              </div>

              <div className="relative w-full">
                {/* ICONO CANDADO (Izquierda) */}
                <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                  <span className="material-symbols-outlined text-gray-400 text-[20px]">
                    lock
                  </span>
                </div>

                {/* INPUT */}
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="block w-full pl-12 pr-12 h-14 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all placeholder:text-gray-400 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {/* BOTÓN OJO (Derecha) */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none z-10 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px] select-none">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            {/* REMEMBER ME */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#135bec] focus:ring-[#135bec] border-gray-300 rounded"
              />
              <label
                className="ml-2 block text-sm text-[#4c669a] dark:text-gray-400"
                htmlFor="remember-me"
              >
                Keep me signed in
              </label>
            </div>

            {/* BUTTON SUBMIT */}
            <button
              type="submit"
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-[#135bec] hover:bg-[#135bec]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#135bec] transition-all"
            >
              Sign In to Dashboard
            </button>
          </form>

          <div className="mt-8 mb-10 text-center w-full">
            <div className="mb-10 text-center lg:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400 w-full">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="font-semibold text-[#135bec] hover:underline bg-transparent border-none cursor-pointer p-0 inline-flex"
                >
                  Request Access
                </button>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;