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
    const [confirm, setConfirm] = useState(null);
    const [notification, setNotification] = useState(null);
    const [adminName] = useState(() => localStorage.getItem("userName") || "Admin");
    const [stats, setStats] = useState({ pacientes: 0, doctores: 0, citasHoy: 0, pendientes: 0 });
    const [pacientes, setPacientes] = useState([]);
    const [doctores, setDoctores] = useState([]);
    const [citas, setCitas] = useState([]);

    // ── Emergencia ──
    const ESPECIALIDADES_EMG = ["Cardiología", "Dermatología", "Neurología", "Pediatría", "Medicina General"];
    const [emergForm, setEmergForm] = useState({ nombre: "", especialidad: "", motivo: "" });
    const [emergLoading, setEmergLoading] = useState(false);
    const [emergResult, setEmergResult] = useState(null);
    const [emergencias, setEmergencias] = useState([]);
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
                    const res = await fetch(`${API_URL}/admin/usuarios/temporales`, { method: "DELETE" });
                    const data = await res.json();
                    if (data.success) {
                        notify("success", `${data.eliminados} cuenta${data.eliminados !== 1 ? "s" : ""} eliminada${data.eliminados !== 1 ? "s" : ""}.`);
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
        if (role !== "admin") { navigate("/login"); return; }
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
        } catch (error) { console.error("Error cargando datos del admin:", error); }
    };

    const handleLogout = () => { localStorage.clear(); navigate("/login"); };

    const deleteUsuario = (id) => {
        setConfirm({
            message: "Esto eliminará al usuario y todas sus citas asociadas. Esta acción no se puede deshacer.",
            confirmLabel: "Eliminar",
            onConfirm: async () => {
                setConfirm(null); setLoadingAction(true);
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
                setConfirm(null); setLoadingAction(true);
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
                setConfirm(null); setLoadingAction(true);
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
                tipo: createType, nombre: createForm.nombre, email: createForm.email, password: createForm.password,
                ...(createType === "doctor" && { especialidad: createForm.especialidad, licencia_medica: createForm.licencia }),
                ...(createType === "paciente" && { telefono: createForm.telefono, tipo_sangre: createForm.tipo_sangre, fecha_nacimiento: createForm.fecha_nacimiento }),
            };
            const res = await fetch(`${API_URL}/admin/crear-usuario`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setCreateSuccess({ nombre: createForm.nombre, tipo: createType, id: data.id, licencia: createForm.licencia });
                setCreateForm({ ...emptyForm, licencia: generarLicencia() });
                await fetchAllData();
            } else { setCreateError(data.message || "No se pudo crear el usuario."); }
        } catch { setCreateError("Error de conexión con el servidor."); }
        finally { setCreateLoading(false); }
    };

    const navItems = [
        { id: "dashboard", label: "Dashboard" },
        { id: "pacientes", label: "Pacientes" },
        { id: "doctores", label: "Doctores" },
        { id: "citas", label: "Citas", badge: stats.pendientes > 0 ? stats.pendientes : null },
        { id: "crear", label: "Crear Usuario" },
        { id: "emergencia", label: "Emergencia", red: true },
    ];

    // ─── INPUT HELPERS ────────────────────────────────────────────────────────
    const inputLine = (hasErr) =>
        `w-full text-[14px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b ${hasErr ? "border-red-400" : "border-slate-200"} focus:border-slate-900 py-2 transition-colors outline-none`;
    const labelMono = "font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 block mb-1.5";
    const FieldErr = ({ name }) => createFieldErrors[name]
        ? <p className="mt-1 text-[12px] text-red-500">{createFieldErrors[name]}</p>
        : null;

    // ─── DASHBOARD ────────────────────────────────────────────────────────────
    const renderDashboard = () => {
        const recentCitas = citas.slice(0, 8);
        return (
            <>
                <div className="anim-rise d-0 mb-10">
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Sistema</p>
                    <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">Dashboard</h1>
                </div>

                <div className="anim-rise d-1 mb-12">
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-6">Resumen</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                        {[
                            { label: "Pacientes", value: stats.pacientes },
                            { label: "Doctores", value: stats.doctores },
                            { label: "Citas hoy", value: stats.citasHoy },
                            { label: "Pendientes", value: stats.pendientes },
                        ].map((s) => (
                            <div key={s.label}>
                                <p className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">{s.value}</p>
                                <p className="font-mono text-[10px] tracking-[0.18em] text-slate-400 mt-2 uppercase">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="anim-rise d-2">
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-4">Actividad reciente</p>
                    {recentCitas.length === 0 ? (
                        <p className="text-[14px] text-slate-400 py-8 border-t border-slate-100">Sin actividad reciente.</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recentCitas.map((c) => {
                                const sc = c.estado === "ACEPTADA" ? "text-emerald-600" : c.estado === "PENDIENTE" ? "text-amber-600" : "text-red-500";
                                return (
                                    <div key={c.id} className="flex items-center gap-5 py-4">
                                        <span className="text-[13px] text-slate-500 shrink-0 w-20">
                                            {new Date(c.fecha_solicitada).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                        </span>
                                        <span className="text-[14px] font-medium text-slate-900 flex-1 truncate">{c.paciente_nombre}</span>
                                        <span className="text-[13px] text-slate-400 shrink-0 hidden sm:block truncate max-w-[140px]">{c.doctor_nombre}</span>
                                        <span className={`text-[12px] font-medium shrink-0 ${sc}`}>{c.estado}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </>
        );
    };

    // ─── PACIENTES ────────────────────────────────────────────────────────────
    const renderPacientes = () => {
        const filtered = pacientes.filter(p =>
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const tempCount = pacientes.filter(p => p.email?.includes("@mediconnect.tmp")).length;
        return (
            <>
                <div className="anim-rise d-0 mb-10">
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Registro</p>
                    <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">Pacientes</h1>
                </div>

                <div className="anim-rise d-1 flex items-center justify-between mb-6">
                    <input
                        type="text" placeholder="Buscar paciente..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-72 text-[14px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b border-slate-200 focus:border-slate-900 py-2 transition-colors outline-none"
                    />
                    {tempCount > 0 && (
                        <button onClick={deleteTempUsers} className="text-[12px] text-red-500 hover:text-red-700 transition-colors shrink-0 ml-4">
                            Limpiar temporales ({tempCount})
                        </button>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <p className="text-[14px] text-slate-400 py-8 border-t border-slate-100">
                        {searchTerm ? "No se encontraron pacientes." : "No hay pacientes registrados."}
                    </p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map((p) => {
                            const esTemp = p.email?.includes("@mediconnect.tmp");
                            return (
                                <div key={p.id} className="flex items-center gap-5 py-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[13px] font-semibold shrink-0">
                                        {p.nombre?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <span className="text-[14px] font-medium text-slate-900 flex-1 truncate">{p.nombre}</span>
                                    {esTemp
                                        ? <span className="text-[11px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full shrink-0">Temporal</span>
                                        : <span className="text-[13px] text-slate-400 shrink-0 hidden sm:block truncate max-w-[180px]">{p.email}</span>
                                    }
                                    <span className="font-mono text-[11px] text-slate-400 shrink-0">PT-{String(p.id).padStart(4, '0')}</span>
                                    <button onClick={() => deleteUsuario(p.id)} className="text-[12px] text-slate-300 hover:text-red-500 transition-colors shrink-0">
                                        Eliminar
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </>
        );
    };

    // ─── DOCTORES ─────────────────────────────────────────────────────────────
    const renderDoctores = () => {
        const filteredDoc = doctores.filter(d =>
            d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
            <>
                <div className="anim-rise d-0 mb-10">
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Personal</p>
                    <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">Doctores</h1>
                </div>

                <div className="anim-rise d-1 mb-6">
                    <input
                        type="text" placeholder="Buscar doctor o especialidad..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-72 text-[14px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b border-slate-200 focus:border-slate-900 py-2 transition-colors outline-none"
                    />
                </div>

                {filteredDoc.length === 0 ? (
                    <p className="text-[14px] text-slate-400 py-8 border-t border-slate-100">
                        {searchTerm ? "No se encontraron doctores." : "No hay doctores registrados."}
                    </p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredDoc.map((d) => (
                            <div key={d.id} className="flex items-center gap-5 py-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[13px] font-semibold shrink-0">
                                    {d.nombre?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="text-[14px] font-medium text-slate-900 flex-1 truncate">{d.nombre}</span>
                                <span className="text-[13px] text-slate-400 shrink-0">{d.especialidad}</span>
                                <span className="font-mono text-[11px] text-slate-400 shrink-0 hidden sm:block">DR-{String(d.id).padStart(4, '0')}</span>
                                <button onClick={() => deleteUsuario(d.id)} className="text-[12px] text-slate-300 hover:text-red-500 transition-colors shrink-0">
                                    Eliminar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    // ─── CITAS ────────────────────────────────────────────────────────────────
    const renderCitas = () => {
        const filteredCitas = citas.filter(c =>
            c.paciente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.doctor_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
            <>
                <div className="anim-rise d-0 mb-10">
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Agenda</p>
                    <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">Citas</h1>
                </div>

                <div className="anim-rise d-1 flex items-center justify-between mb-6">
                    <input
                        type="text" placeholder="Buscar paciente o doctor..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-72 text-[14px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b border-slate-200 focus:border-slate-900 py-2 transition-colors outline-none"
                    />
                    <div className="flex items-center gap-4 shrink-0 ml-4 text-[12px] text-slate-400">
                        <span>{citas.filter(c => c.estado === "PENDIENTE").length} pendientes</span>
                        <span>{citas.filter(c => c.estado === "ACEPTADA").length} aceptadas</span>
                    </div>
                </div>

                {filteredCitas.length === 0 ? (
                    <p className="text-[14px] text-slate-400 py-8 border-t border-slate-100">
                        {searchTerm ? "No se encontraron citas." : "No hay citas registradas."}
                    </p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredCitas.map((c) => {
                            const sc = c.estado === "ACEPTADA" ? "text-emerald-600" : c.estado === "PENDIENTE" ? "text-amber-600" : "text-red-500";
                            return (
                                <div key={c.id} className="flex items-center gap-5 py-4">
                                    <span className="text-[13px] text-slate-500 shrink-0 w-20">
                                        {new Date(c.fecha_solicitada).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                    </span>
                                    <span className="text-[14px] font-medium text-slate-900 flex-1 truncate">{c.paciente_nombre}</span>
                                    <span className="text-[13px] text-slate-400 shrink-0 hidden sm:block truncate max-w-[120px]">{c.doctor_nombre}</span>
                                    <span className={`text-[12px] font-medium shrink-0 ${sc}`}>{c.estado}</span>
                                    {c.estado === "PENDIENTE" && (
                                        <button onClick={() => cancelarCita(c.id)} className="text-[12px] text-slate-400 hover:text-amber-600 transition-colors shrink-0">
                                            Cancelar
                                        </button>
                                    )}
                                    <button onClick={() => deleteCita(c.id)} className="text-[12px] text-slate-300 hover:text-red-500 transition-colors shrink-0">
                                        Eliminar
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </>
        );
    };

    // ─── CREAR USUARIO ────────────────────────────────────────────────────────
    const renderCrearUsuario = () => {
        const ESPECIALIDADES = ["Cardiología", "Dermatología", "Neurología", "Pediatría", "Medicina General"];
        const TIPOS_SANGRE   = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
        const TIPOS = [
            { key: "paciente", label: "Paciente", desc: "Acceso al portal de citas" },
            { key: "doctor",   label: "Doctor",   desc: "Acceso al panel médico" },
            { key: "admin",    label: "Admin",    desc: "Acceso total al sistema" },
        ];
        return (
            <>
                <div className="anim-rise d-0 mb-10">
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-1.5">Admin</p>
                    <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none">Crear Usuario</h1>
                </div>

                {/* Success */}
                {createSuccess && (
                    <div className="mb-8 py-4 border-t border-b border-emerald-200 flex items-center justify-between">
                        <div>
                            <p className="text-[14px] font-medium text-slate-900">
                                {createSuccess.nombre} <span className="text-slate-400">·</span> <span className="capitalize text-slate-500">{createSuccess.tipo}</span> <span className="text-slate-400">·</span> <span className="font-mono text-[12px] text-slate-400">ID #{createSuccess.id}</span>
                            </p>
                            {createSuccess.tipo === "doctor" && (
                                <p className="font-mono text-[11px] text-slate-400 mt-0.5">Licencia: {createSuccess.licencia}</p>
                            )}
                        </div>
                        <span className="text-[12px] text-emerald-600 font-medium">Creado</span>
                    </div>
                )}

                {/* Tipo selector */}
                <div className="anim-rise d-1 mb-8">
                    <p className={labelMono}>Tipo de usuario</p>
                    <div className="flex flex-wrap gap-2">
                        {TIPOS.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => { setCreateType(t.key); setCreateError(""); setCreateSuccess(null); setCreateFieldErrors({}); }}
                                className={`px-4 py-1.5 rounded-full text-[13px] transition-colors ${
                                    createType === t.key
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {createError && (
                    <p className="mb-6 text-[13px] text-red-500">{createError}</p>
                )}

                <form onSubmit={handleCrearUsuario} className="anim-rise d-2 space-y-8">
                    {/* Nombre */}
                    <div className="grid sm:grid-cols-[160px_1fr] gap-3 sm:gap-8 items-start">
                        <p className={`${labelMono} pt-1`}>Nombre completo *</p>
                        <div>
                            <input className={inputLine(createFieldErrors.nombre)} type="text" placeholder="Ej. María González" required
                                value={createForm.nombre}
                                onChange={e => { setCreateForm(f => ({ ...f, nombre: e.target.value })); setCreateFieldErrors(p => ({ ...p, nombre: null })); }} />
                            <FieldErr name="nombre" />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="grid sm:grid-cols-[160px_1fr] gap-3 sm:gap-8 items-start">
                        <p className={`${labelMono} pt-1`}>Correo electrónico *</p>
                        <div>
                            <input className={inputLine(createFieldErrors.email)} type="email" placeholder="correo@ejemplo.com" required
                                value={createForm.email}
                                onChange={e => { setCreateForm(f => ({ ...f, email: e.target.value })); setCreateFieldErrors(p => ({ ...p, email: null })); }} />
                            <FieldErr name="email" />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="grid sm:grid-cols-[160px_1fr] gap-3 sm:gap-8 items-start">
                        <p className={`${labelMono} pt-1`}>Contraseña * (mín. 8)</p>
                        <div className="relative">
                            <input className={inputLine(createFieldErrors.password)} type={showCreatePwd ? "text" : "password"} placeholder="••••••••" required
                                value={createForm.password}
                                onChange={e => { setCreateForm(f => ({ ...f, password: e.target.value })); setCreateFieldErrors(p => ({ ...p, password: null })); }} />
                            <button type="button" onClick={() => setShowCreatePwd(v => !v)}
                                className="absolute right-0 top-1 text-slate-400 hover:text-slate-700 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">{showCreatePwd ? "visibility_off" : "visibility"}</span>
                            </button>
                            <FieldErr name="password" />
                        </div>
                    </div>

                    {/* Doctor fields */}
                    {createType === "doctor" && (<>
                        <div className="grid sm:grid-cols-[160px_1fr] gap-3 sm:gap-8 items-start">
                            <p className={`${labelMono} pt-1`}>Especialidad *</p>
                            <div>
                                <select className={inputLine(createFieldErrors.especialidad)} required value={createForm.especialidad}
                                    onChange={e => { setCreateForm(f => ({ ...f, especialidad: e.target.value })); setCreateFieldErrors(p => ({ ...p, especialidad: null })); }}>
                                    <option value="">Seleccione especialidad...</option>
                                    {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                                <FieldErr name="especialidad" />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-[160px_1fr] gap-3 sm:gap-8 items-start">
                            <p className={`${labelMono} pt-1`}>Licencia médica</p>
                            <div className="flex gap-3 items-center">
                                <span className="font-mono text-[13px] text-slate-500 flex-1">{createForm.licencia}</span>
                                <button type="button" onClick={() => setCreateForm(f => ({ ...f, licencia: generarLicencia() }))}
                                    className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors">
                                    Regenerar
                                </button>
                            </div>
                        </div>
                    </>)}

                    {/* Paciente fields */}
                    {createType === "paciente" && (<>
                        <div className="grid sm:grid-cols-[160px_1fr] gap-3 sm:gap-8 items-start">
                            <p className={`${labelMono} pt-1`}>Teléfono (SV)</p>
                            <div>
                                <input className={inputLine(createFieldErrors.telefono)} type="tel" placeholder="Ej. 7234-5678" maxLength={9}
                                    value={createForm.telefono}
                                    onChange={e => { setCreateForm(f => ({ ...f, telefono: e.target.value })); setCreateFieldErrors(p => ({ ...p, telefono: null })); }} />
                                <FieldErr name="telefono" />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-[160px_1fr] gap-3 sm:gap-8 items-start">
                            <p className={`${labelMono} pt-1`}>Tipo de sangre</p>
                            <select className={inputLine(false)} value={createForm.tipo_sangre}
                                onChange={e => setCreateForm(f => ({ ...f, tipo_sangre: e.target.value }))}>
                                <option value="">Seleccione...</option>
                                {TIPOS_SANGRE.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="grid sm:grid-cols-[160px_1fr] gap-3 sm:gap-8 items-start">
                            <p className={`${labelMono} pt-1`}>Fecha de nacimiento</p>
                            <div>
                                <input className={inputLine(createFieldErrors.fecha_nacimiento)} type="date"
                                    min={minBirthDate()} max={maxBirthDate()}
                                    value={createForm.fecha_nacimiento}
                                    onChange={e => { setCreateForm(f => ({ ...f, fecha_nacimiento: e.target.value })); setCreateFieldErrors(p => ({ ...p, fecha_nacimiento: null })); }} />
                                <FieldErr name="fecha_nacimiento" />
                            </div>
                        </div>
                    </>)}

                    <div className="flex items-center justify-between pt-2">
                        <button type="button"
                            onClick={() => { setCreateForm({ ...emptyForm, licencia: generarLicencia() }); setCreateError(""); setCreateSuccess(null); setCreateFieldErrors({}); }}
                            className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors">
                            Limpiar
                        </button>
                        <button type="submit" disabled={createLoading}
                            className="bg-slate-900 text-white rounded-full px-5 py-2 text-[13px] font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
                            {createLoading ? "Creando..." : "Crear usuario"}
                        </button>
                    </div>
                </form>
            </>
        );
    };

    // ─── EMERGENCIA ───────────────────────────────────────────────────────────
    const renderEmergencia = () => {
        const TIPOS_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
        const iLine = "w-full text-[14px] text-slate-900 placeholder:text-slate-400 bg-transparent border-b border-slate-200 focus:border-slate-900 py-2 transition-colors outline-none";
        return (
            <>
                {/* Modal completar datos */}
                {completarModal && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10002 }}>
                        <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", maxWidth: "480px", width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
                            <h3 className="text-[17px] font-semibold text-slate-900 mb-1">Completar Datos</h3>
                            <p className="text-[13px] text-slate-400 mb-8">Paciente: <span className="text-slate-700 font-medium">{completarModal.nombre}</span></p>
                            <form onSubmit={handleCompletarDatos} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className={labelMono}>Nombre completo</p>
                                        <input className={iLine} type="text" placeholder="Nombre real" value={completarForm.nombre} onChange={e => setCompletarForm(f => ({ ...f, nombre: e.target.value }))} />
                                    </div>
                                    <div>
                                        <p className={labelMono}>Correo real</p>
                                        <input className={iLine} type="email" placeholder="correo@ejemplo.com" value={completarForm.email} onChange={e => setCompletarForm(f => ({ ...f, email: e.target.value }))} />
                                    </div>
                                    <div>
                                        <p className={labelMono}>Teléfono (SV)</p>
                                        <input className={iLine} type="tel" placeholder="7234-5678" maxLength={9} value={completarForm.telefono} onChange={e => setCompletarForm(f => ({ ...f, telefono: e.target.value }))} />
                                    </div>
                                    <div>
                                        <p className={labelMono}>Fecha de nacimiento</p>
                                        <input className={iLine} type="date" value={completarForm.fecha_nacimiento} onChange={e => setCompletarForm(f => ({ ...f, fecha_nacimiento: e.target.value }))} />
                                    </div>
                                    <div>
                                        <p className={labelMono}>Tipo de sangre</p>
                                        <select className={iLine} value={completarForm.tipo_sangre} onChange={e => setCompletarForm(f => ({ ...f, tipo_sangre: e.target.value }))}>
                                            <option value="">Seleccione...</option>
                                            {TIPOS_SANGRE.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <button type="button" onClick={() => setCompletarModal(null)}
                                        className="text-[13px] text-slate-500 hover:text-slate-700 transition-colors">Cancelar</button>
                                    <button type="submit" disabled={completarLoading}
                                        className="bg-slate-900 text-white rounded-full px-5 py-2 text-[13px] font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
                                        {completarLoading ? "Guardando..." : "Guardar datos"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="anim-rise d-0 mb-10">
                    <div className="flex items-center gap-3 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-red-600">Urgente</p>
                    </div>
                    <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-slate-900 leading-none mb-2">Emergencia</h1>
                    <p className="text-[14px] text-slate-400">Registra al paciente en segundos. El sistema asigna un doctor y genera credenciales automáticamente.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleEmergencia} className="anim-rise d-1 space-y-8 mb-12">
                    <div className="grid sm:grid-cols-[160px_1fr] gap-3 sm:gap-8 items-start">
                        <p className={`${labelMono} pt-1`}>Nombre del paciente *</p>
                        <input className={iLine} type="text" required placeholder='"Juan Pérez" o "No Identificado"'
                            value={emergForm.nombre} onChange={e => setEmergForm(f => ({ ...f, nombre: e.target.value }))} />
                    </div>
                    <div className="grid sm:grid-cols-[160px_1fr] gap-3 sm:gap-8 items-start">
                        <p className={`${labelMono} pt-1`}>Especialidad *</p>
                        <select className={iLine} required value={emergForm.especialidad} onChange={e => setEmergForm(f => ({ ...f, especialidad: e.target.value }))}>
                            <option value="">Seleccione especialidad...</option>
                            {ESPECIALIDADES_EMG.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div className="grid sm:grid-cols-[160px_1fr] gap-3 sm:gap-8 items-start">
                        <p className={`${labelMono} pt-1`}>Motivo *</p>
                        <textarea className={`${iLine} resize-none`} required rows={3}
                            placeholder="Describe brevemente el motivo..."
                            value={emergForm.motivo} onChange={e => setEmergForm(f => ({ ...f, motivo: e.target.value }))} />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={emergLoading}
                            className="bg-red-600 text-white rounded-full px-5 py-2 text-[13px] font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                            {emergLoading ? "Registrando..." : "Registrar emergencia"}
                        </button>
                    </div>
                </form>

                {/* Resultado */}
                {emergResult && (
                    <div className="anim-rise d-2 mb-10 py-4 border-t border-b border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[14px] font-medium text-slate-900">Emergencia registrada · Dr. {emergResult.doctorNombre}</p>
                            <button onClick={() => setEmergResult(null)} className="text-[12px] text-slate-400 hover:text-slate-700">Cerrar</button>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-[11px] text-slate-400 w-16">Email</span>
                                <span className="font-mono text-[13px] text-slate-700 flex-1">{emergResult.emailTemp}</span>
                                <button onClick={() => navigator.clipboard.writeText(emergResult.emailTemp)} className="text-[11px] text-slate-400 hover:text-slate-700">Copiar</button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-[11px] text-slate-400 w-16">Pass</span>
                                <span className="font-mono text-[13px] text-slate-700 flex-1">{emergResult.passwordTemp}</span>
                                <button onClick={() => navigator.clipboard.writeText(emergResult.passwordTemp)} className="text-[11px] text-slate-400 hover:text-slate-700">Copiar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lista del día */}
                <div className="anim-rise d-3">
                    <div className="flex items-center justify-between mb-4">
                        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400">Emergencias de hoy</p>
                        <button onClick={fetchEmergencias} className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors">Actualizar</button>
                    </div>

                    {emergencias.length === 0 ? (
                        <p className="text-[14px] text-slate-400 py-8 border-t border-slate-100">No hay emergencias registradas hoy.</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {emergencias.map((em) => (
                                <div key={em.id} className="flex items-center gap-5 py-4">
                                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-[13px] font-semibold shrink-0">
                                        {em.paciente_nombre?.charAt(0)?.toUpperCase() || "E"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-medium text-slate-900 truncate">{em.paciente_nombre}</p>
                                        <p className="text-[12px] text-slate-400 truncate">Dr. {em.doctor_nombre} · {em.motivo}</p>
                                    </div>
                                    <button
                                        onClick={() => { setCompletarModal({ id: em.paciente_id, nombre: em.paciente_nombre }); setCompletarForm({ nombre: "", email: "", telefono: "", fecha_nacimiento: "", tipo_sangre: "" }); }}
                                        className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors shrink-0">
                                        Completar datos
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </>
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`w-[220px] shrink-0 bg-white border-r border-slate-100 flex flex-col fixed h-screen z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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

                <nav className="flex-1 px-3 space-y-0.5">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setSearchTerm("");
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
                    <button onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 rounded-lg text-[13.5px] text-slate-500 hover:text-red-600 transition-colors text-left">
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-[220px]">
                {/* Mobile header */}
                <header className="lg:hidden sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-30">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center"><Cross /></div>
                        <span className="text-[15px] font-semibold text-slate-900">Medi<span className="text-red-600">Connect</span></span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                </header>

                {/* Desktop top bar */}
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

                <main className="flex-1 overflow-x-hidden">
                    <div className="max-w-[860px] mx-auto px-8 pt-14 pb-24 w-full">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
}
