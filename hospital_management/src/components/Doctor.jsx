import { useState, useEffect } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "./LoadingOverlay";
import ConfirmModal from "./ConfirmModal";

const Cross = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9.5" y="3" width="5" height="18" rx="1.2" fill="currentColor" />
    <rect x="3" y="9.5" width="18" height="5" rx="1.2" fill="currentColor" />
  </svg>
);

export default function DoctorPanel() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [responses, setResponses] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorId, setDoctorId] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pendientes");
  const [selectedApp, setSelectedApp] = useState(null);

  const [loadingAction, setLoadingAction] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [notification, setNotification] = useState(null);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    const storedName = localStorage.getItem("userName");
    const role = localStorage.getItem("userRole");

    if (!storedId || role !== "doctor") {
      navigate("/login");
      return;
    }

    setDoctorId(storedId);
    setDoctorName(storedName);
    fetchAppointments(storedId);
  }, [navigate]);

  const fetchAppointments = async (id) => {
    try {
      const response = await fetch(`${API_URL}/doctor/${id}/citas`);
      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error al cargar citas:", error);
    }
  };

  const emergencyApps = appointments.filter((app) => app.prioridad === "EMERGENCIA");
  const pendingApps = appointments.filter((app) => app.estado === "PENDIENTE" && app.prioridad !== "EMERGENCIA");
  const acceptedApps = appointments.filter(
    (app) =>
      app.estado === "ACEPTADA" &&
      app.prioridad !== "EMERGENCIA" &&
      app.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const allAcceptedApps = appointments.filter((app) => app.estado === "ACEPTADA" && app.prioridad !== "EMERGENCIA");

  useEffect(() => {
    if (!selectedApp && pendingApps.length > 0) {
      setSelectedApp(pendingApps[0]);
    } else if (selectedApp && !pendingApps.find((a) => a.id === selectedApp.id)) {
      setSelectedApp(pendingApps.length > 0 ? pendingApps[0] : null);
    }
  }, [appointments, selectedApp]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleAccept = async (id) => {
    const note = responses[id] || "";
    setLoadingAction(true);
    try {
      const response = await fetch(`${API_URL}/citas/${id}/responder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "ACEPTADA", respuesta_doctor: note }),
      });
      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        fetchAppointments(doctorId);
        setResponses({ ...responses, [id]: "" });
        notify("success", "Cita aceptada correctamente.");
      }
    } catch {
      notify("error", "Error al aceptar la cita.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReject = (id) => {
    const note = responses[id] || "El doctor ha cancelado esta cita.";
    setConfirm({
      message: "Esta cita será marcada como CANCELADA y el paciente será notificado.",
      confirmLabel: "Rechazar cita",
      onConfirm: async () => {
        setConfirm(null);
        setLoadingAction(true);
        try {
          const response = await fetch(`${API_URL}/citas/${id}/responder`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: "CANCELADA", respuesta_doctor: note }),
          });
          if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
          const data = await response.json();
          if (data.success) {
            fetchAppointments(doctorId);
            notify("success", "Cita rechazada.");
          }
        } catch {
          notify("error", "Error al rechazar la cita.");
        } finally {
          setLoadingAction(false);
        }
      },
    });
  };

  const getStatusStyle = (estado) => {
    switch (estado) {
      case "ACEPTADA": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "PENDIENTE": return "bg-amber-50 text-amber-700 border border-amber-200";
      case "CANCELADA": return "bg-red-50 text-red-600 border border-red-200";
      default: return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  // Derived patient list for "pacientes" tab
  const uniquePatientsMap = new Map();
  allAcceptedApps.forEach(app => {
    if (!uniquePatientsMap.has(app.patientName)) {
      uniquePatientsMap.set(app.patientName, {
        id: app.id, name: app.patientName, visits: 1, latest: app.fecha_solicitada,
      });
    } else {
      const p = uniquePatientsMap.get(app.patientName);
      p.visits += 1;
      if (new Date(app.fecha_solicitada) > new Date(p.latest)) p.latest = app.fecha_solicitada;
    }
  });
  const patientList = Array.from(uniquePatientsMap.values()).filter(
    p => p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const doctorInitial = doctorName ? doctorName.substring(0, 1).toUpperCase() : "D";

  const navItems = [
    { id: "pendientes", label: "Citas Pendientes", badge: pendingApps.length || null },
    { id: "aceptadas", label: "Aceptadas", badge: allAcceptedApps.length || null },
    { id: "emergencias", label: "Emergencias", badge: emergencyApps.length || null, red: true },
    { id: "pacientes", label: "Perfil" },
  ];

  return (
    <div className="bg-[#F1F5F9] text-slate-900 min-h-screen flex font-sans">
      <LoadingOverlay visible={loadingAction} />
      <ConfirmModal
        visible={!!confirm}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />

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
              onClick={() => { setActiveTab(item.id); setSearchTerm(""); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13.5px] transition-colors text-left ${
                activeTab === item.id
                  ? "bg-slate-50 text-slate-900 font-medium"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  item.red ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                }`}>
                  {item.badge}
                </span>
              ) : null}
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
              <p className="text-[13.5px] font-medium text-slate-900 leading-none">{doctorName || "Doctor"}</p>
              <p className="font-mono text-[11px] text-slate-400 mt-0.5">DR-{String(doctorId || 0).padStart(4, '0')}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-[13px] font-semibold">
              {doctorInitial}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-[860px] mx-auto px-8 pt-14 pb-24 w-full">

          {/* Pending tab */}
          {activeTab === "pendientes" && (
            <div className="anim-rise d-0">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Gestión</p>
              <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none mb-10">
                Citas Pendientes
              </h1>

              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-72 text-[14px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b border-slate-200 focus:border-slate-900 py-2 transition-colors outline-none"
                />
              </div>

              {pendingApps.length === 0 ? (
                <p className="text-[14px] text-slate-400 py-8 border-t border-slate-100">No hay citas pendientes.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingApps
                    .filter(app => app.patientName?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((app) => (
                    <div key={app.id} className="py-5">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-5 min-w-0 flex-1">
                          <span className="text-[13px] text-slate-500 shrink-0 w-24">
                            {new Date(app.fecha_solicitada).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[14px] font-medium text-slate-900 truncate">{app.patientName}</span>
                          <span className="text-[13px] text-slate-400 shrink-0">
                            {new Date(app.fecha_solicitada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {app.motivo && (
                            <span className="text-[13px] text-slate-400 truncate hidden sm:block max-w-[200px]">{app.motivo}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleAccept(app.id)}
                            className="bg-slate-900 text-white rounded-full px-3 py-1 text-[12px] hover:bg-slate-800 transition-colors"
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            className="border border-slate-200 text-slate-500 rounded-full px-3 py-1 text-[12px] hover:border-slate-300 hover:text-slate-900 transition-colors"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                      <div className="ml-[116px]">
                        <textarea
                          rows={2}
                          placeholder="Respuesta o indicaciones (opcional)..."
                          value={responses[app.id] || ""}
                          onChange={(e) => setResponses({ ...responses, [app.id]: e.target.value })}
                          className="w-full text-[13px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b border-slate-200 focus:border-slate-900 py-1.5 resize-none transition-colors outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Accepted tab */}
          {activeTab === "aceptadas" && (
            <div className="anim-rise d-0">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Confirmadas</p>
              <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none mb-10">
                Citas Aceptadas
              </h1>

              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-72 text-[14px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b border-slate-200 focus:border-slate-900 py-2 transition-colors outline-none"
                />
              </div>

              {acceptedApps.length === 0 ? (
                <p className="text-[14px] text-slate-400 py-8 border-t border-slate-100">No hay citas aceptadas.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {acceptedApps.map((app) => (
                    <div key={app.id} className="flex items-center gap-5 py-4">
                      <span className="text-[13px] text-slate-500 shrink-0 w-24">
                        {new Date(app.fecha_solicitada).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="text-[14px] font-medium text-slate-900 flex-1 truncate">{app.patientName}</span>
                      <span className="text-[13px] text-slate-400 shrink-0">
                        {new Date(app.fecha_solicitada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[12px] font-medium text-emerald-600 shrink-0">Confirmada</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Emergencies tab */}
          {activeTab === "emergencias" && (
            <div className="anim-rise d-0">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-red-600">Urgente</p>
              </div>
              <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none mb-10">
                Emergencias
              </h1>

              {emergencyApps.length === 0 ? (
                <p className="text-[14px] text-slate-400 py-8 border-t border-slate-100">No hay emergencias activas.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {emergencyApps.map((app) => (
                    <div key={app.id} className="flex items-center gap-5 py-4">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-[13px] text-slate-500 w-24">
                          {new Date(app.fecha_solicitada).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <span className="text-[14px] font-medium text-slate-900 flex-1 truncate">{app.patientName}</span>
                      <span className="text-[13px] text-slate-400 shrink-0">
                        {new Date(app.fecha_solicitada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {app.motivo && (
                        <span className="text-[13px] text-slate-400 truncate hidden sm:block max-w-[200px]">{app.motivo}</span>
                      )}
                      <span className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shrink-0">
                        EMERG.
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pacientes/Perfil tab */}
          {activeTab === "pacientes" && (
            <div className="anim-rise d-0">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Doctor</p>
              <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none mb-10">
                Mis Pacientes
              </h1>

              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-72 text-[14px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b border-slate-200 focus:border-slate-900 py-2 transition-colors outline-none"
                />
              </div>

              <p className="text-[14px] text-slate-400 mb-6">{patientList.length} pacientes · {pendingApps.length} solicitudes pendientes</p>

              {patientList.length === 0 ? (
                <p className="text-[14px] text-slate-400 py-8 border-t border-slate-100">No hay pacientes registrados.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {patientList.map((patient, idx) => (
                    <div key={idx} className="flex items-center gap-5 py-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[13px] font-semibold shrink-0">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[14px] font-medium text-slate-900 flex-1 truncate">{patient.name}</span>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">PT-{patient.id.toString().substring(0, 6).toUpperCase()}</span>
                      <span className="text-[13px] text-slate-400 shrink-0 hidden sm:block">
                        Última visita: {new Date(patient.latest).toLocaleDateString()}
                      </span>
                      <span className="text-[12px] text-slate-400 shrink-0">{patient.visits} citas</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
