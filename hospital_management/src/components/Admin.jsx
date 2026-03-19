import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();

  const [view, setView] = useState("dashboard");

  const [messageAdmin, setMessageAdmin] = useState(null);
  const [messagePaciente, setMessagePaciente] = useState(null);
  const [messageDoctor, setMessageDoctor] = useState(null);

  const [stats, setStats] = useState({
    pacientes: 0,
    doctores: 0,
    citasHoy: 0,
    pendientes: 0,
  });
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [citas, setCitas] = useState([]);

  const [doctor, setDoctor] = useState({
    nombre: "",
    email: "",
    password: "",
    especialidad: "",
    licencia: "",
  });
  const [paciente, setPaciente] = useState({
    nombre: "",
    email: "",
    password: "",
    fecha: "",
    telefono: "",
    sangre: "",
  });
  const [admin, setAdmin] = useState({ nombre: "", email: "", password: "" });

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") navigate("/login");
    fetchAllData();
  }, []);

  useEffect(() => {
    if (messageAdmin) {
      setTimeout(() => setMessageAdmin(null), 3000);
    }
  }, [messageAdmin]);

  useEffect(() => {
    if (messagePaciente) {
      setTimeout(() => setMessagePaciente(null), 3000);
    }
  }, [messagePaciente]);

  useEffect(() => {
    if (messageDoctor) {
      setTimeout(() => setMessageDoctor(null), 3000);
    }
  }, [messageDoctor]);

  const fetchAllData = async () => {
    const [resStats, resPacientes, resDoctores, resCitas] = await Promise.all([
      fetch("http://localhost:3000/admin/stats"),
      fetch("http://localhost:3000/admin/pacientes"),
      fetch("http://localhost:3000/admin/doctores"),
      fetch("http://localhost:3000/admin/citas"),
    ]);

    setStats(await resStats.json());
    setPacientes(await resPacientes.json());
    setDoctores(await resDoctores.json());
    setCitas(await resCitas.json());
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ================= CREATE =================

  const createDoctor = async () => {
    try {
      const res = await fetch("http://localhost:3000/admin/create-doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(doctor),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessageDoctor({
          type: "success",
          text: "✅ Doctor creado correctamente",
        });

        setDoctor({
          nombre: "",
          email: "",
          password: "",
          especialidad: "",
          licencia: "",
        });

        fetchAllData();
      } else {
        setMessageDoctor({
          type: "error",
          text: data.message || "❌ No se pudo crear el doctor",
        });
      }
    } catch (error) {
      console.error(error);

      setMessageDoctor({
        type: "error",
        text: "❌ Error del servidor",
      });
    }
  };

  const createPaciente = async () => {
    try {
      const res = await fetch("http://localhost:3000/admin/create-paciente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: paciente.nombre,
          email: paciente.email,
          password: paciente.password,
          fecha_nacimiento: paciente.fecha,
          telefono: paciente.telefono,
          tipo_sangre: paciente.sangre,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessagePaciente({
          type: "success",
          text: "✅ Paciente creado correctamente",
        });

        setPaciente({
          nombre: "",
          email: "",
          password: "",
          fecha: "",
          telefono: "",
          sangre: "",
        });

        fetchAllData();
      } else {
        setMessagePaciente({
          type: "error",
          text: data.message || "❌ No se pudo crear el paciente",
        });
      }
    } catch (error) {
      console.error(error);

      setMessagePaciente({
        type: "error",
        text: "❌ Error del servidor",
      });
    }
  };

  const createAdmin = async () => {
    try {
      const res = await fetch("http://localhost:3000/admin/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(admin),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessageAdmin({
          type: "success",
          text: "✅ Admin creado correctamente",
        });

        setAdmin({ nombre: "", email: "", password: "" });

        fetchAllData();
      } else {
        setMessageAdmin({
          type: "error",
          text: data.message || "❌ No se pudo crear el admin",
        });
      }
    } catch (error) {
      console.error(error);

      setMessageAdmin({
        type: "error",
        text: "❌ Error del servidor",
      });
    }
  };

  // ================= DELETE =================

  const deleteUsuario = async (id) => {
    await fetch(`http://localhost:3000/admin/usuarios/${id}`, {
      method: "DELETE",
    });
    fetchAllData();
  };

  const deleteCita = async (id) => {
    await fetch(`http://localhost:3000/admin/citas/${id}`, {
      method: "DELETE",
    });
    fetchAllData();
  };

  const cancelarCita = async (id) => {
    await fetch(`http://localhost:3000/citas/${id}/cancelar`, {
      method: "PUT",
    });
    fetchAllData();
  };

  return (
    <div className="bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 min-h-screen flex font-['Inter',sans-serif]">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col fixed h-full z-10">
        {/* HEADER */}
        <div className="p-6 flex items-center gap-3">
          <div className="bg-[#135bec] rounded-lg p-2 text-white">
            <span className="material-symbols-outlined">local_hospital</span>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Hospital Admin</h1>
            <p className="text-xs text-slate-500">Master Management</p>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {/* DASHBOARD */}
          <button
            onClick={() => setView("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${
              view === "dashboard"
                ? "bg-[#135bec] text-white"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-sm">dashboard</span>
            <span className="text-sm">Dashboard</span>
          </button>

          {/* CREAR USUARIOS */}
          <button
            onClick={() => setView("create")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${
              view === "create"
                ? "bg-[#135bec] text-white"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              person_add
            </span>
            <span className="text-sm">Crear Usuarios</span>
          </button>
        </nav>

        {/* FOOTER USER */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[#135bec] text-xs">
              AD
            </div>

            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold truncate">Admin User</p>
              <p className="text-[10px] text-slate-500 truncate">
                admin@hospital.com
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="material-symbols-outlined text-slate-400 text-lg hover:text-red-500 transition-colors"
            >
              logout
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-64 p-8">
        {/* ================= DASHBOARD ================= */}
        {view === "dashboard" && (
          <>
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
              <header className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Dashboard Principal
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Resumen general y gestión administrativa
                  </p>
                </div>
              </header>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-500">
                      Total Pacientes
                    </p>
                    <span className="material-symbols-outlined text-[#135bec]">
                      person
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{stats.pacientes}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-500">
                      Doctores Activos
                    </p>
                    <span className="material-symbols-outlined text-[#135bec]">
                      medical_services
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{stats.doctores}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-500">
                      Citas Hoy
                    </p>
                    <span className="material-symbols-outlined text-[#135bec]">
                      event_available
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{stats.citasHoy}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-500">
                      Acciones Pendientes
                    </p>
                    <span className="material-symbols-outlined text-[#135bec]">
                      pending_actions
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-orange-500">
                    {stats.pendientes}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Gestión de Pacientes */}
                <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-96 shadow-sm">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">
                      Gestión de Pacientes
                    </h3>
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
                          <tr
                            key={paciente.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium">
                              {paciente.nombre}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {paciente.email}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => deleteUsuario(paciente.id)}
                                className="text-red-600 bg-red-50 hover:bg-red-600 hover:text-white p-1.5 rounded-lg transition-all duration-200"
                                title="Eliminar Paciente"
                              >
                                <span className="material-symbols-outlined text-lg leading-none">
                                  delete
                                </span>
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
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">
                      Gestión de Doctores
                    </h3>
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
                          <tr
                            key={doctor.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium">
                              {doctor.nombre}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {doctor.especialidad}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => deleteUsuario(doctor.id)}
                                className="text-red-600 bg-red-50 hover:bg-red-600 hover:text-white p-1.5 rounded-lg transition-all duration-200"
                                title="Eliminar Doctor"
                              >
                                <span className="material-symbols-outlined text-lg leading-none">
                                  delete
                                </span>
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
                    <span className="material-symbols-outlined text-[#135bec]">
                      calendar_month
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">
                      Control de Citas Global
                    </h3>
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
                        <tr
                          key={cita.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium">
                            {cita.paciente_nombre}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {cita.doctor_nombre}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">
                            {new Date(cita.fecha_solicitada).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                cita.estado === "ACEPTADA"
                                  ? "bg-green-100 text-green-700"
                                  : cita.estado === "PENDIENTE"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
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
                                <span className="material-symbols-outlined text-sm">
                                  block
                                </span>
                                <span className="text-xs font-bold uppercase">
                                  Cancelar
                                </span>
                              </button>
                            )}

                            {/* BOTÓN ELIMINAR (Rojo) */}
                            <button
                              onClick={() => deleteCita(cita.id)}
                              className="text-red-600 bg-red-50 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200 inline-flex items-center gap-1"
                              title="Eliminar de la Base de Datos"
                            >
                              <span className="material-symbols-outlined text-sm">
                                delete_forever
                              </span>
                              <span className="text-xs font-bold uppercase">
                                Eliminar
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {citas.length === 0 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-4 text-center text-slate-500"
                          >
                            No hay citas registradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </main>
          </>
        )}

        {/* ================= CREATE ================= */}
        {view === "create" && (
          <>
            <header className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Crear Usuarios
                </h2>
                <p className="text-slate-500 text-sm">
                  Registro de nuevos usuarios del sistema
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* DOCTOR */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">
                    Registrar Doctor
                  </h3>
                </div>

                <div className="p-6 space-y-3">
                  {messageDoctor && (
                    <div
                      className={`p-3 rounded-lg text-sm font-medium ${
                        messageDoctor.type === "success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {messageDoctor.text}
                    </div>
                  )}
                  <input
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Nombre"
                    value={doctor.nombre}
                    onChange={(e) =>
                      setDoctor({ ...doctor, nombre: e.target.value })
                    }
                  />

                  <input
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Email"
                    value={doctor.email}
                    onChange={(e) =>
                      setDoctor({ ...doctor, email: e.target.value })
                    }
                  />

                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Password"
                    value={doctor.password}
                    onChange={(e) =>
                      setDoctor({ ...doctor, password: e.target.value })
                    }
                  />

                  <input
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Especialidad"
                    value={doctor.especialidad}
                    onChange={(e) =>
                      setDoctor({ ...doctor, especialidad: e.target.value })
                    }
                  />

                  <input
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Licencia Médica"
                    value={doctor.licencia}
                    onChange={(e) =>
                      setDoctor({ ...doctor, licencia: e.target.value })
                    }
                  />

                  <button
                    onClick={createDoctor}
                    className="w-full bg-[#135bec] text-white py-2 rounded-lg hover:opacity-90"
                  >
                    Crear Doctor
                  </button>
                </div>
              </section>

              {/* PACIENTE */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">
                    Registrar Paciente
                  </h3>
                </div>

                <div className="p-6 space-y-3">
                  {messagePaciente && (
                    <div
                      className={`p-3 rounded-lg text-sm font-medium ${
                        messagePaciente.type === "success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {messagePaciente.text}
                    </div>
                  )}
                  <input
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Nombre"
                    value={paciente.nombre}
                    onChange={(e) =>
                      setPaciente({ ...paciente, nombre: e.target.value })
                    }
                  />

                  <input
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Email"
                    value={paciente.email}
                    onChange={(e) =>
                      setPaciente({ ...paciente, email: e.target.value })
                    }
                  />

                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Password"
                    value={paciente.password}
                    onChange={(e) =>
                      setPaciente({ ...paciente, password: e.target.value })
                    }
                  />

                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    value={paciente.fecha}
                    onChange={(e) =>
                      setPaciente({ ...paciente, fecha: e.target.value })
                    }
                  />

                  <input
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Teléfono"
                    value={paciente.telefono}
                    onChange={(e) =>
                      setPaciente({ ...paciente, telefono: e.target.value })
                    }
                  />

                  <input
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Tipo de Sangre"
                    value={paciente.sangre}
                    onChange={(e) =>
                      setPaciente({ ...paciente, sangre: e.target.value })
                    }
                  />

                  <button
                    onClick={createPaciente}
                    className="w-full bg-[#135bec] text-white py-2 rounded-lg hover:opacity-90"
                  >
                    Crear Paciente
                  </button>
                </div>
              </section>

              {/* ADMIN */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">
                    Registrar Administrador
                  </h3>
                </div>
                {messageAdmin && (
                  <div
                    className={`p-3 rounded-lg text-sm font-medium ${
                      messageAdmin.type === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {messageAdmin.text}
                  </div>
                )}
                <div className="p-6 space-y-3">
                  <input
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Nombre"
                    value={admin.nombre}
                    onChange={(e) =>
                      setAdmin({ ...admin, nombre: e.target.value })
                    }
                  />

                  <input
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Email"
                    value={admin.email}
                    onChange={(e) =>
                      setAdmin({ ...admin, email: e.target.value })
                    }
                  />

                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800"
                    placeholder="Password"
                    value={admin.password}
                    onChange={(e) =>
                      setAdmin({ ...admin, password: e.target.value })
                    }
                  />

                  <button
                    onClick={createAdmin}
                    className="w-full bg-[#135bec] text-white py-2 rounded-lg hover:opacity-90"
                  >
                    Crear Admin
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// COMPONENTES UI
const Input = (props) => (
  <input
    {...props}
    className="w-full mb-2 px-3 py-2 border rounded-lg dark:bg-slate-800"
  />
);

const Btn = ({ children, ...props }) => (
  <button
    {...props}
    className="w-full bg-[#135bec] text-white py-2 rounded-lg mt-2 hover:opacity-90"
  >
    {children}
  </button>
);