import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import LoadingOverlay from "./LoadingOverlay";
import ConfirmModal from "./ConfirmModal";
import {
  validateEmail, validateTelefono, validateFechaNacimiento,
  validatePassword, validateNombre, maxBirthDate, minBirthDate,
} from "../utils/validations";

const Cross = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9.5" y="3" width="5" height="18" rx="1.2" fill="currentColor" />
    <rect x="3" y="9.5" width="18" height="5" rx="1.2" fill="currentColor" />
  </svg>
);

export default function Admin() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [searchTerm, setSearchTerm] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [loadingAction, setLoadingAction] = useState(false);
    const [confirm, setConfirm] = useState(null); // { message, onConfirm, confirmLabel }
    const [notification, setNotification] = useState(null);
    const [adminName] = useState(() => localStorage.getItem("userName") || "Admin");
    const [stats, setStats] = useState({ pacientes: 0, doctores: 0, citasHoy: 0, pendientes: 0 });
    const [pacientes, setPacientes] = useState([]);
    const [doctores, setDoctores] = useState([]);
    const [citas, setCitas] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    // ── Emergencia ──
    const ESPECIALIDADES_EMG = ["Cardiología", "Dermatología", "Neurología", "Pediatría", "Medicina General"];
    const [emergForm, setEmergForm] = useState({ nombre: "", especialidad: "", motivo: "" });
    const [emergLoading, setEmergLoading] = useState(false);
    const [emergResult, setEmergResult] = useState(null);
    const [emergencias, setEmergencias] = useState([]);
    const [completarModal, setCompletarModal] = useState(null); // { id, nombre }
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
                    const res = await fetch(`${API_URL}/admin/usuarios/temporales`, { method: "DELETE" });
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

    // ── Crear Usuario ──
    const generarLicencia = () => `MC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const [createType, setCreateType] = useState("paciente");
    const emptyForm = { nombre: "", email: "", password: "", especialidad: "", licencia: generarLicencia(), telefono: "", tipo_sangre: "", fecha_nacimiento: "" };
    const [createForm, setCreateForm] = useState(emptyForm);
    const [createLoading, setCreateLoading] = useState(false);
    const [createSuccess, setCreateSuccess] = useState(null);
    const [createError, setCreateError] = useState("");
    const [createFieldErrors, setCreateFieldErrors] = useState({});
    const [showCreatePwd, setShowCreatePwd] = useState(false);

    const notify = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3500);
    };

    useEffect(() => {
        const role = localStorage.getItem("userRole");
        if (role !== "admin") {
            navigate("/login");
            return;
        }
        fetchAllData();
    }, [navigate]);

    const fetchAllData = async () => {
        try {
            const [resStats, resPacientes, resDoctores, resCitas] = await Promise.all([
                fetch(`${API_URL}/admin/stats`),
                fetch(`${API_URL}/admin/pacientes`),
                fetch(`${API_URL}/admin/doctores`),
                fetch(`${API_URL}/admin/citas`)
            ]);
            setStats(await resStats.json());
            setPacientes(await resPacientes.json());
            setDoctores(await resDoctores.json());
            setCitas(await resCitas.json());
        } catch (error) {
            console.error("Error cargando datos del admin:", error);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

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

        // Validaciones por campo
        const errs = {
            nombre:   validateNombre(createForm.nombre),
            email:    validateEmail(createForm.email),
            password: validatePassword(createForm.password),
            ...(createType === "doctor" && { especialidad: !createForm.especialidad ? "Selecciona una especialidad." : null }),
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
                email: createForm.email,
                password: createForm.password,
                ...(createType === "doctor" && { especialidad: createForm.especialidad, licencia_medica: createForm.licencia }),
                ...(createType === "paciente" && { telefono: createForm.telefono, tipo_sangre: createForm.tipo_sangre, fecha_nacimiento: createForm.fecha_nacimiento }),
            };
            const res = await fetch(`${API_URL}/admin/crear-usuario`, {
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
        { id: "dashboard", label: "Dashboard" },
        { id: "pacientes", label: "Pacientes" },
        { id: "doctores", label: "Doctores" },
        { id: "citas", label: "Citas", badge: stats.pendientes > 0 ? stats.pendientes : null },
        { id: "crear", label: "Crear Usuario" },
        { id: "emergencia", label: "Emergencia", red: true },
    ];

    const getStatusStyle = (estado) => {
        switch (estado) {
            case "ACEPTADA": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
            case "PENDIENTE": return "bg-amber-50 text-amber-700 border border-amber-200";
            case "CANCELADA": return "bg-red-50 text-red-600 border border-red-200";
            default: return "bg-slate-100 text-slate-600 border border-slate-200";
        }
    };

    // ─── DASHBOARD VIEW ───
    const renderDashboard = () => {
        const recentCitas = citas.slice(0, 5);
        const proximasCitas = citas.filter(c => c.estado === "PENDIENTE" || c.estado === "ACEPTADA");
        return (
            <>
                <div className="anim-rise d-0 mb-10">
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Sistema</p>
                    <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">Dashboard</h1>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {[
                        { label: "Total Pacientes", value: stats.pacientes, icon: "group", textColor: "text-[#006B76]", bgLight: "bg-[#E0F5F7]" },
                        { label: "Doctores Activos", value: stats.doctores, icon: "medical_services", textColor: "text-emerald-500", bgLight: "bg-emerald-50" },
                        { label: "Citas Hoy", value: stats.citasHoy, icon: "event_available", textColor: "text-violet-500", bgLight: "bg-violet-50" },
                        { label: "Pendientes", value: stats.pendientes, icon: "pending_actions", textColor: "text-orange-500", bgLight: "bg-orange-50" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.bgLight} p-2.5 rounded-xl`}>
                                    <span className={`material-symbols-outlined text-xl ${stat.textColor}`}>{stat.icon}</span>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 text-sm group-hover:text-slate-400 transition-colors">trending_up</span>
                            </div>
                            <p className="text-[36px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">{stat.value}</p>
                            <p className="font-mono text-[10px] tracking-[0.18em] text-slate-400 mt-2 uppercase">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Recent Activities */}
                    <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#006B76] text-lg">history</span>
                                <h3 className="font-bold text-slate-800 text-sm">Actividad Reciente</h3>
                            </div>
                            <span className="text-xs text-slate-400">{citas.length} citas totales</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentCitas.length === 0 && (
                                <div className="px-6 py-10 text-center text-slate-400 text-sm">No hay actividad reciente</div>
                            )}
                            {recentCitas.map((cita) => (
                                <div key={cita.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors flex items-center gap-4">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${cita.estado === "ACEPTADA" ? "bg-emerald-500" : cita.estado === "PENDIENTE" ? "bg-amber-500" : "bg-red-400"}`}>
                                        {cita.paciente_nombre?.charAt(0) || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{cita.paciente_nombre}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">con {cita.doctor_nombre}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(cita.estado)}`}>
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

                    {/* Upcoming Appointments */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
                            <span className="material-symbols-outlined text-violet-500 text-lg">upcoming</span>
                            <h3 className="font-bold text-slate-800 text-sm">Próximas Citas</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            {proximasCitas.slice(0, 4).map((cita) => (
                                <div key={cita.id} className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 hover:border-[#84D4D9] transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-800">{cita.paciente_nombre}</span>
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(cita.estado)}`}>
                                            {cita.estado}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">person</span>
                                            {cita.doctor_nombre}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                            {new Date(cita.fecha_solicitada).toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {proximasCitas.length === 0 && (
                                <div className="text-center text-slate-400 text-sm py-8">Sin citas próximas</div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // ─── PACIENTES VIEW ───
    const renderPacientes = () => {
        const filtered = pacientes.filter(p =>
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const tempCount = pacientes.filter(p => p.email?.includes("@mediconnect.tmp")).length;
        return (
            <>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
                    <div className="anim-rise d-0">
                        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Registro</p>
                        <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">Pacientes</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {tempCount > 0 && (
                            <button
                                onClick={deleteTempUsers}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold hover:bg-red-100 transition-colors"
                            >
                                <span className="material-symbols-outlined text-base">delete_sweep</span>
                                Limpiar temporales ({tempCount})
                            </button>
                        )}
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Buscar paciente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#22A5AE] w-64 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                        <p className="font-mono text-[10px] tracking-[0.18em] text-slate-400 uppercase mb-2">Total</p>
                        <p className="text-[32px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">{stats.pacientes}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                        <p className="font-mono text-[10px] tracking-[0.18em] text-slate-400 uppercase mb-2">Registrados</p>
                        <p className="text-[32px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">{pacientes.filter(p => !p.email?.includes("@mediconnect.tmp")).length}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                        <p className="font-mono text-[10px] tracking-[0.18em] text-slate-400 uppercase mb-2">Pendientes</p>
                        <p className="text-[32px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">{stats.pendientes}</p>
                    </div>
                    <div className={`rounded-2xl p-5 border ${tempCount > 0 ? "bg-red-50 border-red-100" : "bg-white border-slate-100"}`}>
                        <p className="font-mono text-[10px] tracking-[0.18em] text-slate-400 uppercase mb-2">Temporales</p>
                        <p className={`text-[32px] font-semibold tracking-[-0.025em] leading-none ${tempCount > 0 ? "text-red-600" : "text-slate-300"}`}>{tempCount}</p>
                    </div>
                </div>

                {/* Patient Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((paciente) => {
                        const esTemp = paciente.email?.includes("@mediconnect.tmp");
                        return (
                        <div key={paciente.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group ${esTemp ? "border-red-200 hover:border-red-300" : "border-slate-200/80 hover:border-[#84D4D9]"}`}>
                            {esTemp && (
                                <div className="bg-red-50 border-b border-red-100 px-4 py-1.5 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-red-500 text-sm">emergency</span>
                                    <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest">Cuenta Temporal — Emergencia</span>
                                </div>
                            )}
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm ${esTemp ? "bg-red-500" : "bg-gradient-to-br from-[#006B76] to-[#004F5A]"}`}>
                                            {paciente.nombre?.charAt(0)?.toUpperCase() || "P"}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">{paciente.nombre}</h4>
                                            <p className="text-xs text-slate-400 mt-0.5">PT-{String(paciente.id).padStart(6, "0")}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteUsuario(paciente.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                        title="Eliminar Paciente"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Email</p>
                                        <p className={`text-xs mt-0.5 truncate ${esTemp ? "text-red-400 italic" : "text-slate-700"}`}>
                                            {esTemp ? "Sin email registrado" : paciente.email}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">ID</p>
                                        <p className="text-xs text-slate-700 mt-0.5">#{paciente.id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-16 text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2 block">person_off</span>
                            <p className="text-sm">{searchTerm ? "No se encontraron pacientes" : "No hay pacientes registrados"}</p>
                        </div>
                    )}
                </div>
            </>
        );
    };

    // ─── DOCTORES VIEW ───
    const renderDoctores = () => {
        const filteredDoc = doctores.filter(d =>
            d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
            <>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
                    <div className="anim-rise d-0">
                        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Personal</p>
                        <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">Doctores</h1>
                    </div>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                            type="text"
                            placeholder="Buscar doctor o especialidad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#22A5AE] w-72 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Doctor Cards List */}
                    <div className="lg:col-span-2 space-y-3">
                        {filteredDoc.map((doctor) => (
                            <div
                                key={doctor.id}
                                onClick={() => setSelectedDoctor(doctor)}
                                className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all duration-300 hover:shadow-md group ${selectedDoctor?.id === doctor.id ? "border-[#22A5AE] ring-2 ring-[#B2E5E8]" : "border-slate-200/80 hover:border-[#84D4D9]"}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-sm">
                                            {doctor.nombre?.charAt(0)?.toUpperCase() || "D"}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{doctor.nombre}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-medium text-[#006B76] bg-[#E0F5F7] px-2 py-0.5 rounded-md">{doctor.especialidad}</span>
                                                <span className="text-[10px] text-slate-400">DOC-{String(doctor.id).padStart(5, "0")}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteUsuario(doctor.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                            title="Eliminar Doctor"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                        <span className="material-symbols-outlined text-slate-300 text-lg">chevron_right</span>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">email</span>
                                        {doctor.email}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {filteredDoc.length === 0 && (
                            <div className="text-center py-16 text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-2 block">person_search</span>
                                <p className="text-sm">{searchTerm ? "No se encontraron doctores" : "No hay doctores registrados"}</p>
                            </div>
                        )}
                    </div>

                    {/* Doctor Detail Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm sticky top-8 overflow-hidden">
                            {selectedDoctor ? (
                                <>
                                    <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-6 text-white text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-extrabold mx-auto mb-3">
                                            {selectedDoctor.nombre?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <h3 className="font-bold text-lg">{selectedDoctor.nombre}</h3>
                                        <p className="text-emerald-100 text-sm mt-1">{selectedDoctor.especialidad}</p>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                            <span className="material-symbols-outlined text-[#006B76] text-lg">badge</span>
                                            <div>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase">ID</p>
                                                <p className="text-sm font-semibold text-slate-800">DOC-{String(selectedDoctor.id).padStart(5, "0")}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                            <span className="material-symbols-outlined text-[#006B76] text-lg">email</span>
                                            <div>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase">Email</p>
                                                <p className="text-sm font-semibold text-slate-800 break-all">{selectedDoctor.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                            <span className="material-symbols-outlined text-[#006B76] text-lg">local_hospital</span>
                                            <div>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase">Especialidad</p>
                                                <p className="text-sm font-semibold text-slate-800">{selectedDoctor.especialidad}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteUsuario(selectedDoctor.id)}
                                            className="w-full mt-2 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">person_remove</span>
                                            Eliminar Doctor
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="p-10 text-center text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-3 block text-slate-300">person_pin</span>
                                    <p className="text-sm font-medium">Selecciona un doctor</p>
                                    <p className="text-xs mt-1">para ver sus detalles</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // ─── CITAS VIEW ───
    const renderCitas = () => {
        const filteredCitas = citas.filter(c =>
            c.paciente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.doctor_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
            <>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
                    <div className="anim-rise d-0">
                        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Agenda</p>
                        <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">Citas</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Buscar por paciente o doctor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#006B76]/20 focus:border-[#22A5AE] w-72 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Status filter pills */}
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Total: {citas.length}</span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {citas.filter(c => c.estado === "PENDIENTE").length} Pendientes
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {citas.filter(c => c.estado === "ACEPTADA").length} Aceptadas
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                        {citas.filter(c => c.estado === "CANCELADA").length} Canceladas
                    </span>
                </div>

                {/* Appointment Cards */}
                <div className="space-y-3">
                    {filteredCitas.map((cita) => (
                        <div key={cita.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                            <div className="p-5 flex items-center gap-5">
                                {/* Date Badge */}
                                <div className="shrink-0 w-14 h-14 rounded-xl bg-[#E0F5F7] border border-[#B2E5E8] flex flex-col items-center justify-center">
                                    <span className="text-lg font-extrabold text-[#006B76] leading-none">
                                        {new Date(cita.fecha_solicitada).getDate()}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#22A5AE] uppercase">
                                        {new Date(cita.fecha_solicitada).toLocaleDateString("es", { month: "short" })}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-bold text-slate-900 text-sm">{cita.paciente_nombre}</h4>
                                        <span className="text-slate-300">→</span>
                                        <span className="text-sm text-slate-600">{cita.doctor_nombre}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                            {new Date(cita.fecha_solicitada).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(cita.estado)}`}>
                                            {cita.estado}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {cita.estado === "PENDIENTE" && (
                                        <button
                                            onClick={() => cancelarCita(cita.id)}
                                            className="px-3 py-2 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors flex items-center gap-1.5 border border-orange-200"
                                            title="Cancelar Cita"
                                        >
                                            <span className="material-symbols-outlined text-sm">block</span>
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteCita(cita.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Eliminar permanentemente"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete_forever</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredCitas.length === 0 && (
                        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200/80">
                            <span className="material-symbols-outlined text-4xl mb-2 block">event_busy</span>
                            <p className="text-sm">{searchTerm ? "No se encontraron citas" : "No hay citas registradas"}</p>
                        </div>
                    )}
                </div>
            </>
        );
    };

    // ─── CREAR USUARIO VIEW ───
    const renderCrearUsuario = () => {
    const ESPECIALIDADES = ["Cardiología", "Dermatología", "Neurología", "Pediatría", "Medicina General"];
    const TIPOS_SANGRE   = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const typeConfig = {
        paciente: { label: "Paciente", icon: "person", color: "#006B76", bg: "#E0F5F7", description: "Acceso al portal de citas" },
        doctor:   { label: "Doctor",   icon: "stethoscope", color: "#0369a1", bg: "#e0f2fe", description: "Acceso al panel médico" },
        admin:    { label: "Admin",    icon: "admin_panel_settings", color: "#7c3aed", bg: "#ede9fe", description: "Acceso total al sistema" },
    };
    const inputCls = (field) => `w-full border ${createFieldErrors[field] ? "border-red-400" : "border-slate-200"} bg-white rounded-xl py-3 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:border-[#006B76] focus:ring-2 focus:ring-[#006B76]/15 transition-all outline-none`;
    const labelCls = "text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1.5";
    const CFErr = ({ name }) => createFieldErrors[name]
      ? <p className="mt-1.5 ml-1 text-xs font-semibold text-red-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>{createFieldErrors[name]}
        </p>
      : null;
    return (
        <>
            <div className="anim-rise d-0 mb-10">
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Admin</p>
                <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">Crear Usuario</h1>
            </div>

            {/* Success Card */}
            {createSuccess && (
                <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-emerald-800 text-base">Usuario creado correctamente</p>
                        <p className="text-emerald-700 text-sm mt-0.5">
                            <span className="font-semibold">{createSuccess.nombre}</span> fue registrado como <span className="font-semibold capitalize">{createSuccess.tipo}</span> · ID #{createSuccess.id}
                        </p>
                        {createSuccess.tipo === "doctor" && (
                            <p className="text-emerald-600 text-xs mt-1 font-mono">Licencia asignada: {createSuccess.licencia}</p>
                        )}
                    </div>
                    <button onClick={() => setCreateSuccess(null)} className="text-emerald-400 hover:text-emerald-600 transition-colors ml-2">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            )}

            {/* Role Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {Object.entries(typeConfig).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => { setCreateType(key); setCreateError(""); setCreateSuccess(null); setCreateFieldErrors({}); }}
                        className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${createType === key ? "border-current shadow-md" : "border-slate-200 bg-white hover:border-slate-300"}`}
                        style={createType === key ? { borderColor: cfg.color, background: cfg.bg } : {}}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                                <span className="material-symbols-outlined" style={{ color: cfg.color, fontSize: "22px" }}>{cfg.icon}</span>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">{cfg.label}</p>
                                <p className="text-[11px] text-slate-400">{cfg.description}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-7">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: typeConfig[createType].bg }}>
                        <span className="material-symbols-outlined" style={{ color: typeConfig[createType].color }}>badge</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Datos del {typeConfig[createType].label}</h3>
                        <p className="text-xs text-slate-400">Los campos marcados con * son obligatorios</p>
                    </div>
                </div>

                {createError && (
                    <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl px-4 py-3">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {createError}
                    </div>
                )}

                <form onSubmit={handleCrearUsuario}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        {/* Campos comunes */}
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
                                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined text-lg">{showCreatePwd ? "visibility_off" : "visibility"}</span>
                            </button>
                            <CFErr name="password" />
                        </div>

                        {/* Doctor: especialidad + licencia */}
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
                                    <input className="w-full border border-slate-200 bg-slate-50 rounded-xl py-3 px-4 text-sm font-mono text-slate-600 outline-none" readOnly value={createForm.licencia} />
                                    <button type="button"
                                        onClick={() => setCreateForm(f => ({ ...f, licencia: generarLicencia() }))}
                                        className="flex-shrink-0 px-4 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#006B76] hover:border-[#006B76] transition-all text-sm font-semibold flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-base">refresh</span>
                                        Nueva
                                    </button>
                                </div>
                            </div>
                        </>)}

                        {/* Paciente: teléfono, tipo sangre, fecha nacimiento */}
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
                            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                            Limpiar
                        </button>
                        <button type="submit" disabled={createLoading}
                            className="px-7 py-2.5 rounded-xl text-white text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-60"
                            style={{ background: createLoading ? "#94a3b8" : typeConfig[createType].color }}>
                            {createLoading
                                ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Creando...</>
                                : <><span className="material-symbols-outlined text-base">person_add</span>Crear {typeConfig[createType].label}</>}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
    }; // end renderCrearUsuario

    // ─── EMERGENCIA VIEW ───
    const renderEmergencia = () => {
        const TIPOS_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
        const inputE = "w-full border border-slate-200 bg-white rounded-xl py-3 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/15 transition-all outline-none";
        return (
            <>
                {/* Completar datos modal */}
                {completarModal && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10002 }}>
                        <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", maxWidth: "500px", width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Completar Datos</h3>
                            <p className="text-sm text-slate-500 mb-6">Paciente: <span className="font-bold">{completarModal.nombre}</span></p>
                            <form onSubmit={handleCompletarDatos} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Nombre completo</label>
                                        <input className={inputE} type="text" placeholder="Nombre real" value={completarForm.nombre} onChange={e => setCompletarForm(f => ({ ...f, nombre: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Correo real</label>
                                        <input className={inputE} type="email" placeholder="correo@ejemplo.com" value={completarForm.email} onChange={e => setCompletarForm(f => ({ ...f, email: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Teléfono (SV)</label>
                                        <input className={inputE} type="tel" placeholder="7234-5678" maxLength={9} value={completarForm.telefono} onChange={e => setCompletarForm(f => ({ ...f, telefono: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Fecha de Nacimiento</label>
                                        <input className={inputE} type="date" value={completarForm.fecha_nacimiento} onChange={e => setCompletarForm(f => ({ ...f, fecha_nacimiento: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Tipo de Sangre</label>
                                        <select className={inputE} value={completarForm.tipo_sangre} onChange={e => setCompletarForm(f => ({ ...f, tipo_sangre: e.target.value }))}>
                                            <option value="">Seleccione...</option>
                                            {TIPOS_SANGRE.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <button type="button" onClick={() => setCompletarModal(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancelar</button>
                                    <button type="submit" disabled={completarLoading} className="px-6 py-2.5 rounded-xl bg-[#006B76] text-white text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-60">
                                        {completarLoading ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Guardando...</> : "Guardar Datos"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="anim-rise d-0 mb-8">
                    <div className="flex items-center gap-3 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-red-600">Urgente</p>
                    </div>
                    <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none mb-3">Emergencia</h1>
                    <p className="text-[14px] text-slate-400">Registra al paciente en segundos. El sistema asigna un doctor y genera credenciales automáticamente.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Formulario (izquierda) */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-7">
                            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-500">person_add</span>
                                Datos Mínimos
                            </h3>
                            <form onSubmit={handleEmergencia} className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Nombre del Paciente *</label>
                                    <input className={inputE.replace("border-red-400", "border-[#006B76]").replace("ring-red-400", "ring-[#006B76]")} type="text" required
                                        placeholder='Ej. "Juan Pérez" o "No Identificado"'
                                        value={emergForm.nombre} onChange={e => setEmergForm(f => ({ ...f, nombre: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Especialidad Requerida *</label>
                                    <select className={inputE} required value={emergForm.especialidad} onChange={e => setEmergForm(f => ({ ...f, especialidad: e.target.value }))}>
                                        <option value="">Seleccione especialidad...</option>
                                        {ESPECIALIDADES_EMG.map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Motivo de Emergencia *</label>
                                    <textarea className={`${inputE} resize-none`} required rows={3}
                                        placeholder="Describe brevemente el motivo..."
                                        value={emergForm.motivo} onChange={e => setEmergForm(f => ({ ...f, motivo: e.target.value }))} />
                                </div>
                                <button type="submit" disabled={emergLoading}
                                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-red-200">
                                    {emergLoading
                                        ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Registrando...</>
                                        : <><span className="material-symbols-outlined text-base">emergency</span>Registrar Emergencia Ahora</>}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Resultado + Lista (derecha) */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Resultado de registro */}
                        {emergResult && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-red-600">check_circle</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-red-800">Emergencia registrada — Doctor asignado</p>
                                        <p className="text-sm text-red-600">Dr. {emergResult.doctorNombre}</p>
                                    </div>
                                    <button onClick={() => setEmergResult(null)} className="ml-auto text-red-400 hover:text-red-600">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-red-100 space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credenciales Temporales</p>
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">email</span>
                                        <span className="font-mono text-sm text-slate-700 flex-1">{emergResult.emailTemp}</span>
                                        <button onClick={() => navigator.clipboard.writeText(emergResult.emailTemp)} className="text-[#006B76] hover:text-[#004F5A] text-xs font-bold">Copiar</button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">lock</span>
                                        <span className="font-mono text-sm text-slate-700 flex-1">{emergResult.passwordTemp}</span>
                                        <button onClick={() => navigator.clipboard.writeText(emergResult.passwordTemp)} className="text-[#006B76] hover:text-[#004F5A] text-xs font-bold">Copiar</button>
                                    </div>
                                </div>
                                <p className="text-xs text-red-500 mt-3 font-medium">Completa los datos del paciente cuando sea posible usando el botón "Completar Datos" de la lista inferior.</p>
                            </div>
                        )}

                        {/* Lista emergencias del día */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-500 text-lg">emergency_home</span>
                                    <h3 className="font-bold text-slate-800 text-sm">Emergencias de Hoy</h3>
                                </div>
                                <button onClick={fetchEmergencias} className="text-xs text-[#006B76] font-bold flex items-center gap-1 hover:underline">
                                    <span className="material-symbols-outlined text-sm">refresh</span>Actualizar
                                </button>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {emergencias.length === 0 && (
                                    <div className="px-6 py-10 text-center text-slate-400 text-sm">
                                        <span className="material-symbols-outlined text-3xl mb-2 block text-slate-300">emergency_home</span>
                                        No hay emergencias registradas hoy
                                    </div>
                                )}
                                {emergencias.map((em) => (
                                    <div key={em.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold flex-shrink-0">
                                            {em.paciente_nombre?.charAt(0)?.toUpperCase() || "E"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{em.paciente_nombre}</p>
                                            <p className="text-xs text-slate-400 truncate">Dr. {em.doctor_nombre} · {em.motivo}</p>
                                        </div>
                                        <button
                                            onClick={() => { setCompletarModal({ id: em.paciente_id, nombre: em.paciente_nombre }); setCompletarForm({ nombre: "", email: "", telefono: "", fecha_nacimiento: "", tipo_sangre: "" }); }}
                                            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[#E0F5F7] text-[#006B76] text-xs font-bold hover:bg-[#B2E5E8] transition-colors flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">edit_note</span>
                                            Completar Datos
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard": return renderDashboard();
            case "pacientes": return renderPacientes();
            case "doctores": return renderDoctores();
            case "citas": return renderCitas();
            case "crear": return renderCrearUsuario();
            case "emergencia": return renderEmergencia();
            default: return renderDashboard();
        }
    };

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

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-0.5">
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
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13.5px] transition-colors text-left ${
                                activeTab === item.id
                                    ? "bg-slate-50 text-slate-900 font-medium"
                                    : item.red ? "text-red-500 hover:text-red-700" : "text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            <span>{item.label}</span>
                            {item.badge ? (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                    {item.badge}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </nav>

                {/* Admin Profile / Logout */}
                <div className="px-3 pb-6 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2.5 px-3 mb-2">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-semibold shrink-0">
                            {adminName.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-medium text-slate-900 truncate leading-none">{adminName}</p>
                            <p className="font-mono text-[10px] text-slate-400 mt-0.5">Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 rounded-lg text-[13.5px] text-slate-500 hover:text-red-600 transition-colors text-left"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-[220px]">
                {/* Mobile Header */}
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

                {/* Desktop Top Bar */}
                <header className="hidden lg:flex h-16 border-b border-slate-100 items-center justify-end px-8 bg-white sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[13.5px] font-medium text-slate-900 leading-none">{adminName}</p>
                            <p className="font-mono text-[11px] text-slate-400 mt-0.5">Administrador</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-[13px] font-semibold">
                            {adminName.substring(0, 1).toUpperCase()}
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-6 md:px-8 pt-10 pb-24 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
}