import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import LoadingOverlay from "./LoadingOverlay";

const ESPECIALIDADES = [
  "Cardiología", "Dermatología", "Neurología", "Pediatría", "Medicina General",
];

export default function Emergencia() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ nombre: "", especialidad: "", motivo: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim() || !form.especialidad || !form.motivo.trim()) {
      setError("Completa los campos obligatorios.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/emergencia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          especialidad: form.especialidad,
          motivo: form.motivo.trim(),
          email: form.email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.message || "No se pudo registrar la emergencia.");
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-slate-200 bg-white rounded-xl py-3 px-4 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all text-sm outline-none font-medium placeholder:text-slate-400";

  return (
    <div className="auth-scope">
      <LoadingOverlay visible={loading} />

      <div className="flex min-h-screen w-full font-['Inter',sans-serif]">

        {/* ── PANEL IZQUIERDO ── */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: "linear-gradient(145deg, #004F5A 0%, #006B76 40%, #7f1d1d 100%)" }}>
          {/* Imagen de fondo */}
          <div
            className="absolute inset-0 z-0 opacity-20 bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=2070&auto=format&fit=crop')" }}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to bottom right, rgba(0,79,90,0.85) 0%, rgba(127,29,29,0.6) 100%)" }} />

          {/* Círculos decorativos */}
          <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full z-10" style={{ background: "rgba(239,68,68,0.15)" }} />
          <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full z-10" style={{ background: "rgba(0,107,118,0.25)" }} />

          <div className="relative z-20 flex flex-col justify-between p-16 w-full text-white h-full">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-white/15 p-2 rounded-xl backdrop-blur-md border border-white/20">
                <span className="material-symbols-outlined text-white text-3xl">local_hospital</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">MediConnect</span>
            </div>

            {/* Central content */}
            <div>
              {/* Badge pulsante */}
              <div className="inline-flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-red-400/40">
                <span className="material-symbols-outlined text-white text-base animate-pulse">emergency</span>
                <span className="text-xs font-extrabold uppercase tracking-widest text-red-100">Línea de Emergencia</span>
              </div>

              <h1 className="text-5xl font-extrabold leading-tight mb-5">
                Atención<br />
                <span style={{ color: "#fca5a5" }}>Inmediata</span>
              </h1>
              <p className="text-lg text-white/80 max-w-sm leading-relaxed">
                No necesitas cuenta. Llena el formulario y un doctor será asignado en segundos.
              </p>

              {/* Steps */}
              <div className="mt-10 space-y-4">
                {[
                  { icon: "edit_note", label: "Completa los datos mínimos" },
                  { icon: "person_add", label: "Se asigna un doctor disponible" },
                  { icon: "medical_services", label: "Atención inmediata garantizada" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: i === 0 ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.12)" }}>
                      <span className="material-symbols-outlined text-white text-base">{step.icon}</span>
                    </div>
                    <span className="text-sm font-semibold text-white/85">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-8 text-sm font-medium text-white/60">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Sin cuenta requerida
              </span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">bolt</span>
                Asignación instantánea
              </span>
            </div>
          </div>
        </div>

        {/* ── PANEL DERECHO ── */}
        <div className="flex flex-col w-full lg:w-1/2 bg-white justify-center px-8 sm:px-16 lg:px-14 py-12 relative">

          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-red-100 p-2 rounded-xl">
              <span className="material-symbols-outlined text-red-600 text-2xl">emergency</span>
            </div>
            <div>
              <p className="font-black text-slate-900 leading-none">MediConnect</p>
              <p className="text-xs text-red-500 font-bold mt-0.5">Línea de Emergencia</p>
            </div>
          </div>

          {/* Botón volver */}
          <button
            onClick={() => navigate("/login")}
            className="absolute top-6 right-6 flex items-center gap-1.5 text-slate-400 hover:text-[#006B76] text-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver al login
          </button>

          <div className="max-w-md w-full mx-auto">

            {!result ? (
              <>
                {/* Header del formulario */}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full mb-4">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span>
                    <span className="text-xs font-extrabold text-red-600 uppercase tracking-widest">Emergencia activa</span>
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Solicitar atención</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Un doctor será asignado <span className="font-bold text-slate-700">inmediatamente</span> al enviar. No necesitas iniciar sesión.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Nombre */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                      Nombre del Paciente <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">person</span>
                      <input
                        type="text"
                        className="w-full border border-slate-200 bg-white rounded-xl py-3 pl-10 pr-4 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all text-sm outline-none font-medium placeholder:text-slate-400"
                        placeholder='"Juan Pérez" o "No identificado"'
                        value={form.nombre}
                        onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  {/* Especialidad */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                      Especialidad Requerida <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">medical_services</span>
                      <select
                        className="w-full border border-slate-200 bg-white rounded-xl py-3 pl-10 pr-4 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all text-sm outline-none font-medium appearance-none"
                        value={form.especialidad}
                        onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}
                        required
                      >
                        <option value="">Seleccione especialidad...</option>
                        {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Motivo */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                      Motivo / Síntomas <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={3}
                      placeholder="Describe brevemente el motivo de la emergencia..."
                      value={form.motivo}
                      onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Email opcional */}
                  <div className="bg-[#E0F5F7]/60 border border-[#B2E5E8] rounded-xl p-4">
                    <label className="text-xs font-bold text-[#006B76] uppercase tracking-widest block mb-1.5">
                      ¿Ya tienes cuenta? <span className="text-slate-400 normal-case font-medium">— Ingresa tu correo (opcional)</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#006B76]/60 text-[18px]">email</span>
                      <input
                        type="email"
                        className="w-full border border-[#B2E5E8] bg-white rounded-xl py-3 pl-10 pr-4 focus:border-[#006B76] focus:ring-2 focus:ring-[#006B76]/20 transition-all text-sm outline-none font-medium placeholder:text-slate-400"
                        placeholder="tucorreo@ejemplo.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
                      <span className="material-symbols-outlined text-base">error</span>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined">emergency</span>
                    Solicitar Atención de Emergencia
                  </button>
                </form>
              </>

            ) : (
              /* ── TARJETA DE CONFIRMACIÓN ── */
              <div>
                {/* Header confirmación */}
                <div className="text-center mb-8">
                  <div className="relative inline-flex mb-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#006B76] to-[#004F5A] flex items-center justify-center shadow-lg shadow-[#84D4D9]">
                      <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center border-2 border-white">
                      <span className="material-symbols-outlined text-white text-xs">emergency</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">¡Emergencia Registrada!</h2>
                  <p className="text-slate-500 text-sm">El doctor ya fue notificado y está al tanto de tu caso.</p>
                </div>

                {/* Info doctor */}
                <div className="bg-gradient-to-br from-[#E0F5F7] to-[#f0fafb] border border-[#B2E5E8] rounded-2xl p-5 mb-5">
                  <p className="text-[10px] font-extrabold text-[#006B76] uppercase tracking-widest mb-3">Detalles de la asignación</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[#B2E5E8]/60">
                      <div className="w-9 h-9 rounded-xl bg-[#006B76] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white text-base">stethoscope</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Doctor Asignado</p>
                        <p className="text-sm font-extrabold text-slate-800">{result.doctorNombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[#B2E5E8]/60">
                      <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white text-base">schedule</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hora de Registro</p>
                        <p className="text-sm font-extrabold text-slate-800">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Código de emergencia */}
                {result.esNuevo && result.codigoEmergencia && (
                  <div className="bg-gradient-to-br from-red-50 to-amber-50 border-2 border-red-200 rounded-2xl p-5 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-red-600 text-base">key</span>
                      <p className="text-xs font-extrabold text-red-700 uppercase tracking-widest">Tu código de acceso</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 my-4">
                      {result.codigoEmergencia.split("").map((d, i) => (
                        <div key={i} className="w-14 h-16 rounded-xl bg-white border-2 border-red-300 flex items-center justify-center shadow-sm">
                          <span className="text-3xl font-black text-red-700 font-mono">{d}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.codigoEmergencia)}
                      className="w-full bg-white border border-red-200 text-red-700 hover:bg-red-50 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors mb-3"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      Copiar código
                    </button>
                    <p className="text-[11px] text-slate-600 leading-relaxed text-center">
                      <span className="font-bold">Guarda este código.</span> Si pierdes la sesión, podrás volver a entrar a tu perfil ingresándolo en el login.
                      <span className="block mt-1 text-slate-500">Por seguridad solo puede usarse <span className="font-bold">3 veces</span>.</span>
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      // Auto-login: guardar sesión y entrar al perfil
                      localStorage.setItem("userId", result.pacienteId);
                      localStorage.setItem("userName", result.pacienteNombre || "Paciente");
                      localStorage.setItem("userRole", "paciente");
                      if (result.codigoEmergencia) {
                        localStorage.setItem("codigoEmergencia", result.codigoEmergencia);
                      }
                      navigate("/paciente");
                    }}
                    className="w-full bg-[#006B76] hover:bg-[#004F5A] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-[#84D4D9]/40"
                  >
                    <span className="material-symbols-outlined text-base">login</span>
                    Entrar a mi perfil
                  </button>
                  <button
                    onClick={() => { setResult(null); setForm({ nombre: "", especialidad: "", motivo: "", email: "" }); }}
                    className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 py-3.5 rounded-xl font-semibold text-sm transition-colors"
                  >
                    Registrar otra emergencia
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
