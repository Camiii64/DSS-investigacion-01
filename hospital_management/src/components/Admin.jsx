import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import LoadingOverlay from "./LoadingOverlay";
import ConfirmModal from "./ConfirmModal";
import {
  validateEmail, validateTelefono, validateFechaNacimiento,
  validatePassword, validateNombre, maxBirthDate, minBirthDate,
} from "../utils/validations";

// ── Design-system helpers ──────────────────────────────────────────────────
const Cross = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9.5" y="3" width="5" height="18" rx="1.2" fill="currentColor" />
    <rect x="3" y="9.5" width="18" height="5" rx="1.2" fill="currentColor" />
  </svg>
);

const getStatusStyle = (estado) => {
  switch (estado) {
    case "ACEPTADA": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "PENDIENTE": return "bg-amber-50 text-amber-700 border border-amber-200";
    case "CANCELADA": return "bg-red-50 text-red-600 border border-red-200";
    default:          return "bg-slate-100 text-slate-600 border border-slate-200";
  }
};

// ── Component ──────────────────────────────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [searchTerm, setSearchTerm]     = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loadingAction, setLoadingAction] = useState(false);
  const [confirm, setConfirm]             = useState(null);
  const [notification, setNotification]   = useState(null);
  const [adminName]                       = useState(() => localStorage.getItem("userName") || "Admin");
  const [stats, setStats]                 = useState({ pacientes: 0, doctores: 0, citasHoy: 0, pendientes: 0 });
  const [pacientes, setPacientes]         = useState([]);
  const [doctores, setDoctores]           = useState([]);
  const [citas, setCitas]                 = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // ── Emergencia ────────────────────────────────────────────────────────
  const ESPECIALIDADES_EMG = ["Cardiología", "Dermatología", "Neurología", "Pediatría", "Medicina General"];
  const [emergForm, setEmergForm]         = useState({ nombre: "", especialidad: "", motivo: "" });
  const [emergLoading, setEmergLoading]   = useState(false);
  const [emergResult, setEmergResult]     = useState(null);
  const [emergencias, setEmergencias]     = useState([]);
  const [completarModal, setCompletarModal] = useState(null);
  const [completarForm, setCompletarForm] = useState({ nombre: "", email: "", telefono: "", fecha_nacimiento: "", tipo_sangre: "" });
  const [completarLoading, setCompletarLoading] = useState(false);

  const fetchEmergencias = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/emergencias-hoy`);
      setEmergencias(await res.json());
    } catch { /* silencioso */ }
  };

  const handleEmergencia = async (e) => {
    e.preventDefault();
    if (!emergForm.nombre.trim() || !emergForm.especialidad || !emergForm.motivo.trim()) return;
    setEmergLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/emergencia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emergForm),
      });
      const data = await res.json();
      if (data.success) {
        setEmergResult(data);
        setEmergForm({ nombre: "", especialidad: "", motivo: "" });
        fetchEmergencias();
        fetchAllData();
      } else {
        notify("error", data.message || "No se pudo registrar la emergencia.");
      }
    } catch { notify("error", "Error de conexión."); }
    finally { setEmergLoading(false); }
  };

  const deleteTempUsers = () => {
    const tempCount = pacientes.filter(p => p.email?.includes("@mediconnect.tmp")).length;
    if (tempCount === 0) return notify("error", "No hay cuentas temporales para eliminar.");
    setConfirm({
      message: `Se eliminarán ${tempCount} cuenta${tempCount > 1 ? "s" : ""} temporal${tempCount > 1 ? "es" : ""} de emergencia y todas sus citas asociadas.`,
      confirmLabel: "Eliminar temporales",
      onConfirm: async () => {
        setConfirm(null);
        setLoadingAction(true);
        try {
          const res  = await fetch(`${API_URL}/admin/usuarios/temporales`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            notify("success", `${data.eliminados} cuenta${data.eliminados !== 1 ? "s" : ""} temporal${data.eliminados !== 1 ? "es" : ""} eliminada${data.eliminados !== 1 ? "s" : ""}.`);
            await fetchAllData();
          }
        } catch { notify("error", "Error al eliminar cuentas temporales."); }
        finally { setLoadingAction(false); }
      },
    });
  };

  const handleCompletarDatos = async (e) => {
    e.preventDefault();
    setCompletarLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/pacientes/${completarModal.id}/completar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completarForm),
      });
      const data = await res.json();
      if (data.success) {
        notify("success", "Datos actualizados correctamente.");
        setCompletarModal(null);
        fetchEmergencias();
      } else {
        notify("error", data.message || "Error al actualizar datos.");
      }
    } catch { notify("error", "Error de conexión."); }
    finally { setCompletarLoading(false); }
  };

  // ── Crear Usuario ─────────────────────────────────────────────────────
  const generarLicencia = () => `MC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const [createType, setCreateType]         = useState("paciente");
  const emptyForm = { nombre: "", email: "", password: "", especialidad: "", licencia: generarLicencia(), telefono: "", tipo_sangre: "", fecha_nacimiento: "" };
  const [createForm, setCreateForm]         = useState(emptyForm);
  const [createLoading, setCreateLoading]   = useState(false);
  const [createSuccess, setCreateSuccess]   = useState(null);
  const [createError, setCreateError]       = useState("");
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [showCreatePwd, setShowCreatePwd]   = useState(false);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") { navigate("/login"); return; }
    fetchAllData();
  }, [navigate]);

  const fetchAllData = async () => {
    try {
      const [resStats, resPacientes, resDoctores, resCitas] = await Promise.all([
        fetch(`${API_URL}/admin/stats`),
        fetch(`${API_URL}/admin/pacientes`),
        fetch(`${API_URL}/admin/doctores`),
        fetch(`${API_URL}/admin/citas`),
      ]);
      setStats(await resStats.json());
      setPacientes(await resPacientes.json());
      setDoctores(await resDoctores.json());
      setCitas(await resCitas.json());
    } catch (error) {
      console.error("Error cargando datos del admin:", error);
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const deleteUsuario = (id) => {
    setConfirm({
      message: "Esto eliminará al usuario y todas sus citas asociadas. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      onConfirm: async () => {
        setConfirm(null);
        setLoadingAction(true);
        try {
          const res = await fetch(`${API_URL}/admin/usuarios/${id}`, { method: "DELETE" });
          if (res.ok) await fetchAllData();
        } catch { notify("error", "Error al eliminar el usuario."); }
        finally { setLoadingAction(false); }
      },
    });
  };

  const deleteCita = (id) => {
    setConfirm({
      message: "Esta cita será eliminada permanentemente del sistema.",
      confirmLabel: "Eliminar",
      onConfirm: async () => {
        setConfirm(null);
        setLoadingAction(true);
        try {
          const res = await fetch(`${API_URL}/admin/citas/${id}`, { method: "DELETE" });
          if (res.ok) await fetchAllData();
        } catch { notify("error", "Error al eliminar la cita."); }
        finally { setLoadingAction(false); }
      },
    });
  };

  const cancelarCita = (id) => {
    setConfirm({
      message: "La cita será marcada como CANCELADA.",
      confirmLabel: "Cancelar cita",
      onConfirm: async () => {
        setConfirm(null);
        setLoadingAction(true);
        try {
          const res = await fetch(`${API_URL}/citas/${id}/cancelar`, { method: "PUT" });
          if (res.ok) await fetchAllData();
        } catch { notify("error", "Error al cancelar la cita."); }
        finally { setLoadingAction(false); }
      },
    });
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setCreateError("");
    const errs = {
      nombre:   validateNombre(createForm.nombre),
      email:    validateEmail(createForm.email),
      password: validatePassword(createForm.password),
      ...(createType === "doctor"   && { especialidad: !createForm.especialidad ? "Selecciona una especialidad." : null }),
      ...(createType === "paciente" && {
        telefono:         createForm.telefono ? validateTelefono(createForm.telefono) : null,
        fecha_nacimiento: createForm.fecha_nacimiento ? validateFechaNacimiento(createForm.fecha_nacimiento) : null,
      }),
    };
    setCreateFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setCreateLoading(true);
    try {
      const body = {
        tipo: createType,
        nombre: createForm.nombre,
        email:  createForm.email,
        password: createForm.password,
        ...(createType === "doctor"   && { especialidad: createForm.especialidad, licencia_medica: createForm.licencia }),
        ...(createType === "paciente" && { telefono: createForm.telefono, tipo_sangre: createForm.tipo_sangre, fecha_nacimiento: createForm.fecha_nacimiento }),
      };
      const res  = await fetch(`${API_URL}/admin/crear-usuario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setCreateSuccess({ nombre: createForm.nombre, tipo: createType, id: data.id, licencia: createForm.licencia });
        setCreateForm({ ...emptyForm, licencia: generarLicencia() });
        await fetchAllData();
      } else {
        setCreateError(data.message || "No se pudo crear el usuario.");
      }
    } catch {
      setCreateError("Error de conexión con el servidor.");
    } finally {
      setCreateLoading(false);
    }
  };

  const navItems = [
    { id: "dashboard",  label: "Dashboard"      },
    { id: "pacientes",  label: "Pacientes"       },
    { id: "doctores",   label: "Doctores"        },
    { id: "citas",      label: "Citas"           },
    { id: "crear",      label: "Crear Usuario"   },
    { id: "emergencia", label: "Emergencia", red: true },
  ];

  // ─── DASHBOARD ────────────────────────────────────────────────────────────
  const renderDashboard = () => {
    const recentCitas   = citas.slice(0, 5);
    const proximasCitas = citas.filter(c => c.estado === "PENDIENTE" || c.estado === "ACEPTADA");
    return (
      <div className="anim-rise d-0">
        {/* Eyebrow + title */}
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-2">Panel de control</p>
        <h2 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 mb-1">Dashboard</h2>
        <p className="text-slate-500 text-sm mb-10">Resumen general del sistema hospitalario</p>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 anim-rise d-1">
          {[
            { label: "Total Pacientes",  value: stats.pacientes  },
            { label: "Doctores Activos", value: stats.doctores   },
            { label: "Citas Hoy",        value: stats.citasHoy   },
            { label: "Pendientes",       value: stats.pendientes },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-5">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-2">{s.label}</p>
              <p className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 anim-rise d-2">
          {/* Actividad reciente */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-900">Actividad Reciente</p>
              <span className="text-[12px] text-slate-400">{citas.length} citas totales</span>
            </div>
            <div className="divide-y divide-slate-100">
              {recentCitas.length === 0 && (
                <p className="px-6 py-10 text-center text-slate-400 text-sm">No hay actividad reciente</p>
              )}
              {recentCitas.map((cita) => (
                <div key={cita.id} className="px-6 py-4 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${cita.estado === "ACEPTADA" ? "bg-emerald-500" : cita.estado === "PENDIENTE" ? "bg-amber-500" : "bg-red-400"}`}>
                    {cita.paciente_nombre?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-900 truncate">{cita.paciente_nombre}</p>
                    <p className="text-[12px] text-slate-400">con {cita.doctor_nombre}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getStatusStyle(cita.estado)}`}>
                      {cita.estado}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(cita.fecha_solicitada).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Próximas citas */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <p className="text-[13px] font-semibold text-slate-900">Próximas Citas</p>
            </div>
            <div className="p-4 space-y-3">
              {proximasCitas.slice(0, 4).map((cita) => (
                <div key={cita.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-slate-900">{cita.paciente_nombre}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(cita.estado)}`}>
                      {cita.estado}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500">
                    {cita.doctor_nombre} · {new Date(cita.fecha_solicitada).toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
              {proximasCitas.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-8">Sin citas próximas</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── PACIENTES ────────────────────────────────────────────────────────────
  const renderPacientes = () => {
    const filtered  = pacientes.filter(p =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const tempCount = pacientes.filter(p => p.email?.includes("@mediconnect.tmp")).length;
    return (
      <div className="anim-rise d-0">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-2">Gestión</p>
        <h2 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 mb-1">Pacientes</h2>
        <p className="text-slate-500 text-sm mb-8">Gestiona los registros de pacientes del hospital</p>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-8 anim-rise d-1">
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-slate-200 bg-white rounded-full px-4 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 w-56 transition-all"
          />
          {tempCount > 0 && (
            <button
              onClick={deleteTempUsers}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-red-600 border border-red-200 hover:bg-red-50"
            >
              Limpiar temporales ({tempCount})
            </button>
          )}
        </div>

        {/* Stats mini row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 anim-rise d-1">
          {[
            { label: "Total Pacientes",      value: stats.pacientes },
            { label: "Registrados",          value: pacientes.filter(p => !p.email?.includes("@mediconnect.tmp")).length },
            { label: "Con citas pendientes", value: stats.pendientes },
            { label: "Temporales",           value: tempCount },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-5">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-2">{s.label}</p>
              <p className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900 leading-none">{s.value}</p>
            </div>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 anim-rise d-2">
          {filtered.length === 0 && (
            <p className="px-6 py-12 text-center text-slate-400 text-sm">
              {searchTerm ? "No se encontraron pacientes" : "No hay pacientes registrados"}
            </p>
          )}
          {filtered.map((paciente) => {
            const esTemp = paciente.email?.includes("@mediconnect.tmp");
            return (
              <div key={paciente.id} className="flex items-center gap-4 px-6 py-4 group hover:bg-slate-50/60 transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${esTemp ? "bg-red-500" : "bg-slate-900"}`}>
                  {paciente.nombre?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-slate-900 truncate">{paciente.nombre}</p>
                  <p className={`text-[12px] truncate ${esTemp ? "text-red-400 italic" : "text-slate-500"}`}>
                    {esTemp ? "Cuenta temporal — emergencia" : paciente.email}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-slate-400 shrink-0">PT-{String(paciente.id).padStart(6, "0")}</span>
                {esTemp && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 shrink-0">
                    Temporal
                  </span>
                )}
                <button
                  onClick={() => deleteUsuario(paciente.id)}
                  className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-all"
                >
                  Eliminar
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── DOCTORES ─────────────────────────────────────────────────────────────
  const renderDoctores = () => {
    const filteredDoc = doctores.filter(d =>
      d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
      <div className="anim-rise d-0">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-2">Personal médico</p>
        <h2 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 mb-1">Doctores</h2>
        <p className="text-slate-500 text-sm mb-8">Gestiona el personal médico y su disponibilidad</p>

        {/* Toolbar */}
        <div className="mb-8 anim-rise d-1">
          <input
            type="text"
            placeholder="Buscar doctor o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-slate-200 bg-white rounded-full px-4 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 w-64 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 anim-rise d-2">
          {/* List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100">
            {filteredDoc.length === 0 && (
              <p className="px-6 py-12 text-center text-slate-400 text-sm">
                {searchTerm ? "No se encontraron doctores" : "No hay doctores registrados"}
              </p>
            )}
            {filteredDoc.map((doctor) => (
              <div
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor)}
                className={`flex items-center gap-4 px-6 py-4 group cursor-pointer hover:bg-slate-50/60 transition-colors ${selectedDoctor?.id === doctor.id ? "bg-slate-50" : ""}`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {doctor.nombre?.charAt(0)?.toUpperCase() || "D"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-slate-900 truncate">{doctor.nombre}</p>
                  <p className="text-[12px] text-slate-500 truncate">{doctor.especialidad} · {doctor.email}</p>
                </div>
                <span className="font-mono text-[11px] text-slate-400 shrink-0">DOC-{String(doctor.id).padStart(5, "0")}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteUsuario(doctor.id); }}
                  className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-all"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200/80 sticky top-8 overflow-hidden">
              {selectedDoctor ? (
                <>
                  <div className="bg-slate-900 p-6 text-white text-center">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl font-semibold mx-auto mb-3">
                      {selectedDoctor.nombre?.charAt(0)?.toUpperCase()}
                    </div>
                    <h3 className="font-semibold text-[15px]">{selectedDoctor.nombre}</h3>
                    <p className="text-slate-400 text-[13px] mt-1">{selectedDoctor.especialidad}</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1">ID</p>
                      <p className="text-[13.5px] font-medium text-slate-900">DOC-{String(selectedDoctor.id).padStart(5, "0")}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1">Email</p>
                      <p className="text-[13.5px] font-medium text-slate-900 break-all">{selectedDoctor.email}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1">Especialidad</p>
                      <p className="text-[13.5px] font-medium text-slate-900">{selectedDoctor.especialidad}</p>
                    </div>
                    <button
                      onClick={() => deleteUsuario(selectedDoctor.id)}
                      className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-red-600 border border-red-200 hover:bg-red-50"
                    >
                      Eliminar Doctor
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-10 text-center text-slate-400">
                  <p className="text-[13px] font-medium">Selecciona un doctor</p>
                  <p className="text-[12px] mt-1 text-slate-400">para ver sus detalles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── CITAS ────────────────────────────────────────────────────────────────
  const renderCitas = () => {
    const filteredCitas = citas.filter(c =>
      c.paciente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.doctor_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
      <div className="anim-rise d-0">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-2">Administración</p>
        <h2 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 mb-1">Citas</h2>
        <p className="text-slate-500 text-sm mb-8">Administra todas las citas del hospital</p>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 anim-rise d-1">
          <input
            type="text"
            placeholder="Buscar por paciente o doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-slate-200 bg-white rounded-full px-4 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 w-64 transition-all"
          />
          {/* Status chips */}
          <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-900 text-white">
            {citas.length} total
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-medium border border-slate-200 text-slate-600">
            {citas.filter(c => c.estado === "PENDIENTE").length} pendientes
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-medium border border-slate-200 text-slate-600">
            {citas.filter(c => c.estado === "ACEPTADA").length} aceptadas
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-medium border border-slate-200 text-slate-600">
            {citas.filter(c => c.estado === "CANCELADA").length} canceladas
          </span>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 anim-rise d-2">
          {filteredCitas.length === 0 && (
            <p className="px-6 py-12 text-center text-slate-400 text-sm">
              {searchTerm ? "No se encontraron citas" : "No hay citas registradas"}
            </p>
          )}
          {filteredCitas.map((cita) => (
            <div key={cita.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
              {/* Date badge */}
              <div className="shrink-0 w-12 text-center">
                <p className="text-[22px] font-semibold text-slate-900 leading-none">
                  {new Date(cita.fecha_solicitada).getDate()}
                </p>
                <p className="font-mono text-[10px] uppercase text-slate-400">
                  {new Date(cita.fecha_solicitada).toLocaleDateString("es", { month: "short" })}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-slate-900 truncate">
                  {cita.paciente_nombre} <span className="text-slate-400 font-normal">→</span> {cita.doctor_nombre}
                </p>
                <p className="text-[12px] text-slate-500">
                  {new Date(cita.fecha_solicitada).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase shrink-0 ${getStatusStyle(cita.estado)}`}>
                {cita.estado}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {cita.estado === "PENDIENTE" && (
                  <button
                    onClick={() => cancelarCita(cita.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-red-600 border border-red-200 hover:bg-red-50"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={() => deleteCita(cita.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-red-600 border border-red-200 hover:bg-red-50"
                  title="Eliminar permanentemente"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── CREAR USUARIO ────────────────────────────────────────────────────────
  const renderCrearUsuario = () => {
    const ESPECIALIDADES = ["Cardiología", "Dermatología", "Neurología", "Pediatría", "Medicina General"];
    const TIPOS_SANGRE   = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const typeConfig = {
      paciente: { label: "Paciente", description: "Acceso al portal de citas"   },
      doctor:   { label: "Doctor",   description: "Acceso al panel médico"       },
      admin:    { label: "Admin",    description: "Acceso total al sistema"      },
    };
    const inputCls = (field) =>
      `w-full border ${createFieldErrors[field] ? "border-red-400" : "border-slate-200"} bg-white rounded-xl py-3 px-4 text-[13px] font-medium text-slate-800 placeholder:text-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-none`;
    const labelCls = "font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block mb-1.5";
    const CFErr = ({ name }) => createFieldErrors[name]
      ? <p className="mt-1.5 text-[12px] font-medium text-red-500">{createFieldErrors[name]}</p>
      : null;

    return (
      <div className="anim-rise d-0">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-2">Administración</p>
        <h2 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 mb-1">Crear Usuario</h2>
        <p className="text-slate-500 text-sm mb-8">Registra un nuevo paciente, doctor o administrador directamente desde el panel.</p>

        {/* Success banner */}
        {createSuccess && (
          <div className="mb-8 bg-white rounded-2xl border border-slate-200/80 p-5 flex items-start gap-4 anim-rise d-0">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="text-emerald-600 text-lg">✓</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-slate-900">Usuario creado correctamente</p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                <span className="font-medium">{createSuccess.nombre}</span> fue registrado como{" "}
                <span className="capitalize">{createSuccess.tipo}</span> · ID #{createSuccess.id}
              </p>
              {createSuccess.tipo === "doctor" && (
                <p className="font-mono text-[11px] text-slate-400 mt-1">Licencia: {createSuccess.licencia}</p>
              )}
            </div>
            <button onClick={() => setCreateSuccess(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
        )}

        {/* Type selector */}
        <div className="flex gap-2 mb-8 anim-rise d-1">
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setCreateType(key); setCreateError(""); setCreateSuccess(null); setCreateFieldErrors({}); }}
              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${createType === key ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:text-slate-900"}`}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 anim-rise d-2">
          <p className="text-[13px] font-medium text-slate-500 mb-6">Los campos marcados con * son obligatorios</p>

          {createError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium rounded-xl px-4 py-3">
              {createError}
            </div>
          )}

          <form onSubmit={handleCrearUsuario}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className={labelCls}>Nombre Completo *</label>
                <input className={inputCls("nombre")} type="text" placeholder="Ej. María González" required
                  value={createForm.nombre}
                  onChange={e => { setCreateForm(f => ({ ...f, nombre: e.target.value })); setCreateFieldErrors(p => ({ ...p, nombre: null })); }} />
                <CFErr name="nombre" />
              </div>
              <div>
                <label className={labelCls}>Correo Electrónico *</label>
                <input className={inputCls("email")} type="email" placeholder="correo@ejemplo.com" required
                  value={createForm.email}
                  onChange={e => { setCreateForm(f => ({ ...f, email: e.target.value })); setCreateFieldErrors(p => ({ ...p, email: null })); }} />
                <CFErr name="email" />
              </div>
              <div className="relative">
                <label className={labelCls}>Contraseña * (mín. 8 caracteres)</label>
                <input className={inputCls("password")} type={showCreatePwd ? "text" : "password"} placeholder="••••••••" required
                  value={createForm.password}
                  onChange={e => { setCreateForm(f => ({ ...f, password: e.target.value })); setCreateFieldErrors(p => ({ ...p, password: null })); }} />
                <button type="button" onClick={() => setShowCreatePwd(v => !v)}
                  className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 text-[12px] font-medium transition-colors">
                  {showCreatePwd ? "Ocultar" : "Ver"}
                </button>
                <CFErr name="password" />
              </div>

              {/* Doctor fields */}
              {createType === "doctor" && (<>
                <div>
                  <label className={labelCls}>Especialidad *</label>
                  <select className={inputCls("especialidad")} required value={createForm.especialidad}
                    onChange={e => { setCreateForm(f => ({ ...f, especialidad: e.target.value })); setCreateFieldErrors(p => ({ ...p, especialidad: null })); }}>
                    <option value="">Seleccione especialidad...</option>
                    {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <CFErr name="especialidad" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Licencia Médica (auto-generada)</label>
                  <div className="flex gap-2">
                    <input className="w-full border border-slate-200 bg-slate-50 rounded-xl py-3 px-4 text-[13px] font-mono text-slate-600 outline-none" readOnly value={createForm.licencia} />
                    <button type="button"
                      onClick={() => setCreateForm(f => ({ ...f, licencia: generarLicencia() }))}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium bg-slate-900 text-white hover:bg-slate-800">
                      Nueva
                    </button>
                  </div>
                </div>
              </>)}

              {/* Paciente fields */}
              {createType === "paciente" && (<>
                <div>
                  <label className={labelCls}>Teléfono (8 dígitos, El Salvador)</label>
                  <input className={inputCls("telefono")} type="tel" placeholder="Ej. 7234-5678" maxLength={9}
                    value={createForm.telefono}
                    onChange={e => { setCreateForm(f => ({ ...f, telefono: e.target.value })); setCreateFieldErrors(p => ({ ...p, telefono: null })); }} />
                  <CFErr name="telefono" />
                </div>
                <div>
                  <label className={labelCls}>Tipo de Sangre</label>
                  <select className={inputCls("tipo_sangre")} value={createForm.tipo_sangre}
                    onChange={e => setCreateForm(f => ({ ...f, tipo_sangre: e.target.value }))}>
                    <option value="">Seleccione...</option>
                    {TIPOS_SANGRE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Fecha de Nacimiento</label>
                  <input className={inputCls("fecha_nacimiento")} type="date"
                    min={minBirthDate()} max={maxBirthDate()}
                    value={createForm.fecha_nacimiento}
                    onChange={e => { setCreateForm(f => ({ ...f, fecha_nacimiento: e.target.value })); setCreateFieldErrors(p => ({ ...p, fecha_nacimiento: null })); }} />
                  <CFErr name="fecha_nacimiento" />
                </div>
              </>)}
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button type="button"
                onClick={() => { setCreateForm({ ...emptyForm, licencia: generarLicencia() }); setCreateError(""); setCreateSuccess(null); setCreateFieldErrors({}); }}
                className="px-4 py-2 rounded-full text-[13px] font-medium border border-slate-200 text-slate-600 hover:text-slate-900">
                Limpiar
              </button>
              <button type="submit" disabled={createLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
                {createLoading ? "Creando..." : `Crear ${typeConfig[createType].label}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ─── EMERGENCIA ───────────────────────────────────────────────────────────
  const renderEmergencia = () => {
    const TIPOS_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const inputE = "w-full border border-slate-200 bg-white rounded-xl py-3 px-4 text-[13px] font-medium text-slate-800 placeholder:text-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all outline-none";
    return (
      <div className="anim-rise d-0">
        {/* Completar datos modal */}
        {completarModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10002 }}>
            <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", maxWidth: "500px", width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
              <h3 className="text-[18px] font-semibold text-slate-900 mb-1">Completar Datos</h3>
              <p className="text-[13px] text-slate-500 mb-6">Paciente: <span className="font-semibold text-slate-900">{completarModal.nombre}</span></p>
              <form onSubmit={handleCompletarDatos} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block mb-1.5">Nombre completo</label>
                    <input className={inputE} type="text" placeholder="Nombre real" value={completarForm.nombre} onChange={e => setCompletarForm(f => ({ ...f, nombre: e.target.value }))} />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block mb-1.5">Correo real</label>
                    <input className={inputE} type="email" placeholder="correo@ejemplo.com" value={completarForm.email} onChange={e => setCompletarForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block mb-1.5">Teléfono (SV)</label>
                    <input className={inputE} type="tel" placeholder="7234-5678" maxLength={9} value={completarForm.telefono} onChange={e => setCompletarForm(f => ({ ...f, telefono: e.target.value }))} />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block mb-1.5">Fecha de Nacimiento</label>
                    <input className={inputE} type="date" value={completarForm.fecha_nacimiento} onChange={e => setCompletarForm(f => ({ ...f, fecha_nacimiento: e.target.value }))} />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block mb-1.5">Tipo de Sangre</label>
                    <select className={inputE} value={completarForm.tipo_sangre} onChange={e => setCompletarForm(f => ({ ...f, tipo_sangre: e.target.value }))}>
                      <option value="">Seleccione...</option>
                      {TIPOS_SANGRE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setCompletarModal(null)}
                    className="px-4 py-2 rounded-full text-[13px] font-medium border border-slate-200 text-slate-600 hover:text-slate-900">
                    Cancelar
                  </button>
                  <button type="submit" disabled={completarLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
                    {completarLoading ? "Guardando..." : "Guardar Datos"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Header */}
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-2">Urgencias</p>
        <h2 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 mb-1">Emergencia</h2>
        <p className="text-slate-500 text-sm mb-8">Registra al paciente en segundos. El sistema asigna un doctor y genera credenciales automáticamente.</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 anim-rise d-1">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-7">
              <p className="text-[13px] font-semibold text-slate-900 mb-6">Datos Mínimos</p>
              <form onSubmit={handleEmergencia} className="space-y-5">
                <div>
                  <label className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block mb-1.5">Nombre del Paciente *</label>
                  <input className={inputE} type="text" required
                    placeholder='"Juan Pérez" o "No Identificado"'
                    value={emergForm.nombre} onChange={e => setEmergForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div>
                  <label className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block mb-1.5">Especialidad Requerida *</label>
                  <select className={inputE} required value={emergForm.especialidad} onChange={e => setEmergForm(f => ({ ...f, especialidad: e.target.value }))}>
                    <option value="">Seleccione especialidad...</option>
                    {ESPECIALIDADES_EMG.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block mb-1.5">Motivo de Emergencia *</label>
                  <textarea className={`${inputE} resize-none`} required rows={3}
                    placeholder="Describe brevemente el motivo..."
                    value={emergForm.motivo} onChange={e => setEmergForm(f => ({ ...f, motivo: e.target.value }))} />
                </div>
                <button type="submit" disabled={emergLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full text-[13px] font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {emergLoading ? "Registrando..." : "Registrar Emergencia Ahora"}
                </button>
              </form>
            </div>
          </div>

          {/* Result + list */}
          <div className="lg:col-span-3 space-y-6">
            {emergResult && (
              <div className="bg-white rounded-2xl border border-red-200 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-1">
                    <p className="text-[13.5px] font-semibold text-slate-900">Emergencia registrada — Doctor asignado</p>
                    <p className="text-[12px] text-red-600 mt-0.5">Dr. {emergResult.doctorNombre}</p>
                  </div>
                  <button onClick={() => setEmergResult(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                  <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-2">Credenciales Temporales</p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[13px] text-slate-700 flex-1">{emergResult.emailTemp}</span>
                    <button onClick={() => navigator.clipboard.writeText(emergResult.emailTemp)}
                      className="text-[12px] font-medium text-slate-500 hover:text-slate-900">Copiar</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[13px] text-slate-700 flex-1">{emergResult.passwordTemp}</span>
                    <button onClick={() => navigator.clipboard.writeText(emergResult.passwordTemp)}
                      className="text-[12px] font-medium text-slate-500 hover:text-slate-900">Copiar</button>
                  </div>
                </div>
                <p className="text-[12px] text-red-500 mt-3 font-medium">Completa los datos del paciente cuando sea posible usando el botón "Completar Datos" de la lista inferior.</p>
              </div>
            )}

            {/* Emergencias del día */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-slate-900">Emergencias de Hoy</p>
                <button onClick={fetchEmergencias}
                  className="text-[12px] font-medium text-slate-500 hover:text-slate-900 transition-colors">
                  Actualizar
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {emergencias.length === 0 && (
                  <p className="px-6 py-10 text-center text-slate-400 text-[13px]">No hay emergencias registradas hoy</p>
                )}
                {emergencias.map((em) => (
                  <div key={em.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-xs shrink-0">
                      {em.paciente_nombre?.charAt(0)?.toUpperCase() || "E"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium text-slate-900 truncate">{em.paciente_nombre}</p>
                      <p className="text-[12px] text-slate-400 truncate">Dr. {em.doctor_nombre} · {em.motivo}</p>
                    </div>
                    <button
                      onClick={() => { setCompletarModal({ id: em.paciente_id, nombre: em.paciente_nombre }); setCompletarForm({ nombre: "", email: "", telefono: "", fecha_nacimiento: "", tipo_sangre: "" }); }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium bg-slate-900 text-white hover:bg-slate-800 shrink-0">
                      Completar Datos
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":  return renderDashboard();
      case "pacientes":  return renderPacientes();
      case "doctores":   return renderDoctores();
      case "citas":      return renderCitas();
      case "crear":      return renderCrearUsuario();
      case "emergencia": return renderEmergencia();
      default:           return renderDashboard();
    }
  };

  // ─── LAYOUT ───────────────────────────────────────────────────────────────
  const adminInitials = adminName.substring(0, 2).toUpperCase();

  return (
    <div className="bg-[#F1F5F9] text-slate-900 min-h-screen flex font-['Inter',sans-serif]">
      <LoadingOverlay visible={loadingAction} />
      <ConfirmModal
        visible={!!confirm}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />

      {/* Notification toast */}
      {notification && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 10001,
          padding: "12px 20px", borderRadius: "12px",
          background: notification.type === "success" ? "#ECFDF5" : "#FEF2F2",
          border: `1px solid ${notification.type === "success" ? "#A7F3D0" : "#FECACA"}`,
          color: notification.type === "success" ? "#065F46" : "#991B1B",
          fontSize: "13px", fontWeight: "600",
          display: "flex", alignItems: "center", gap: "8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxWidth: "320px",
        }}>
          {notification.type === "success" ? "✓" : "✕"} {notification.message}
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`w-[220px] shrink-0 border-r border-slate-100 bg-white flex flex-col sticky top-0 h-screen fixed z-30 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="px-6 pt-8 pb-10">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-red-600 text-white flex items-center justify-center">
              <Cross />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              Medi<span className="text-red-600">Connect</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 px-3 mb-3">Menú</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSearchTerm("");
                setSelectedDoctor(null);
                setIsSidebarOpen(false);
                if (item.id === "emergencia") fetchEmergencias();
              }}
              className={`block w-full text-left px-3 py-2 rounded text-[13.5px] transition-colors ${
                activeTab === item.id
                  ? "bg-slate-50 text-slate-900 font-medium"
                  : item.red
                    ? "text-red-600 hover:text-red-700"
                    : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {item.label}
              {item.id === "citas" && stats.pendientes > 0 && (
                <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {stats.pendientes}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Profile + logout */}
        <div className="px-4 pb-6 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 text-xs font-semibold shrink-0">
              {adminInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-slate-900 truncate">{adminName}</p>
              <p className="font-mono text-[10px] text-slate-400 truncate">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-[12.5px] text-slate-400 hover:text-red-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[220px]">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-[#F1F5F9] sticky top-0 z-10">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="hidden lg:block" />
          {/* Right side */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-slate-900">{adminName}</span>
            <span className="font-mono text-[11px] text-slate-400">ADM-001</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 text-xs font-semibold">
              {adminInitials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-[860px] mx-auto px-8 pt-14 pb-24">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
