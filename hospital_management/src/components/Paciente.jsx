import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import LoadingOverlay from "./LoadingOverlay";
import ConfirmModal from "./ConfirmModal";
import { validateFechaCita, todayString } from "../utils/validations";

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
  const acceptedApps = appointments.filter(a => a.estado === "ACEPTADA").sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
  const nextAppMatch = acceptedApps.length > 0 ? acceptedApps[0] : null;

  return (
    <div className="bg-[#f0fafb] text-slate-900 min-h-screen flex font-['Inter',sans-serif]">
      <LoadingOverlay visible={loading} />

      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 10001,
          padding: '12px 20px', borderRadius: '12px',
          background: notification.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${notification.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          color: notification.type === 'success' ? '#065F46' : '#991B1B',
          fontSize: '13px', fontWeight: '600', fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: '320px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {notification.type === 'success' ? 'check_circle' : 'error'}
          </span>
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

      {/* Sidebar Navigation */}
      <aside className={`w-[280px] bg-white border-r border-slate-200/60 flex flex-col fixed h-full z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full shadow-none'} lg:shadow-sm`}>
        {/* Logo matching Admin */}
        <div className="p-7 pb-4">
            <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-[#006B76] to-[#004F5A] rounded-xl p-2.5 text-white shadow-lg shadow-[#B2E5E8] ring-4 ring-[#E0F5F7]/50">
                    <span className="material-symbols-outlined text-2xl">local_hospital</span>
                </div>
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">MediConnect</h1>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Portal Paciente</p>
                </div>
            </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 mt-6">
            <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4 opacity-70">Navegación</p>
            {/* Active: Panel Principal */}
            <button
                onClick={() => { setActiveTab("panel"); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 bg-[#006B76] text-white shadow-lg shadow-[#84D4D9]`}
            >
                <span className="material-symbols-outlined text-[22px]" data-icon="dashboard">dashboard</span>
                <span className="tracking-tight">Panel Principal</span>
            </button>
        </nav>

        <div className="mt-auto space-y-2 px-4 pb-6">
            <button 
                onClick={scrollToForm}
                className="w-full mb-4 bg-gradient-to-r from-[#006B76] to-[#004F5A] text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#84D4D9] active:scale-95 transition-transform"
            >
                <span className="material-symbols-outlined text-[20px]" data-icon="add_circle">add_circle</span>
                Nueva Cita
            </button>

            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 font-bold transition-colors"
                title="Cerrar Sesión"
            >
                <span className="material-symbols-outlined">logout</span>
                <span className="text-sm">Cerrar Sesión</span>
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[280px]">
        {/* Mobile Header exactly like Admin.jsx */}
        <header className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-5 py-4 flex items-center justify-between z-30">
            <div className="flex items-center gap-3">
                <div className="bg-[#006B76] rounded-lg p-1.5 text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">local_hospital</span>
                </div>
                <div>
                     <h1 className="font-black leading-none text-slate-900 tracking-tight">MediConnect</h1>
                     <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Paciente</span>
                </div>
            </div>
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95 transition-transform"
            >
                <span className="material-symbols-outlined">menu</span>
            </button>
        </header>

        {/* Desktop Top Navigation */}
        <header className="hidden lg:flex sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-16 px-8 items-center justify-end z-30 w-full">
            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-900 leading-none">{userData.nombre || "Paciente"}</p>
                    <p className="text-[10px] text-[#006B76] uppercase tracking-widest font-black mt-1">Sesión Activa</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006B76] to-[#004F5A] text-white flex items-center justify-center font-bold text-lg shadow-md ring-2 ring-[#E0F5F7]">
                    {userData.nombre ? userData.nombre.substring(0, 1).toUpperCase() : "P"}
                </div>
            </div>
        </header>

        {/* Dashboard Canvas */}
        <div className="p-5 md:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8 pb-20">
            {/* Page Header */}
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                    Hola, {userData.nombre ? userData.nombre.split(' ')[0] : "visitante"}.
                </h2>
                <p className="text-slate-500 text-lg font-medium">Bienvenido a tu portal de salud. Aquí tienes un resumen de tu actividad.</p>
            </div>

            {/* Main Bento Grid */}
            <div className="grid grid-cols-12 gap-6">
                
                {/* Patient Profile Card (1/3) */}
                <section className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold tracking-tight text-slate-900">Perfil del Paciente</h3>
                        </div>
                        
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-24 h-24 rounded-full bg-[#E0F5F7] mb-4 flex items-center justify-center border-4 border-white shadow-md text-[#006B76]">
                                <span className="material-symbols-outlined text-[48px]" data-icon="account_circle" style={{fontVariationSettings: "'FILL' 1"}}>account_circle</span>
                            </div>
                            <h4 className="text-lg font-extrabold text-slate-900">{userData.nombre || "Usuario"}</h4>
                            <p className="text-sm font-bold text-slate-400 font-mono tracking-widest mt-1">ID: MC-{String(userData.id || 0).padStart(4, '0')}</p>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                <span className="text-sm font-bold text-slate-400">Total de Citas</span>
                                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">{appointments.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                <span className="text-sm font-bold text-slate-400">Aceptadas</span>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold">{appointments.filter(a => a.estado === 'ACEPTADA').length}</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-sm font-bold text-slate-400">Pendientes</span>
                                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-bold">{pendingAppsCount}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Appointment Request & List (2/3) */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    
                    {/* Request Appointment Card */}
                    <section ref={formRef} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/80 scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-[#E0F5F7] flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#006B76]" data-icon="add_circle">add_circle</span>
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight text-slate-900">Solicitar Nueva Cita</h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Especialidad</label>
                                <select 
                                    className="w-full border border-slate-200 bg-white rounded-xl py-3 px-4 focus:border-[#006B76] focus:ring-2 focus:ring-[#006B76]/20 transition-all text-sm appearance-none outline-none font-medium"
                                    value={form.doctorType}
                                    onChange={(e) => setForm({ ...form, doctorType: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione especialidad...</option>
                                    <option value="Cardiología">Cardiología</option>
                                    <option value="Dermatología">Dermatología</option>
                                    <option value="Neurología">Neurología</option>
                                    <option value="Pediatría">Pediatría</option>
                                    <option value="Medicina General">Medicina General</option>
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha Preferente</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        min={todayString()}
                                        max={(() => { const d = new Date(); d.setFullYear(d.getFullYear()+1); return d.toISOString().split('T')[0]; })()}
                                        className="w-full border border-slate-200 bg-white rounded-xl py-3 px-4 focus:border-[#006B76] focus:ring-2 focus:ring-[#006B76]/20 transition-all text-sm outline-none font-medium"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        required 
                                    />
                                    <input 
                                        type="time" 
                                        className="w-1/2 border border-slate-200 bg-white rounded-xl py-3 px-3 focus:border-[#006B76] focus:ring-2 focus:ring-[#006B76]/20 transition-all text-sm outline-none font-medium" 
                                        value={form.time} 
                                        onChange={(e) => setForm({ ...form, time: e.target.value })} 
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="col-span-full space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Motivo de la consulta</label>
                                <textarea 
                                    className="w-full border border-slate-200 bg-white rounded-xl py-4 px-4 focus:border-[#006B76] focus:ring-2 focus:ring-[#006B76]/20 transition-all text-sm resize-none outline-none" 
                                    placeholder="Describe brevemente tus síntomas o motivo..." 
                                    rows="3"
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                ></textarea>
                            </div>
                            
                            {/* Toggle emergencia */}
                            <div className="col-span-full">
                                <button
                                    type="button"
                                    onClick={() => setEsEmergencia(v => !v)}
                                    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 font-bold text-sm transition-all ${
                                        esEmergencia
                                            ? "bg-red-50 border-red-300 text-red-700"
                                            : "bg-white border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-500"
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-lg ${esEmergencia ? "animate-pulse" : ""}`}>emergency</span>
                                    <span className="flex-1 text-left">
                                        {esEmergencia ? "Marcada como EMERGENCIA — atención inmediata" : "Marcar como emergencia médica"}
                                    </span>
                                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${esEmergencia ? "bg-red-600 border-red-600" : "border-slate-300"}`}>
                                        {esEmergencia && <span className="material-symbols-outlined text-white text-xs">check</span>}
                                    </span>
                                </button>
                                {esEmergencia && (
                                    <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">La cita se asignará al primer doctor disponible y no requerirá aprobación.</p>
                                )}
                            </div>

                            <div className="col-span-full flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`text-white px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2 shadow-lg ${
                                        esEmergencia
                                            ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                                            : "bg-[#006B76] hover:bg-[#004F5A] shadow-[#84D4D9]"
                                    }`}
                                >
                                    {loading ? "Procesando..." : (
                                        <>
                                            <span className="material-symbols-outlined text-lg">{esEmergencia ? "emergency" : "send"}</span>
                                            {esEmergencia ? "Registrar Emergencia" : "Enviar Solicitud"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Appointment Management List */}
                    <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/80">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-600" data-icon="event_note">event_note</span>
                                </div>
                                <h3 className="text-2xl font-bold tracking-tight text-slate-900">Historial de Citas</h3>
                            </div>
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{appointments.length} Total</span>
                        </div>
                        
                        <div className="space-y-3">
                            {appointments.length === 0 && (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">calendar_month</span>
                                    <p className="text-slate-500 font-medium">No tienes citas registradas.</p>
                                </div>
                            )}

                            {/* Sorted to show pending/latest first conceptually */}
                            {appointments.map((app) => (
                                <div key={app.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-all rounded-xl border border-slate-100 group gap-4 ${app.estado === 'CANCELADA' ? 'opacity-60 saturate-50' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center bg-white border border-slate-200 w-14 h-14 rounded-xl shadow-sm shrink-0">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                                                {new Date(app.fecha).toLocaleDateString('es-ES', { month: 'short' })}
                                            </span>
                                            <span className="text-xl font-extrabold text-[#006B76] leading-none mt-1">
                                                {new Date(app.fecha).getDate().toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">Especialista</h4>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                <span className={`${app.estado === 'CANCELADA' ? 'line-through opacity-70' : ''}`}>
                                                    {app.doctor_tipo} • {app.hora.substring(0, 5)} hrs
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 self-end sm:self-auto">
                                        <span className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            app.estado === 'ACEPTADA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                            app.estado === 'PENDIENTE' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                            'bg-red-50 text-red-600 border-red-200'
                                        }`}>
                                            {app.estado}
                                        </span>
                                        
                                        {app.estado === "PENDIENTE" ? (
                                             <button 
                                                onClick={() => setConfirmCancel(app)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-xs font-bold"
                                                title="Cancelar Petición"
                                            >
                                                Cancelar
                                            </button>
                                        ) : (
                                            <div className="w-16"></div> /* spacer to keep alignment */
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Modal de Justificante */}
            {receipt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                <span className="material-symbols-outlined text-red-500">cancel</span>
                                Cita Cancelada
                            </h3>
                            <button onClick={() => setReceipt("")} className="text-slate-400 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">✕</button>
                        </div>
                        <pre className="bg-slate-50 border border-slate-100 p-5 rounded-xl text-xs font-mono text-slate-600 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                            {receipt}
                        </pre>
                        <button onClick={() => setReceipt("")} className="w-full mt-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition-colors">Entendido</button>
                    </div>
                </div>
            )}

            {/* Dashboard Stats Ticker (Bottom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl flex items-center gap-4 border border-slate-200/80 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined">calendar_clock</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">Siguiente Cita</p>
                        <p className="text-base font-extrabold text-slate-900 mt-0.5 truncate">
                            {nextAppMatch ? new Date(nextAppMatch.fecha).toLocaleDateString() : 'Sin citas confirmadas'}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl flex items-center gap-4 border border-slate-200/80 shadow-sm">
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined">pending_actions</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Peticiones Pendientes</p>
                        <p className="text-lg font-extrabold text-slate-900 mt-0.5">{pendingAppsCount} en curso</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}