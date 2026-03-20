import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import {
  validateEmail, validateTelefono, validateFechaNacimiento,
  validatePassword, validateNombre, maxBirthDate, minBirthDate,
} from "../utils/validations";

function Register() {
  const navigate = useNavigate();

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Limpiar el error del campo al editar
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const errs = {
      nombre_completo: validateNombre(formData.nombre_completo),
      telefono:        validateTelefono(formData.telefono),
      email:           validateEmail(formData.email),
      fecha_nacimiento:validateFechaNacimiento(formData.fecha_nacimiento),
      password:        validatePassword(formData.password),
      tipo_sangre:     !formData.tipo_sangre ? "Selecciona tu tipo de sangre." : null,
    };

    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess("Paciente registrado correctamente. Redirigiendo...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(data.message || "Error al registrar. Inténtalo de nuevo.");
      }
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const FErr = ({ name }) => fieldErrors[name]
    ? <p className="mt-1.5 ml-1 text-xs font-semibold text-red-500 flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">error</span>{fieldErrors[name]}
      </p>
    : null;

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
                <span className="material-symbols-outlined text-white text-3xl">local_hospital</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">MediConnect</span>
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
        <div className="w-full lg:w-1/2 flex flex-col h-screen overflow-y-auto bg-white dark:bg-[#001F23]">

          <header className="w-full bg-white dark:bg-[#001F23] border-b border-gray-100 dark:border-gray-800 px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <span className="hidden md:block text-sm text-slate-500 dark:text-slate-400">
                ¿Ya tienes cuenta?
              </span>
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2 text-sm font-semibold rounded-lg border border-[#006B76] text-white bg-[#006B76] hover:bg-white hover:text-[#006B76] transition-colors"
              >
                Inicia sesión
              </button>
            </div>
          </header>

          <main className="flex-1 flex items-center justify-center px-8 sm:px-16 lg:px-24 py-12">
            <div className="w-full max-w-lg">

              <div className="mb-10 text-center">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                  Crea tu Cuenta de Paciente
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Tus datos se manejan de forma segura conforme a la ley de protección de datos personales.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* NOMBRE COMPLETO */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Nombre Completo</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <span className="material-symbols-outlined text-xl">person</span>
                      </span>
                      <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange}
                        placeholder="Ej. Juan Pérez" required
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#006B76] outline-none transition-all text-slate-900 dark:text-white ${fieldErrors.nombre_completo ? "border-red-400" : "border-slate-200 dark:border-slate-700"}`}
                      />
                    </div>
                    <FErr name="nombre_completo" />
                  </div>

                  {/* TELÉFONO */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Teléfono</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <span className="material-symbols-outlined text-xl">call</span>
                      </span>
                      <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                        placeholder="7777-7777" maxLength={9} required
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#006B76] outline-none transition-all text-slate-900 dark:text-white ${fieldErrors.telefono ? "border-red-400" : "border-slate-200 dark:border-slate-700"}`}
                      />
                    </div>
                    <FErr name="telefono" />
                  </div>

                  {/* EMAIL */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Correo electrónico</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <span className="material-symbols-outlined text-xl">mail</span>
                      </span>
                      <input type="email" name="email" value={formData.email} onChange={handleChange}
                        placeholder="correo@ejemplo.com" required
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#006B76] outline-none transition-all text-slate-900 dark:text-white ${fieldErrors.email ? "border-red-400" : "border-slate-200 dark:border-slate-700"}`}
                      />
                    </div>
                    <FErr name="email" />
                  </div>

                  {/* FECHA NACIMIENTO */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Fecha de Nacimiento</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <span className="material-symbols-outlined text-xl">calendar_today</span>
                      </span>
                      <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange}
                        min={minBirthDate()} max={maxBirthDate()} required
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#006B76] outline-none transition-all text-slate-900 dark:text-white ${fieldErrors.fecha_nacimiento ? "border-red-400" : "border-slate-200 dark:border-slate-700"}`}
                      />
                    </div>
                    <FErr name="fecha_nacimiento" />
                  </div>

                  {/* TIPO DE SANGRE */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Tipo de Sangre</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <span className="material-symbols-outlined text-xl">bloodtype</span>
                      </span>
                      <select name="tipo_sangre" value={formData.tipo_sangre} onChange={handleChange} required
                        className={`w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#006B76] outline-none transition-all text-slate-900 dark:text-white appearance-none ${fieldErrors.tipo_sangre ? "border-red-400" : "border-slate-200 dark:border-slate-700"}`}
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
                    <FErr name="tipo_sangre" />
                  </div>

                  {/* PASSWORD */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Contraseña</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                        <span className="material-symbols-outlined text-slate-400 text-xl">lock</span>
                      </div>
                      <input type={showPassword ? "text" : "password"} name="password" value={formData.password}
                        onChange={handleChange} placeholder="Mínimo 8 caracteres" required
                        className={`w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#006B76] outline-none transition-all text-slate-900 dark:text-white ${fieldErrors.password ? "border-red-400" : "border-slate-200 dark:border-slate-700"}`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-slate-400 hover:text-[#006B76] cursor-pointer z-10">
                        <span className="material-symbols-outlined text-xl select-none">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    <FErr name="password" />
                  </div>
                </div>

                {/* FEEDBACK INLINE */}
                {(error || success) && (
                  <div className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
                    success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                      {success ? "check_circle" : "error"}
                    </span>
                    {success || error}
                  </div>
                )}

                {/* BOTÓN SUBMIT */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !!success}
                    className="w-full bg-[#006B76] hover:bg-[#004F5A] text-white font-bold py-4 rounded-lg shadow-lg shadow-[#006B76]/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Al registrarte, aceptas nuestros Términos de Servicio y Política de Privacidad.
                </p>
              </div>
            </div>
          </main>

          <footer className="py-6 text-center text-slate-400 text-xs">
            © 2026 MediConnect. Todos los derechos reservados.
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Register;
