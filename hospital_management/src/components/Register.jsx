import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. IMPORTAMOS useNavigate

function Register() { // 2. QUITAMOS setShowRegister
  const navigate = useNavigate(); // 3. INICIALIZAMOS EL HOOK DE NAVEGACIÓN

  const [formData, setFormData] = useState({
    nombre_completo: "",
    telefono: "",
    tipo_sangre: "",
    fecha_nacimiento: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validación básica de campos vacíos
    if (
      !formData.nombre_completo ||
      !formData.telefono ||
      !formData.tipo_sangre ||
      !formData.fecha_nacimiento ||
      !formData.email ||
      !formData.password
    ) {
      alert("Todos los campos son obligatorios");
      return;
    }

    // 4. VALIDACIÓN EXTRA: Que la contraseña no sea tan corta
    if (formData.password.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("https://api-mediconnect-2026-agh0gyhbdkh4achy.canadacentral-01.azurewebsites.net/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Paciente registrado correctamente. Por favor, inicia sesión.");

        // 5. REDIRIGIMOS AL LOGIN EN VEZ DE USAR setShowRegister
        navigate("/login");

      } else {
        alert(data.message || "Error al registrar");
      }
    } catch (error) {
      console.error("Error conexión:", error);
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };
  // --- RENDERIZADO (NUEVO DISEÑO) ---
  return (
    <div className="flex min-h-screen w-full font-['Inter',sans-serif] bg-[#f6f6f8] dark:bg-[#101622]">

      {/* =======================================================
          PANEL IZQUIERDO (MANTENEMOS EL TUYO ORIGINAL)
         ======================================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#135bec]">
        <div
          className="absolute inset-0 z-0 opacity-40 bg-center bg-no-repeat bg-cover"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop')",
          }}
        ></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#135bec]/80 to-[#135bec]/40"></div>
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
              <span className="material-symbols-outlined text-sm">verified_user</span>
              HIPAA Compliant
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">lock</span>
              Secure Encryption
            </span>
          </div>
        </div>
      </div>

      {/* =======================================================
          PANEL DERECHO (NUEVO DISEÑO INTEGRADO)
         ======================================================= */}

      <div className="w-full lg:w-1/2 flex flex-col h-screen overflow-y-auto bg-white dark:bg-[#101622]">

        {/* HEADER SUPERIOR (Hospital System) */}
        <header className="w-full bg-white dark:bg-[#101622] border-b border-gray-100 dark:border-gray-800 px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-30">

          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm text-slate-500 dark:text-slate-400">
              ¿Ya tienes cuenta?
            </span>
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 text-sm font-semibold rounded-lg border border-[#135bec] text-[#135bec] bg-white hover:bg-[#135bec] hover:text-white transition-colors"
            >
              Inicia sesión
            </button>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL (Scrollable) */}
        <main className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="flex flex-col w-full lg:w-1/2 bg-white dark:bg-[#101622] justify-center px-8 sm:px-16 lg:px-24 py-12">

            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl ...">

              {/* Títulos */}
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                  Crea tu Cuenta de Paciente
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Tus datos se manejan de forma segura conforme a la ley de protección de datos personales.
                </p>
              </div>

              {/* FORMULARIO */}
              <form onSubmit={handleRegister} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                  {/* NOMBRE COMPLETO (Ancho completo) */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <span className="material-symbols-outlined text-xl">person</span>
                      </span>
                      <input
                        type="text"
                        name="nombre_completo"
                        value={formData.nombre_completo}
                        onChange={handleChange}
                        placeholder="Ej. Juan Pérez"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] outline-none transition-all text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>




                  {/* TELÉFONO */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Teléfono
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <span className="material-symbols-outlined text-xl">call</span>
                      </span>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="7777-7777"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] outline-none transition-all text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* EMAIL */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <span className="material-symbols-outlined text-xl">mail</span>
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="correo@ejemplo.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] outline-none transition-all text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* FECHA NACIMIENTO */}
                  <div className="col-span-full text-center">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <span className="material-symbols-outlined text-xl">calendar_today</span>
                      </span>
                      <input
                        type="date"
                        name="fecha_nacimiento"
                        value={formData.fecha_nacimiento}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] outline-none transition-all text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* TIPO DE SANGRE (Ancho completo) */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Tipo de Sangre
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <span className="material-symbols-outlined text-xl">bloodtype</span>
                      </span>
                      <select
                        name="tipo_sangre"
                        value={formData.tipo_sangre}
                        onChange={handleChange}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] outline-none transition-all text-slate-900 dark:text-white appearance-none"
                        required
                      >
                        <option value="">Selecciona tu tipo de sangre</option>
                        <option value="A+">A Rh positivo (A+)</option>
                        <option value="A-">A Rh negativo (A-)</option>
                        <option value="B+">B Rh positivo (B+)</option>
                        <option value="B-">B Rh negativo (B-)</option>
                        <option value="AB+">AB Rh positivo (AB+)</option>
                        <option value="AB-">AB Rh negativo (AB-)</option>
                        <option value="O+">O Rh positivo (O+)</option>
                        <option value="O-">O Rh negativo (O-)</option>
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined">expand_more</span>
                      </span>
                    </div>
                  </div>

                  {/* PASSWORD (Ancho completo) */}
                  {/* PASSWORD (Corregido con estructura robusta) */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Contraseña
                    </label>
                    <div className="relative">

                      {/* ICONO CANDADO (Izquierda) - Ancho fijo w-12 */}
                      <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                        <span className="material-symbols-outlined text-slate-400 text-xl">
                          lock
                        </span>
                      </div>

                      {/* INPUT - Padding izquierdo pl-12 para dejar espacio al icono */}
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] outline-none transition-all text-slate-900 dark:text-white"
                        required
                      />

                      {/* BOTÓN OJO (Derecha) - Ancho fijo w-12 */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-slate-400 hover:text-[#135bec] cursor-pointer z-10"
                      >
                        <span className="material-symbols-outlined text-xl select-none">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>


                {/* BOTÓN SUBMIT */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#135bec] hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg shadow-[#135bec]/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      "Registrando..."
                    ) : (
                      <>
                        <span>Registrarse</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* FOOTER TEXT */}
              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Al registrarte, aceptas nuestros{" "}
                  <a className="text-[#135bec] font-medium hover:underline" href="#">
                    Términos de Servicio
                  </a>{" "}
                  y{" "}
                  <a className="text-[#135bec] font-medium hover:underline" href="#">
                    Política de Privacidad
                  </a>.
                </p>
              </div>
            </div>
          </div>




        </main>

        {/* FOOTER PAGINA */}
        <footer className="py-6 text-center text-slate-400 text-xs">
          © 2024 Hospital System Inc. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}

export default Register;