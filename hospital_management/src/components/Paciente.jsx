import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import LoadingOverlay from "./LoadingOverlay";
import ConfirmModal from "./ConfirmModal";
import { validateFechaCita, todayString } from "../utils/validations";

const Cross = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9.5" y="3" width="5" height="18" rx="1.2" fill="currentColor" />
    <rect x="3" y="9.5" width="18" height="5" rx="1.2" fill="currentColor" />
  </svg>
);

const SPECIALTIES = ["Cardiología", "Dermatología", "Neurología", "Pediatría", "Medicina General"];

export default function PatientAppointments() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ doctorType: "", date: "", time: "", reason: "" });
  const [esEmergencia, setEsEmergencia] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [notification, setNotification] = useState(null);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("panel");

  const [userData, setUserData] = useState({ id: null, nombre: "" });

  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    const storedName = localStorage.getItem("userName");

    if (!storedId) {
      navigate("/login");
      return;
    }

    setUserData({ id: storedId, nombre: storedName });
    fetchCitas(storedId);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const fetchCitas = async (pacienteId) => {
    try {
      const response = await fetch(`${API_URL}/citas/${pacienteId}`);
      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error al obtener citas:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { doctorType, date, time, reason } = form;

    if (!doctorType || !date || !time) {
      return notify("error", "Completa los campos obligatorios.");
    }

    if (!esEmergencia) {
      const fechaErr = validateFechaCita(date);
      if (fechaErr) return notify("error", fechaErr);
    }

    const isDuplicate = appointments.some((a) => {
      const dbDate = new Date(a.fecha).toISOString().split('T')[0];
      return dbDate === date && a.hora === `${time}:00` && a.estado !== "CANCELADA";
    });

    if (isDuplicate) {
      return notify("error", "Ya tienes una cita en esa fecha y hora exacta.");
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/citas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: userData.id,
          doctorType,
          date,
          time,
          reason,
          prioridad: esEmergencia ? "EMERGENCIA" : "NORMAL",
        }),
      });

      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
      const data = await response.json();

      if (data.success) {
        notify("success", esEmergencia ? "¡Emergencia registrada! Un doctor ha sido asignado." : "¡Cita agendada correctamente!");
        setForm({ doctorType: "", date: "", time: "", reason: "" });
        setEsEmergencia(false);
        fetchCitas(userData.id);
      } else {
        notify("error", data.message || "Error del servidor.");
      }
    } catch {
      notify("error", "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const doDelete = async (appointment) => {
    setConfirmCancel(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/citas/${appointment.id}/cancelar`, { method: "PUT" });
      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
      const data = await response.json();

      if (data.success) {
        fetchCitas(userData.id);
        const formattedDate = new Date(appointment.fecha).toLocaleDateString();
        setReceipt(
          `CANCELACIÓN CONFIRMADA\nEspecialidad: ${appointment.doctor_tipo}\nFecha: ${formattedDate}\nHora: ${appointment.hora}\nID: #${appointment.id}`
        );
      }
    } catch {
      notify("error", "Error al cancelar la cita.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    setIsSidebarOpen(false);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pendingAppsCount = appointments.filter(a => a.estado === "PENDIENTE").length;
  const acceptedApps = appointments.filter(a => a.estado === "ACEPTADA").sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const nextAppMatch = acceptedApps.length > 0 ? acceptedApps[0] : null;

  const firstName = userData.nombre ? userData.nombre.split(' ')[0] : "visitante";
  const initial = userData.nombre ? userData.nombre.substring(0, 1).toUpperCase() : "P";

  const navItems = [
    { id: "panel", label: "Panel" },
    { id: "nueva", label: "Nueva Cita", action: scrollToForm },
    { id: "historial", label: "Historial" },
    { id: "perfil", label: "Perfil" },
  ];

  return (
    <div className="bg-[#F1F5F9] text-slate-900 min-h-screen flex font-sans">
      <LoadingOverlay visible={loading} />

      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 10001,
          padding: '12px 20px', borderRadius: '12px',
          background: notification.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${notification.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          color: notification.type === 'success' ? '#065F46' : '#991B1B',
          fontSize: '13px', fontWeight: '600',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: '320px',
        }}>
          {notification.message}
        </div>
      )}

      <ConfirmModal
        visible={!!confirmCancel}
        message="¿Deseas cancelar esta cita? Esta acción no se puede deshacer."
        confirmLabel="Sí, Cancelar cita"
        onConfirm={() => doDelete(confirmCancel)}
        onCancel={() => setConfirmCancel(null)}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-[220px] shrink-0 bg-white border-r border-slate-100 flex flex-col fixed h-screen z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-red-600 text-white flex items-center justify-center shrink-0">
              <Cross />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">
              Medi<span className="text-red-600">Connect</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-[13.5px] transition-colors text-left ${
                activeTab === item.id && !item.action
                  ? "bg-slate-50 text-slate-900 font-medium"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-lg text-[13.5px] text-slate-500 hover:text-red-600 transition-colors text-left"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[220px]">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center">
              <Cross />
            </div>
            <span className="text-[15px] font-semibold text-slate-900">Medi<span className="text-red-600">Connect</span></span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </header>

        {/* Top bar */}
        <header className="hidden lg:flex h-16 border-b border-slate-100 items-center justify-end px-8 bg-white sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[13.5px] font-medium text-slate-900 leading-none">{userData.nombre || "Paciente"}</p>
              <p className="font-mono text-[11px] text-slate-400 mt-0.5">ID-{String(userData.id || 0).padStart(4, '0')}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-[13px] font-semibold">
              {initial}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-[860px] mx-auto px-8 pt-14 pb-24 w-full">

          {/* Header section */}
          <div className="anim-rise d-0 mb-10">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-2">Panel</p>
            <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">
              Hola, {firstName}.
            </h1>
          </div>

          {/* Next appointment */}
          <div className="anim-rise d-1 mb-12">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Próxima cita</p>
            <p className="text-[14px] text-slate-700">
              {nextAppMatch
                ? `${nextAppMatch.doctor_tipo} · ${new Date(nextAppMatch.fecha).toLocaleDateString()} · ${nextAppMatch.hora?.substring(0, 5)} hrs`
                : "Sin citas confirmadas"}
            </p>
          </div>

          {/* Form section */}
          <section ref={formRef} className="anim-rise d-2 scroll-mt-24 mb-16">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Nueva solicitud</p>
                <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900">Pedir una cita</h2>
              </div>
              {/* Emergency toggle top-right */}
              <button
                type="button"
                onClick={() => setEsEmergencia(v => !v)}
                className={`mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium border transition-colors ${
                  esEmergencia
                    ? "bg-red-600 text-white border-red-600"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${esEmergencia ? "bg-white animate-pulse" : "bg-slate-400"}`} />
                {esEmergencia ? "Emergencia activa" : "Emergencia"}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Especialidad chips */}
              <div className="grid sm:grid-cols-[140px_1fr] gap-3 sm:gap-8 items-start">
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 pt-1">Especialidad</p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setForm({ ...form, doctorType: sp })}
                      className={`px-3.5 py-1.5 rounded-full text-[13px] transition-colors ${
                        form.doctorType === sp
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha */}
              <div className="grid sm:grid-cols-[140px_1fr] gap-3 sm:gap-8 items-start">
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 pt-1">Fecha</p>
                <input
                  type="date"
                  min={todayString()}
                  max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; })()}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full text-[14px] text-slate-900 bg-transparent border-b border-slate-200 focus:border-slate-900 py-2 transition-colors outline-none"
                />
              </div>

              {/* Hora */}
              <div className="grid sm:grid-cols-[140px_1fr] gap-3 sm:gap-8 items-start">
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 pt-1">Hora</p>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                  className="w-full text-[14px] text-slate-900 bg-transparent border-b border-slate-200 focus:border-slate-900 py-2 transition-colors outline-none"
                />
              </div>

              {/* Motivo */}
              <div className="grid sm:grid-cols-[140px_1fr] gap-3 sm:gap-8 items-start">
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 pt-1">Motivo</p>
                <textarea
                  rows={3}
                  placeholder="Describe brevemente tus síntomas o motivo..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full text-[14px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b border-slate-200 focus:border-slate-900 py-2 resize-none transition-colors outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-medium transition-colors disabled:opacity-50 ${
                    esEmergencia
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {loading ? "Procesando..." : (esEmergencia ? "Registrar emergencia" : "Enviar solicitud")}
                </button>
              </div>
            </form>
          </section>

          {/* History section */}
          <section className="anim-rise d-3">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Historial</p>
            <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900 mb-6">Citas anteriores</h2>

            {appointments.length === 0 ? (
              <p className="text-[14px] text-slate-400 py-8 border-t border-slate-100">No tienes citas registradas.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.map((app) => {
                  const statusColor =
                    app.estado === "ACEPTADA" ? "text-emerald-600" :
                    app.estado === "PENDIENTE" ? "text-amber-600" :
                    "text-red-500";
                  return (
                    <div
                      key={app.id}
                      className={`flex items-center justify-between py-4 gap-4 ${app.estado === 'CANCELADA' ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-6 min-w-0 flex-1">
                        <span className="text-[13px] text-slate-500 shrink-0 w-24">
                          {new Date(app.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[13px] text-slate-900 truncate">{app.doctor_tipo}</span>
                        <span className="text-[13px] text-slate-400 shrink-0">{app.hora?.substring(0, 5)}</span>
                        <span className={`text-[12px] font-medium shrink-0 ${statusColor}`}>{app.estado}</span>
                      </div>
                      {app.estado === "PENDIENTE" && (
                        <button
                          onClick={() => setConfirmCancel(app)}
                          className="text-[12px] text-slate-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Receipt modal */}
      {receipt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-[17px] font-semibold text-slate-900">Cita Cancelada</h3>
              <button onClick={() => setReceipt("")} className="text-slate-400 hover:text-slate-700 w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center"><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>
            <pre className="bg-[#F1F5F9] border border-slate-100 p-5 rounded-xl font-mono text-[12px] text-slate-600 overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {receipt}
            </pre>
            <button
              onClick={() => setReceipt("")}
              className="w-full mt-6 inline-flex items-center justify-center px-5 py-2.5 rounded-full text-[13.5px] font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
