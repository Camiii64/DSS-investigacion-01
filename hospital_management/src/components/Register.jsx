import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import {
  validateEmail, validateTelefono, validateFechaNacimiento,
  validatePassword, validateNombre, maxBirthDate, minBirthDate,
} from "../utils/validations";

const CrossLogo = ({ size = 22, color = "#0F172A" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="0" width="6" height="24" rx="1.5" fill={color} />
    <rect x="0" y="9" width="24" height="6" rx="1.5" fill={color} />
  </svg>
);

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

  const inputCls = (hasErr = false) =>
    `w-full text-[14px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b ${
      hasErr ? "border-red-400" : "border-slate-200"
    } focus:border-slate-900 py-2.5 transition-colors outline-none`;

  const labelCls = "font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block mb-1.5";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: null }));
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
        setSuccess("Cuenta creada correctamente. Redirigiendo...");
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

  const FErr = ({ name }) =>
    fieldErrors[name] ? (
      <p className="mt-1 text-[11px] text-red-500">{fieldErrors[name]}</p>
    ) : null;

  return (
    <div className="flex min-h-screen font-['Inter',sans-serif]">

      {/* ── PANEL IZQUIERDO ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 px-14 py-16 flex-shrink-0">
        <div className="flex items-center gap-3">
          <CrossLogo size={20} color="#fff" />
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-white">MediConnect</span>
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-500 mb-5">
            Nuevo Paciente
          </p>
          <h1 className="text-[36px] font-semibold tracking-[-0.025em] text-white leading-[1.1] mb-5">
            Crea tu cuenta de paciente.
          </h1>
          <p className="text-[14px] text-slate-400 leading-relaxed max-w-xs">
            Tus datos se manejan de forma segura conforme a la ley de protección de datos personales.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="material-symbols-outlined text-[15px]">verified_user</span>
            <span className="font-mono text-[11px] tracking-wide">Datos Protegidos</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="material-symbols-outlined text-[15px]">lock</span>
            <span className="font-mono text-[11px] tracking-wide">Acceso Encriptado</span>
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO ── */}
      <div className="flex-1 lg:w-1/2 bg-[#F1F5F9] flex items-start justify-center px-6 py-12 overflow-y-auto relative">

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="absolute top-6 right-6 lg:top-8 lg:right-8 font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400 hover:text-slate-900 transition-colors"
        >
          ← Iniciar sesión
        </button>

        <div className="bg-white w-full max-w-[480px] px-10 py-12 my-4">

          {/* Eyebrow + Título */}
          <div className="mb-10">
            <p className={labelCls}>Registro · Paciente</p>
            <h2 className="text-[30px] font-semibold tracking-[-0.025em] text-slate-900 leading-[1.1]">
              Crear cuenta
            </h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-7">

            {/* NOMBRE COMPLETO */}
            <div>
              <label className={labelCls}>Nombre Completo</label>
              <input
                type="text" name="nombre_completo" value={formData.nombre_completo}
                onChange={handleChange} placeholder="Ej. Juan Pérez" required
                className={inputCls(!!fieldErrors.nombre_completo)}
              />
              <FErr name="nombre_completo" />
            </div>

            {/* TELÉFONO + EMAIL (2 col) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
              <div>
                <label className={labelCls}>Teléfono</label>
                <input
                  type="tel" name="telefono" value={formData.telefono}
                  onChange={handleChange} placeholder="7777-7777" maxLength={9} required
                  className={inputCls(!!fieldErrors.telefono)}
                />
                <FErr name="telefono" />
              </div>

              <div>
                <label className={labelCls}>Correo electrónico</label>
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="correo@ejemplo.com" required
                  className={inputCls(!!fieldErrors.email)}
                />
                <FErr name="email" />
              </div>
            </div>

            {/* FECHA DE NACIMIENTO */}
            <div>
              <label className={labelCls}>Fecha de Nacimiento</label>
              <input
                type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento}
                onChange={handleChange} min={minBirthDate()} max={maxBirthDate()} required
                className={inputCls(!!fieldErrors.fecha_nacimiento)}
              />
              <FErr name="fecha_nacimiento" />
            </div>

            {/* TIPO DE SANGRE */}
            <div>
              <label className={labelCls}>Tipo de Sangre</label>
              <div className="relative">
                <select
                  name="tipo_sangre" value={formData.tipo_sangre}
                  onChange={handleChange} required
                  className={`${inputCls(!!fieldErrors.tipo_sangre)} appearance-none pr-6 cursor-pointer`}
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
                <span className="absolute right-0 inset-y-0 flex items-end pb-2.5 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </span>
              </div>
              <FErr name="tipo_sangre" />
            </div>

            {/* CONTRASEÑA */}
            <div>
              <label className={labelCls}>Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password" value={formData.password}
                  onChange={handleChange} placeholder="Mínimo 8 caracteres" required
                  className={`${inputCls(!!fieldErrors.password)} pr-8`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 inset-y-0 flex items-end pb-2.5 text-slate-400 hover:text-slate-900 transition-colors">
                  <span className="material-symbols-outlined text-[18px] select-none">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <FErr name="password" />
            </div>

            {/* FEEDBACK */}
            {(error || success) && (
              <p className={`text-[12px] ${success ? "text-emerald-600" : "text-red-500"}`}>
                {success || error}
              </p>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full rounded-full bg-slate-900 hover:bg-slate-700 text-white text-[13px] font-semibold py-3 transition-colors disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>

            <p className="text-center text-[11px] text-slate-400 pt-2">
              Al registrarte, aceptas nuestros Términos de Servicio y Política de Privacidad.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
