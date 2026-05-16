import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

const CrossLogo = ({ size = 22, color = "#0F172A" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="0" width="6" height="24" rx="1.5" fill={color} />
    <rect x="0" y="9" width="24" height="6" rx="1.5" fill={color} />
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [splash, setSplash] = useState(null);
  const [error, setError] = useState("");
  const [modo, setModo] = useState("normal");
  const [codigo, setCodigo] = useState("");

  const [olvideStep, setOlvideStep] = useState("email");
  const [olvideEmail, setOlvideEmail] = useState("");
  const [olvideCodigo, setOlvideCodigo] = useState("");
  const [olvideNuevaPass, setOlvideNuevaPass] = useState("");
  const [olvideConfirmPass, setOlvideConfirmPass] = useState("");
  const [olvideLoading, setOlvideLoading] = useState(false);
  const [olvideMsg, setOlvideMsg] = useState("");

  const [reenviarEmail, setReenviarEmail] = useState("");
  const [reenviarMostrar, setReenviarMostrar] = useState(false);
  const [reenviarMsg, setReenviarMsg] = useState("");

  const inputCls = (hasErr = false) =>
    `w-full text-[14px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b ${
      hasErr ? "border-red-400" : "border-slate-200"
    } focus:border-slate-900 py-2.5 transition-colors outline-none`;

  const labelCls = "font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block mb-1.5";

  const resetOlvide = () => {
    setOlvideStep("email");
    setOlvideEmail("");
    setOlvideCodigo("");
    setOlvideNuevaPass("");
    setOlvideConfirmPass("");
    setOlvideMsg("");
    setError("");
  };

  const handleOlvideRequest = async (e) => {
    e.preventDefault();
    setError(""); setOlvideMsg(""); setOlvideLoading(true);
    try {
      const r = await fetch(`${API_URL}/password-reset/request`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: olvideEmail.trim() }),
      });
      const data = await r.json();
      if (data.success) { setOlvideMsg(data.message); setOlvideStep("codigo"); }
      else setError(data.message || "No se pudo enviar el código.");
    } catch { setError("Error al conectar con el servidor."); }
    finally { setOlvideLoading(false); }
  };

  const handleOlvideVerify = async (e) => {
    e.preventDefault();
    setError(""); setOlvideLoading(true);
    try {
      const r = await fetch(`${API_URL}/password-reset/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: olvideEmail.trim(), codigo: olvideCodigo }),
      });
      const data = await r.json();
      if (data.success) { setOlvideStep("password"); setOlvideMsg(""); }
      else setError(data.message || "Código incorrecto.");
    } catch { setError("Error al conectar con el servidor."); }
    finally { setOlvideLoading(false); }
  };

  const handleOlvideConfirm = async (e) => {
    e.preventDefault();
    setError("");
    if (olvideNuevaPass !== olvideConfirmPass) { setError("Las contraseñas no coinciden."); return; }
    if (olvideNuevaPass.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setOlvideLoading(true);
    try {
      const r = await fetch(`${API_URL}/password-reset/confirm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: olvideEmail.trim(), codigo: olvideCodigo, nuevaPassword: olvideNuevaPass }),
      });
      const data = await r.json();
      if (data.success) setOlvideStep("done");
      else setError(data.message || "No se pudo cambiar la contraseña.");
    } catch { setError("Error al conectar con el servidor."); }
    finally { setOlvideLoading(false); }
  };

  const handleReenviarCodigo = async (e) => {
    e.preventDefault();
    setReenviarMsg(""); setError("");
    try {
      const r = await fetch(`${API_URL}/emergencia/reenviar-codigo`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: reenviarEmail.trim() }),
      });
      const data = await r.json();
      if (data.success) setReenviarMsg(data.message);
      else setError(data.message || "No se pudo reenviar el código.");
    } catch { setError("Error al conectar con el servidor."); }
  };

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
        method: "POST", headers: { "Content-Type": "application/json" },
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
    } catch { setError("Error al conectar con el servidor. Inténtalo de nuevo."); }
  };

  const handleLoginCodigo = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{4}$/.test(codigo)) { setError("El código debe tener 4 dígitos."); return; }
    try {
      const response = await fetch(`${API_URL}/login-codigo`, {
        method: "POST", headers: { "Content-Type": "application/json" },
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
    } catch { setError("Error al conectar con el servidor. Inténtalo de nuevo."); }
  };

  /* ── SPLASH ─────────────────────────────────────────── */
  if (splash) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-5 z-[9999]">
        <CrossLogo size={36} />
        <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400">MediConnect</span>
        <p className="text-[28px] font-semibold tracking-[-0.025em] text-slate-900 mt-2">
          Bienvenido, {splash.nombre}
        </p>
        <div className="flex gap-2 mt-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-slate-900"
              style={{ animation: `_pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <style>{`@keyframes _pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
      </div>
    );
  }

  /* ── MAIN ───────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen font-['Inter',sans-serif]">

      {/* ── PANEL IZQUIERDO ── */}
      <div className="hidden lg:flex lg:w-[400px] xl:w-[460px] flex-col justify-between bg-slate-900 px-14 py-16 flex-shrink-0">
        <div className="flex items-center gap-3">
          <CrossLogo size={20} color="#fff" />
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-white">MediConnect</span>
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-500 mb-5">
            Sistema Hospitalario
          </p>
          <h1 className="text-[36px] font-semibold tracking-[-0.025em] text-white leading-[1.1] mb-5">
            Gestión hospitalaria moderna.
          </h1>
          <p className="text-[14px] text-slate-400 leading-relaxed max-w-xs">
            Administra citas, doctores y pacientes en una plataforma segura y unificada.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="material-symbols-outlined text-[15px]">verified_user</span>
            <span className="font-mono text-[11px] tracking-wide">Acceso Seguro</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="material-symbols-outlined text-[15px]">lock</span>
            <span className="font-mono text-[11px] tracking-wide">Datos Encriptados</span>
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO ── */}
      <div className="flex-1 bg-[#F1F5F9] flex items-center justify-center px-6 py-12 relative">

        <button
          type="button"
          onClick={() => navigate("/")}
          className="absolute top-6 right-6 lg:top-8 lg:right-8 font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400 hover:text-slate-900 transition-colors"
        >
          ← Volver al inicio
        </button>

        <div className="bg-white w-full max-w-[420px] px-10 py-12">

          {/* Eyebrow + Título */}
          <div className="mb-8">
            <p className={labelCls}>
              {modo === "codigo" ? "Acceso · Emergencia" : modo === "olvide" ? "Recuperar · Acceso" : "Acceso · Sistema"}
            </p>
            <h2 className="text-[30px] font-semibold tracking-[-0.025em] text-slate-900 leading-[1.1]">
              {modo === "codigo"
                ? "Código de emergencia"
                : modo === "olvide"
                ? "Recuperar contraseña"
                : "Iniciar sesión"}
            </h2>
          </div>

          {/* ── FLUJO OLVIDÉ CONTRASEÑA ── */}
          {modo === "olvide" && (
            <div className="space-y-6">
              {olvideStep === "email" && (
                <form onSubmit={handleOlvideRequest} className="space-y-6">
                  <div>
                    <label className={labelCls}>Correo electrónico</label>
                    <input
                      type="email" required value={olvideEmail}
                      onChange={(e) => { setOlvideEmail(e.target.value); setError(""); }}
                      className={inputCls()}
                      placeholder="tucorreo@ejemplo.com"
                    />
                  </div>
                  {error && <p className="text-[12px] text-red-500">{error}</p>}
                  <button type="submit" disabled={olvideLoading}
                    className="w-full rounded-full bg-slate-900 hover:bg-slate-700 text-white text-[13px] font-semibold py-3 transition-colors disabled:opacity-50">
                    {olvideLoading ? "Enviando..." : "Enviar código"}
                  </button>
                </form>
              )}

              {olvideStep === "codigo" && (
                <form onSubmit={handleOlvideVerify} className="space-y-6">
                  {olvideMsg && (
                    <p className="text-[12px] text-slate-500">
                      Código enviado a <span className="font-mono text-slate-900">{olvideEmail}</span>
                    </p>
                  )}
                  <div>
                    <label className={labelCls}>Código de 6 dígitos</label>
                    <input
                      type="text" inputMode="numeric" maxLength={6} required value={olvideCodigo}
                      onChange={(e) => { setOlvideCodigo(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                      className="w-full h-14 text-center text-[28px] font-black tracking-[0.4em] bg-transparent border-b border-slate-200 focus:border-slate-900 text-slate-900 font-mono outline-none transition-colors"
                      placeholder="······"
                    />
                    <p className="text-[11px] text-slate-400 mt-2">El código expira en 15 minutos.</p>
                  </div>
                  {error && <p className="text-[12px] text-red-500">{error}</p>}
                  <button type="submit" disabled={olvideLoading || olvideCodigo.length !== 6}
                    className="w-full rounded-full bg-slate-900 hover:bg-slate-700 text-white text-[13px] font-semibold py-3 transition-colors disabled:opacity-50">
                    {olvideLoading ? "Verificando..." : "Verificar código"}
                  </button>
                  <button type="button"
                    onClick={() => { setOlvideStep("email"); setOlvideCodigo(""); setOlvideMsg(""); setError(""); }}
                    className="w-full text-[12px] text-slate-400 hover:text-slate-700 transition-colors">
                    Usar otro correo
                  </button>
                </form>
              )}

              {olvideStep === "password" && (
                <form onSubmit={handleOlvideConfirm} className="space-y-6">
                  <div>
                    <label className={labelCls}>Nueva contraseña</label>
                    <input
                      type="password" required minLength={6} autoComplete="new-password"
                      value={olvideNuevaPass}
                      onChange={(e) => { setOlvideNuevaPass(e.target.value); setError(""); }}
                      className={inputCls()} placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Confirmar contraseña</label>
                    <input
                      type="password" required minLength={6} autoComplete="new-password"
                      value={olvideConfirmPass}
                      onChange={(e) => { setOlvideConfirmPass(e.target.value); setError(""); }}
                      className={inputCls()} placeholder="Repítela"
                    />
                  </div>
                  {error && <p className="text-[12px] text-red-500">{error}</p>}
                  <button type="submit" disabled={olvideLoading}
                    className="w-full rounded-full bg-slate-900 hover:bg-slate-700 text-white text-[13px] font-semibold py-3 transition-colors disabled:opacity-50">
                    {olvideLoading ? "Guardando..." : "Cambiar contraseña"}
                  </button>
                </form>
              )}

              {olvideStep === "done" && (
                <div className="text-center space-y-5 pt-2">
                  <CrossLogo size={32} />
                  <p className="text-[14px] text-slate-500 mt-2">
                    Contraseña actualizada. Ya puedes iniciar sesión.
                  </p>
                  <button type="button"
                    onClick={() => { setModo("normal"); resetOlvide(); }}
                    className="w-full rounded-full bg-slate-900 hover:bg-slate-700 text-white text-[13px] font-semibold py-3 transition-colors">
                    Ir al login
                  </button>
                </div>
              )}

              {olvideStep !== "done" && (
                <button type="button"
                  onClick={() => { setModo("normal"); resetOlvide(); }}
                  className="w-full text-[12px] text-slate-400 hover:text-slate-700 transition-colors mt-2">
                  Cancelar y volver al login
                </button>
              )}
            </div>
          )}

          {/* ── TABS NORMAL / CÓDIGO ── */}
          {modo !== "olvide" && (
            <>
              {/* Tabs underline */}
              <div className="flex border-b border-slate-100 mb-8">
                <button
                  type="button"
                  onClick={() => { setModo("normal"); setError(""); }}
                  className={`pb-3 mr-6 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
                    modo === "normal"
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => { setModo("codigo"); setError(""); }}
                  className={`pb-3 mr-6 text-[13px] font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                    modo === "codigo"
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">emergency</span>
                  Emergencia
                </button>
              </div>

              {/* ── FORMULARIO CÓDIGO EMERGENCIA ── */}
              {modo === "codigo" ? (
                <form onSubmit={handleLoginCodigo} className="space-y-6">
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.22em] uppercase text-red-400 block mb-1.5">
                      Código de 4 dígitos
                    </label>
                    <input
                      id="codigo" type="text" inputMode="numeric" maxLength={4} required
                      value={codigo}
                      onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }}
                      className="w-full h-14 text-center text-[28px] font-black tracking-[0.5em] bg-transparent border-b border-red-200 focus:border-red-500 text-red-700 font-mono outline-none transition-colors"
                      placeholder="····"
                    />
                    <p className="text-[11px] text-slate-400 mt-2">
                      Código recibido al solicitar atención de emergencia.{" "}
                      <span className="block mt-0.5">Solo puede usarse 3 veces.</span>
                    </p>
                  </div>

                  {error && <p className="text-[12px] text-red-500">{error}</p>}

                  <button type="submit"
                    className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold py-3 transition-colors">
                    Acceder con código
                  </button>

                  {/* Reenviar código */}
                  <div className="pt-4 border-t border-slate-100">
                    {!reenviarMostrar ? (
                      <button type="button"
                        onClick={() => { setReenviarMostrar(true); setReenviarMsg(""); }}
                        className="text-[12px] text-red-500 hover:underline w-full text-center">
                        ¿Olvidaste el código? Reenviarlo a mi correo
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <label className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block">
                          Reenviar código por correo
                        </label>
                        <input
                          type="email" value={reenviarEmail}
                          onChange={(e) => { setReenviarEmail(e.target.value); setReenviarMsg(""); setError(""); }}
                          className="w-full text-[14px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b border-slate-200 focus:border-slate-900 py-2.5 outline-none transition-colors"
                          placeholder="El correo que usaste en la emergencia"
                        />
                        {reenviarMsg && (
                          <p className="text-[12px] text-emerald-600">{reenviarMsg}</p>
                        )}
                        <div className="flex gap-3">
                          <button type="button"
                            onClick={() => { setReenviarMostrar(false); setReenviarEmail(""); setReenviarMsg(""); }}
                            className="flex-1 py-2 text-[12px] font-semibold text-slate-500 border-b border-slate-200 hover:border-slate-900 hover:text-slate-900 transition-colors">
                            Cancelar
                          </button>
                          <button type="button" onClick={handleReenviarCodigo} disabled={!reenviarEmail}
                            className="flex-1 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold transition-colors disabled:opacity-50">
                            Reenviar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </form>

              ) : (
              /* ── FORMULARIO LOGIN NORMAL ── */
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className={labelCls} htmlFor="username">Correo electrónico</label>
                    <input
                      id="username" type="email" required value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      className={inputCls()}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className={labelCls} htmlFor="password">Contraseña</label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        className={inputCls() + " pr-8"}
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 inset-y-0 flex items-end pb-2.5 text-slate-400 hover:text-slate-900 transition-colors">
                        <span className="material-symbols-outlined text-[18px] select-none">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-[12px] text-red-500">{error}</p>}

                  <button type="submit"
                    className="w-full rounded-full bg-slate-900 hover:bg-slate-700 text-white text-[13px] font-semibold py-3 transition-colors">
                    Iniciar sesión
                  </button>

                  <div className="flex items-center justify-between">
                    <button type="button"
                      onClick={() => { setModo("olvide"); resetOlvide(); }}
                      className="text-[12px] text-slate-400 hover:text-slate-900 transition-colors">
                      ¿Olvidaste tu contraseña?
                    </button>
                    <button type="button" onClick={() => navigate("/register")}
                      className="text-[12px] font-semibold text-slate-900 hover:underline">
                      Regístrate
                    </button>
                  </div>
                </form>
              )}

              {/* Emergencia médica */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate("/emergencia")}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-[13px] transition-colors rounded-full"
                >
                  <span className="material-symbols-outlined text-[16px]">emergency</span>
                  ¿Emergencia médica? Solicitar atención
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
