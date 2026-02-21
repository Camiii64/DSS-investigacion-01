import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Admin() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({ pacientes: 0, doctores: 0, citasHoy: 0, pendientes: 0 });
    const [pacientes, setPacientes] = useState([]);
    const [doctores, setDoctores] = useState([]);
    const [citas, setCitas] = useState([]);

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
                fetch("http://localhost:3001/admin/stats"),
                fetch("http://localhost:3001/admin/pacientes"),
                fetch("http://localhost:3001/admin/doctores"),
                fetch("http://localhost:3001/admin/citas")
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

    const deleteUsuario = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar a este usuario? Esto borrará sus citas asociadas.")) return;
        try {
            const res = await fetch(`http://localhost:3001/admin/usuarios/${id}`, { method: "DELETE" });
            if (res.ok) fetchAllData();
        } catch (error) {
            alert("Error eliminando usuario");
        }
    };

    const deleteCita = async (id) => {
        if (!window.confirm("¿Deseas eliminar esta cita permanentemente?")) return;
        try {
            const res = await fetch(`http://localhost:3001/admin/citas/${id}`, { method: "DELETE" });
            if (res.ok) fetchAllData();
        } catch (error) {
            alert("Error eliminando cita");
        }
    };

    const cancelarCita = async (id) => {
        if (!window.confirm("¿Deseas marcar esta cita como CANCELADA?")) return;
        try {
            const res = await fetch(`http://localhost:3001/citas/${id}/cancelar`, { method: "PUT" });
            if (res.ok) fetchAllData();
        } catch (error) {
            alert("Error cancelando cita");
        }
    };

    return (
        <div className="bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 min-h-screen flex font-['Inter',sans-serif]">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col fixed h-full z-10">
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-[#135bec] rounded-lg p-2 text-white">
                        <span className="material-symbols-outlined">local_hospital</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold leading-tight">Hospital Admin</h1>
                        <p className="text-xs text-slate-500">Master Management</p>
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#135bec] text-white font-medium">
                        <span className="material-symbols-outlined text-sm">dashboard</span>
                        <span className="text-sm">Dashboard</span>
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[#135bec] text-xs">
                            AD
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-semibold truncate">Admin User</p>
                            <p className="text-[10px] text-slate-500 truncate">admin@hospital.com</p>
                        </div>
                        <button onClick={handleLogout} className="material-symbols-outlined text-slate-400 text-lg hover:text-red-500 transition-colors">
                            logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Dashboard Principal</h2>
                        <p className="text-slate-500 text-sm">Resumen general y gestión administrativa</p>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">Total Pacientes</p>
                            <span className="material-symbols-outlined text-[#135bec]">person</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.pacientes}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">Doctores Activos</p>
                            <span className="material-symbols-outlined text-[#135bec]">medical_services</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.doctores}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">Citas Hoy</p>
                            <span className="material-symbols-outlined text-[#135bec]">event_available</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.citasHoy}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-500">Acciones Pendientes</p>
                            <span className="material-symbols-outlined text-[#135bec]">pending_actions</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-500">{stats.pendientes}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Gestión de Pacientes */}
                    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-96 shadow-sm">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">Gestión de Pacientes</h3>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3">Nombre</th>
                                        <th className="px-6 py-3">Email</th>
                                        <th className="px-6 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {pacientes.map((paciente) => (
                                        <tr key={paciente.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <td className="px-6 py-4 font-medium">{paciente.nombre}</td>
                                            <td className="px-6 py-4 text-slate-500">{paciente.email}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => deleteUsuario(paciente.id)}
                                                    className="text-red-600 bg-red-50 hover:bg-red-600 hover:text-white p-1.5 rounded-lg transition-all duration-200"
                                                    title="Eliminar Paciente"
                                                >
                                                    <span className="material-symbols-outlined text-lg leading-none">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Gestión de Doctores */}
                    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-96 shadow-sm">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">Gestión de Doctores</h3>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3">Doctor</th>
                                        <th className="px-6 py-3">Especialidad</th>
                                        <th className="px-6 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {doctores.map((doctor) => (
                                        <tr key={doctor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <td className="px-6 py-4 font-medium">{doctor.nombre}</td>
                                            <td className="px-6 py-4 text-slate-500">{doctor.especialidad}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => deleteUsuario(doctor.id)}
                                                    className="text-red-600 bg-red-50 hover:bg-red-600 hover:text-white p-1.5 rounded-lg transition-all duration-200"
                                                    title="Eliminar Doctor"
                                                >
                                                    <span className="material-symbols-outlined text-lg leading-none">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Control de Citas */}
                <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#135bec]">calendar_month</span>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">Control de Citas Global</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Paciente</th>
                                    <th className="px-6 py-3">Doctor</th>
                                    <th className="px-6 py-3">Fecha y Hora</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {citas.map((cita) => (
                                    <tr key={cita.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <td className="px-6 py-4 font-medium">{cita.paciente_nombre}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{cita.doctor_nombre}</td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            {new Date(cita.fecha_solicitada).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${cita.estado === 'ACEPTADA' ? 'bg-green-100 text-green-700' :
                                                cita.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {cita.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-3">
                                            {/* BOTÓN CANCELAR (Naranja) */}
                                            {cita.estado === "PENDIENTE" && (
                                                <button
                                                    onClick={() => cancelarCita(cita.id)}
                                                    className="text-orange-600 bg-orange-50 hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200 inline-flex items-center gap-1"
                                                    title="Marcar como Cancelada"
                                                >
                                                    <span className="material-symbols-outlined text-sm">block</span>
                                                    <span className="text-xs font-bold uppercase">Cancelar</span>
                                                </button>
                                            )}

                                            {/* BOTÓN ELIMINAR (Rojo) */}
                                            <button
                                                onClick={() => deleteCita(cita.id)}
                                                className="text-red-600 bg-red-50 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200 inline-flex items-center gap-1"
                                                title="Eliminar de la Base de Datos"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete_forever</span>
                                                <span className="text-xs font-bold uppercase">Eliminar</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {citas.length === 0 && (
                                    <tr><td colSpan="5" className="px-6 py-4 text-center text-slate-500">No hay citas registradas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}