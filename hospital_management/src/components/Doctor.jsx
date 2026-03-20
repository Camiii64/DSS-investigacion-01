import { useState, useEffect } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "./LoadingOverlay";
import ConfirmModal from "./ConfirmModal";

export default function DoctorPanel() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [responses, setResponses] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorId, setDoctorId] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("citas");
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

  const renderTopBar = (title, subtitle) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
        <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
      </div>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
        <input
          type="text"
          placeholder="Buscar pacientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#22A5AE] w-full sm:w-72 transition-all"
        />
      </div>
    </div>
  );

  const renderCitas = () => (
    <div className="max-w-7xl mx-auto pb-10">
      {renderTopBar("Panel de Consultas", "Gestiona y atiende las solicitudes biomédicas actuales")}

      <div className="flex flex-col lg:flex-row gap-6">
        <section className="lg:w-1/3 flex flex-col gap-6 order-2 lg:order-1">
          {/* Emergencias Activas */}
          {emergencyApps.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-red-300 shadow-sm shadow-red-100 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-red-100 flex items-center justify-between bg-red-50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600 text-lg animate-pulse">emergency</span>
                  <h3 className="font-bold text-red-700 text-sm">Emergencias Activas</h3>
                </div>
                <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded-full animate-pulse">{emergencyApps.length}</span>
              </div>
              <div className="divide-y divide-red-50">
                {emergencyApps.map(app => (
                  <div key={app.id} className="px-5 py-4 flex items-center gap-4 bg-red-50/30">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-700 text-sm font-bold shrink-0">
                      {app.patientName?.charAt(0)?.toUpperCase() || "E"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{app.patientName}</p>
                        <span className="text-[9px] font-extrabold text-red-600 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0">EMERG.</span>
                      </div>
                      <p className="text-xs text-red-400 mt-0.5 truncate">{app.motivo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-lg">pending_actions</span>
                <h3 className="font-bold text-slate-800 text-sm">Próximas Citas</h3>
              </div>
              {pendingApps.length > 0 && (
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{pendingApps.length}</span>
              )}
            </div>

            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto no-scrollbar">
              {pendingApps.length === 0 && (
                <div className="px-6 py-10 text-center text-slate-400 text-sm">No hay actividad reciente</div>
              )}
              {pendingApps.map(app => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`px-5 py-4 cursor-pointer transition-colors flex items-center gap-4 ${selectedApp?.id === app.id ? 'bg-[#E0F5F7] hover:bg-[#B2E5E8]/50' : 'hover:bg-slate-50/80'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${selectedApp?.id === app.id ? 'bg-[#006B76] shadow-md shadow-[#84D4D9]' : 'bg-slate-300'}`}>
                    {app.patientName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${selectedApp?.id === app.id ? 'text-[#001F23]' : 'text-slate-800'}`}>{app.patientName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(app.fecha_solicitada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Petición</p>
                  </div>
                  <span className={`material-symbols-outlined text-lg ${selectedApp?.id === app.id ? 'text-[#006B76]' : 'text-slate-300'}`}>chevron_right</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <span className="material-symbols-outlined text-emerald-500 text-lg">fact_check</span>
              <h3 className="font-bold text-slate-800 text-sm">Citas Aceptadas</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto no-scrollbar">
              {acceptedApps.length === 0 && (
                <div className="px-6 py-10 text-center text-slate-400 text-sm">Lista vacía</div>
              )}
              {acceptedApps.map(app => (
                <div key={app.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{app.patientName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{new Date(app.fecha_solicitada).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">Confirmada</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:w-2/3 order-1 lg:order-2">
          {!selectedApp ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-10 flex flex-col items-center justify-center min-h-[500px] text-center">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-300">calendar_month</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Ninguna solicitud en revisión</h2>
              <p className="text-slate-500 mt-2 text-sm max-w-sm">Selecciona una cita pendiente de la lista lateral para visualizar sus detalles y tomar acción.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#006B76] uppercase mb-1.5 block">Revisión de Solicitud</span>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Detalle Petición</h2>
                </div>
                <div className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-2 self-start sm:self-auto shadow-sm">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span className="text-xs font-bold uppercase tracking-wide">Esperando Respuesta</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#006B76] to-[#004F5A] flex items-center justify-center shadow-lg shadow-[#84D4D9] text-5xl font-extrabold text-white mb-5 ring-4 ring-[#E0F5F7]">
                    {selectedApp.patientName?.charAt(0)?.toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedApp.patientName}</h3>
                  <p className="text-slate-400 mt-1 text-xs font-medium bg-slate-50 px-2 py-1 rounded-md">PT-{selectedApp.id.toString().substring(0, 6).toUpperCase()}</p>
                </div>

                <div className="md:w-2/3 flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha Sugerida</p>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#006B76] text-sm">event</span>
                        <p className="font-semibold text-slate-800 text-sm">{new Date(selectedApp.fecha_solicitada).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hora</p>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#006B76] text-sm">schedule</span>
                        <p className="font-semibold text-slate-800 text-sm">{new Date(selectedApp.fecha_solicitada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#E0F5F7]/50 border border-[#B2E5E8]/50 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-[#22A5AE] uppercase tracking-wider mb-2">Motivo de la consulta</p>
                    <p className="text-slate-700 text-sm leading-relaxed italic">
                      "{selectedApp.motivo || "Consulta médica general."}"
                    </p>
                  </div>

                  <div className="space-y-2 mt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Respuesta / Indicaciones</p>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#22A5AE] p-4 text-sm resize-none outline-none transition-all"
                      placeholder="Escribe comentarios pre-consulta o razón de rechazo..."
                      rows="3"
                      value={responses[selectedApp.id] || ""}
                      onChange={(e) =>
                        setResponses({ ...responses, [selectedApp.id]: e.target.value })
                      }
                    ></textarea>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                      onClick={() => handleAccept(selectedApp.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Aceptar Cita
                    </button>
                    <button
                      onClick={() => handleReject(selectedApp.id)}
                      className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">cancel</span>
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );

  const renderPacientes = () => {
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

    const upcomingAppointments = acceptedApps.slice(0, 3);

    return (
      <div className="max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mis Pacientes</h1>
            <p className="text-slate-500 font-medium mt-1">{patientList.length} Pacientes Totales • {pendingApps.length} Solicitudes recientes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {patientList.length === 0 && (
              <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="material-symbols-outlined text-4xl mb-2 block">person_off</span>
                <p className="text-sm">No tienes pacientes registrados según tu búsqueda</p>
              </div>
            )}
            {patientList.map((patient, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between group hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 border border-slate-200/80 gap-4">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-[#E0F5F7] text-[#006B76] flex items-center justify-center text-2xl font-bold">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#006B76] transition-colors">{patient.name}</h3>
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-0.5">PT-{patient.id.toString().substring(0, 6).toUpperCase()}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">event</span>
                        Última visita: {new Date(patient.latest).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  <button className="p-3 text-[#006B76] bg-[#E0F5F7] hover:bg-[#B2E5E8] hover:text-[#004F5A] rounded-xl transition-all active:scale-95" title="Ver Historial">
                    <span className="material-symbols-outlined">clinical_notes</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-[#006B76] p-6 rounded-2xl text-white shadow-xl shadow-[#006B76]/20 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[#A2D9DC] text-xs font-bold uppercase tracking-widest">En espera</p>
                <h4 className="text-4xl font-extrabold mt-2 tracking-tighter">{pendingApps.length} <span className="text-lg font-medium opacity-70">Solicitudes</span></h4>
                <p className="text-sm mt-4 opacity-80 leading-relaxed">Pacientes pendientes de confirmación de cita médica.</p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#A2D9DC]/30 rounded-full blur-xl"></div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Alertas Recientes</h4>
              <div className="space-y-4">
                {pendingApps.slice(0, 2).map(app => (
                  <div
                    key={app.id}
                    onClick={() => { setActiveTab("citas"); setSelectedApp(app); }}
                    className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{app.patientName}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">Nueva solicitud de cita</p>
                    </div>
                  </div>
                ))}
                {pendingApps.length === 0 && (
                  <p className="text-xs text-slate-500 text-center italic py-2">No hay alertas nuevas</p>
                )}
              </div>
              {pendingApps.length > 2 && (
                <button
                  onClick={() => { setActiveTab("citas"); setSearchTerm(""); }}
                  className="w-full mt-4 py-2 text-xs font-bold text-[#006B76] hover:underline"
                >
                  Ver todas las solicitudes
                </button>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Próximas Citas</h4>
                <span className="material-symbols-outlined text-slate-400 text-lg">calendar_month</span>
              </div>
              <div className="space-y-4">
                {upcomingAppointments.length === 0 && (
                  <p className="text-xs text-slate-500 text-center italic">No hay citas confirmadas pronto</p>
                )}
                {upcomingAppointments.map(app => (
                  <div key={app.id} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-[#E0F5F7] group-hover:text-[#006B76] transition-colors">
                        {new Date(app.fecha_solicitada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <p className="text-sm font-medium text-slate-800">{app.patientName}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-[#006B76] transition-colors">chevron_right</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const navItems = [
    { id: "citas", label: "Citas", icon: "calendar_month" },
    { id: "pacientes", label: "Pacientes", icon: "group" },
  ];

  return (
    <div className="bg-[#f0fafb] text-slate-900 min-h-screen flex font-['Inter',sans-serif]">
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

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-[280px] bg-white border-r border-slate-200/60 flex flex-col fixed h-full z-30 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full shadow-none'} lg:shadow-sm`}>
        <div className="p-7 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-[#006B76] to-[#004F5A] rounded-xl p-2.5 text-white shadow-lg shadow-[#84D4D9] ring-4 ring-[#E0F5F7]/50">
              <span className="material-symbols-outlined text-2xl">local_hospital</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">MediConnect</h1>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Health System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-6">
          <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4 opacity-70">Menú Doctor</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSearchTerm(""); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${activeTab === item.id
                ? "bg-[#006B76] text-white shadow-lg shadow-[#84D4D9]"
                : "text-slate-500 hover:bg-slate-50 hover:text-[#006B76]"
                }`}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="tracking-tight">{item.label}</span>
              {item.id === "citas" && emergencyApps.length > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse ${activeTab === item.id ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>
                  {emergencyApps.length} ⚠
                </span>
              )}
              {item.id === "citas" && emergencyApps.length === 0 && pendingApps.length > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === item.id ? "bg-white/20 text-white" : "bg-orange-100 text-orange-600"}`}>
                  {pendingApps.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-5 border-t border-slate-100 m-4 mt-0 bg-slate-50/50 rounded-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
              {doctorName ? doctorName.substring(0, 2).toUpperCase() : "DR"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{doctorName || "Doctor"}</p>
              <p className="text-[10px] text-slate-400 font-semibold truncate">Doctor Especialista</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-xl transition-all duration-200"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[280px]">
        <header className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="bg-[#006B76] rounded-lg p-1.5 text-white">
              <span className="material-symbols-outlined text-lg">local_hospital</span>
            </div>
            <h1 className="font-black text-slate-900 tracking-tight">MediConnect</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        <main className="flex-1 p-5 md:p-8 lg:p-10 overflow-x-hidden">
          {activeTab === "citas" ? renderCitas() : renderPacientes()}
        </main>
      </div>
    </div>
  );
}
