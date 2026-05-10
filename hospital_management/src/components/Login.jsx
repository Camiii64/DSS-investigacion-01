import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";


function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [splash, setSplash] = useState(null); // { nombre, role }
  const [error, setError] = useState("");
  const [modo, setModo] = useState("normal"); // "normal" | "codigo"
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    if (!splash) return;
    const timer = setTimeout(() => {
      if (splash.role === "doctor") navigate("/doctor");
      else if (splash.role === "admin") navigate("/admin");
      else navigate("/paciente");
    }, 2000);
    return () => clearTimeout(timer);
  }, [splash, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("userId", data.id);
        localStorage.setItem("userName", data.nombre);
        localStorage.setItem("userRole", data.role);
        setSplash({ nombre: data.nombre, role: data.role });
      } else {
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      }
    } catch {
      setError("Error al conectar con el servidor. Inténtalo de nuevo.");
    }
  };

  const handleLoginCodigo = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{4}$/.test(codigo)) {
      setError("El código debe tener 4 dígitos.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });

      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("userId", data.id);
        localStorage.setItem("userName", data.nombre);
        localStorage.setItem("userRole", data.role);
        if (data.codigoExpirado) {
          localStorage.removeItem("codigoEmergencia");
          localStorage.setItem("codigoExpirado", "1");
        } else {
          localStorage.setItem("codigoEmergencia", codigo);
          localStorage.setItem("usosRestantes", String(data.usosRestantes));
        }
        setSplash({ nombre: data.nombre, role: data.role });
      } else {
        setError(data.message || "Código no válido o expirado.");
      }
    } catch {
      setError("Error al conectar con el servidor. Inténtalo de nuevo.");
    }
  };

  if (splash) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#006B76",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        zIndex: 9999, gap: "24px"
      }}>
        <div style={{
          background: "rgba(255,255,255,0.15)", borderRadius: "16px", padding: "16px",
          backdropFilter: "blur(8px)"
        }}>
          <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: "48px" }}>
            local_hospital
          </span>
        </div>
        <span style={{ color: "#fff", fontSize: "28px", fontWeight: 800, fontFamily: "Inter, sans-serif" }}>
          MediConnect
        </span>
        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "16px", fontFamily: "Inter, sans-serif" }}>
          Bienvenido, {splash.nombre}
        </span>
        <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: "10px", height: "10px", borderRadius: "50%",
              background: "rgba(255,255,255,0.6)",
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
            }} />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-scope">
      <div className="flex min-h-screen w-full font-['Inter',sans-serif] bg-[#f0fafb] dark:bg-[#001F23]">
        {/* PANEL IZQUIERDO */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#006B76]">
          <div
            className="absolute inset-0 z-0 opacity-40 bg-center bg-no-repeat bg-cover"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop')",
            }}
          ></div>

          <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#006B76]/80 to-[#006B76]/40"></div>

          <div className="relative z-20 flex flex-col justify-between p-16 w-full text-white h-full">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                <span className="material-symbols-outlined text-white text-3xl">
                  local_hospital
                </span>
              </div>
              <span className="text-2xl font-bold tracking-tight">
                MediConnect
              </span>
            </div>

            <div>
              <h1 className="text-5xl font-extrabold leading-tight mb-6">
                Sistema de Gestión Hospitalaria
              </h1>
              <p className="text-xl text-white/90 max-w-lg leading-relaxed">
                Administra citas, doctores y pacientes en una plataforma segura y unificada.
              </p>
            </div>

            <div className="flex gap-8 text-sm font-medium text-white/70">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Acceso Seguro
              </span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">lock</span>
                Datos Encriptados
              </span>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="flex flex-col w-full lg:w-1/2 bg-white dark:bg-[#001F23] justify-center px-8 sm:px-16 lg:px-24 py-12 relative">
          {/* BOTÓN VOLVER AL INICIO */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="absolute top-6 right-6 lg:top-8 lg:right-8 flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#006B76] dark:text-gray-300 dark:hover:text-white transition-colors group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            Volver al inicio
          </button>

          <div className="max-w-md w-full mx-auto">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                {modo === "codigo" ? "Acceso de emergencia" : "Bienvenido"}
              </h2>
              <p className="text-slate-500 dark:text-gray-400">
                {modo === "codigo"
                  ? "Ingresa tu código de 4 dígitos para recuperar tu sesión."
                  : "Ingresa tus credenciales para acceder a tu panel."}
              </p>
            </div>

            {/* TABS NORMAL / CÓDIGO */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => { setModo("normal"); setError(""); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                  modo === "normal"
                    ? "bg-white dark:bg-slate-700 text-[#006B76] dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => { setModo("codigo"); setError(""); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  modo === "codigo"
                    ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">emergency</span>
                Código de emergencia
              </button>
            </div>

            {modo === "codigo" ? (
              <form onSubmit={handleLoginCodigo} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-gray-200 mb-2" htmlFor="codigo">
                    Código de 4 dígitos
                  </label>
                  <input
                    id="codigo"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    className="block w-full h-16 text-center text-3xl font-black tracking-[0.5em] bg-white dark:bg-slate-900 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all text-red-700 font-mono"
                    placeholder="••••"
                    required
                    value={codigo}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCodigo(v);
                      setError("");
                    }}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Es el código que recibiste al solicitar atención de emergencia.
                    <span className="block mt-1 text-slate-400">Por seguridad, solo puede usarse 3 veces.</span>
                  </p>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-lg text-base font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all gap-2"
                >
                  <span className="material-symbols-outlined">login</span>
                  Acceder con código
                </button>
              </form>
            ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              {/* INPUT EMAIL */}
              <div>
                <label
                  className="block text-sm font-semibold text-slate-800 dark:text-gray-200 mb-2"
                  htmlFor="username"
                >
                  Correo electrónico
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
                    className="block w-full pl-11 pr-4 h-14 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#006B76] transition-all placeholder:text-gray-400 text-gray-900 dark:text-white"
                    placeholder="e.g. paciente@hospital.com"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  />
                </div>
              </div>

              {/* INPUT PASSWORD */}
              <div>
                <div className="flex justify-between mb-2">
                  <label
                    className="block text-sm font-semibold text-slate-800 dark:text-gray-200"
                    htmlFor="password"
                  >
                    Contraseña
                  </label>
                </div>

                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                    <span className="material-symbols-outlined text-gray-400 text-[20px]">
                      lock
                    </span>
                  </div>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="block w-full pl-12 pr-12 h-14 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#006B76] transition-all placeholder:text-gray-400 text-gray-900 dark:text-white"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  />

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

              {/* ERROR INLINE */}
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
                  {error}
                </div>
              )}

              {/* BUTTON SUBMIT */}
              <button
                type="submit"
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-[#006B76] hover:bg-[#004F5A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006B76] transition-all"
              >
                Iniciar Sesión
              </button>
            </form>
            )}

            <div className="mt-8 mb-2 text-center w-full">
              <p className="text-sm text-gray-500 dark:text-gray-400 w-full text-center lg:text-left">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-semibold text-[#006B76] hover:underline bg-transparent border-none cursor-pointer p-0 inline-flex"
                >
                  Regístrate
                </button>
              </p>
            </div>

            {/* Emergencia */}
            <div className="mt-4 w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs text-slate-400 font-semibold">o</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/emergencia")}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm transition-colors"
              >
                <span className="material-symbols-outlined text-lg">emergency</span>
                ¿Emergencia médica? Solicitar atención inmediata
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
