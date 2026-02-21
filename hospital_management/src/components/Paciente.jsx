import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 1. IMPORTAR NAVEGACIÓN
import "./index.css";

export default function PatientAppointments() {
  const navigate = useNavigate(); // Inicializar navegación

  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ doctorType: "", date: "", time: "", reason: "" });
  const [receipt, setReceipt] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. OBTENER DATOS REALES DEL USUARIO LOGUEADO
  const [userData, setUserData] = useState({ id: null, nombre: "" });

  useEffect(() => {
    // Cuando el componente carga, sacamos el ID y Nombre del localStorage
    const storedId = localStorage.getItem("userId");
    const storedName = localStorage.getItem("userName");

    if (!storedId) {
      // Si no hay ID (alguien intentó entrar directo por la URL sin loguearse), lo echamos al login
      navigate("/login");
      return;
    }

    setUserData({ id: storedId, nombre: storedName });
    fetchCitas(storedId); // Pasamos el ID real a la función
  }, [navigate]);

  // 3. FUNCIÓN DE LOGOUT
  const handleLogout = () => {
    localStorage.clear(); // Borramos los datos de sesión
    navigate("/login"); // Regresamos al login
  };

  const fetchCitas = async (pacienteId) => {
    try {
      const response = await fetch(`http://localhost:3001/citas/${pacienteId}`);
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
      return alert("Completa los campos obligatorios");
    }

    // 4. MEJORA EN VALIDACIÓN DE FECHAS
    const isDuplicate = appointments.some((a) => {
      // Convertimos la fecha de la DB al formato YYYY-MM-DD para poder compararla con 'date'
      const dbDate = new Date(a.fecha).toISOString().split('T')[0];
      return dbDate === date && a.hora === `${time}:00` && a.estado !== "CANCELADA";
    });

    if (isDuplicate) {
      return alert("Ya tienes una cita agendada en esa fecha y hora exacta.");
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:3001/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: userData.id, // 5. USAMOS EL ID REAL AL GUARDAR
          doctorType,
          date,
          time,
          reason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("¡Cita agendada correctamente!");
        setForm({ doctorType: "", date: "", time: "", reason: "" });
        fetchCitas(userData.id); // Actualizamos la lista
      } else {
        alert(data.message); // Si no hay doctores disponibles, el backend manda un mensaje
      }
    } catch (error) {
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (appointment) => {
    if (!window.confirm("¿Deseas cancelar esta cita?")) return;

    try {
      const response = await fetch(
        `http://localhost:3001/citas/${appointment.id}/cancelar`,
        { method: "PUT" }
      );

      const data = await response.json();

      if (data.success) {
        fetchCitas(userData.id); // Actualizamos usando el ID real

        // 6. FORMATEO DE FECHA PARA EL RECIBO
        const formattedDate = new Date(appointment.fecha).toLocaleDateString();

        setReceipt(
          `CANCELACIÓN CONFIRMADA\nEspecialidad: ${appointment.doctor_tipo}\nFecha: ${formattedDate}\nHora: ${appointment.hora}\nID: #${appointment.id}`
        );
      }
    } catch (error) {
      alert("Error al cancelar la cita");
    }
  };

  return (
    <div className="bg-[#f6f6f8] min-h-screen font-sans text-slate-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#135bec] rounded-lg p-1.5 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">medical_services</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#135bec]">HealthSync</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              {/* 7. MOSTRAMOS EL NOMBRE REAL DEL PACIENTE */}
              <p className="text-sm font-semibold leading-none">{userData.nombre || "Paciente"}</p>
              <p className="text-xs text-slate-500 mt-1">ID: #{userData.id}</p>
            </div>
            {/* 8. BOTÓN LOGOUT ACTIVADO */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-600 hover:text-red-500 font-medium text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-xl">logout</span> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="py-10 px-4 max-w-7xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Panel del Paciente</h1>
          <p className="text-slate-500 mt-2 text-lg">Gestiona tus consultas médicas en tiempo real.</p>
        </div>

        {/* Sección Formulario (Se mantiene igual tu diseño HTML) */}
        <section className="bg-[#135bec]/5 rounded-2xl p-8 border border-[#135bec]/20 shadow-lg">
          <div className="flex flex-col xl:flex-row gap-10">
            <div className="xl:w-1/3">
              <div className="inline-flex p-3 bg-white rounded-xl mb-4 shadow-sm text-[#135bec]">
                <span className="material-symbols-outlined text-3xl">calendar_add_on</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Solicitar Cita</h3>
              <p className="text-slate-600 leading-relaxed">Selecciona la especialidad y el horario que mejor te convenga.</p>
            </div>

            <form onSubmit={handleSubmit} className="xl:w-2/3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/50 p-6 rounded-xl border border-white backdrop-blur-sm">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Especialidad</label>
                  <select
                    className="w-full rounded-lg border-slate-200 py-3 focus:ring-2 focus:ring-[#135bec]/20 outline-none"
                    value={form.doctorType}
                    onChange={(e) => setForm({ ...form, doctorType: e.target.value })}
                    required
                  >
                    <option value="">Seleccione...</option>
                    <option value="Cardiología">Cardiología</option>
                    <option value="Pediatría">Pediatría</option>
                    <option value="Dermatología">Dermatología</option>
                    <option value="Medicina General">Medicina General</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Fecha y Hora</label>
                  <div className="flex gap-2">
                    <input type="date" className="w-full rounded-lg border-slate-200 py-3" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                    <input type="time" className="w-1/2 rounded-lg border-slate-200 py-3" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">Motivo de la visita</label>
                  <textarea
                    className="w-full rounded-lg border-slate-200 py-3 resize-none"
                    rows="3"
                    placeholder="Describe brevemente tus síntomas..."
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-4 bg-[#135bec] text-white font-black rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Procesando..." : "Confirmar Solicitud"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Listado de Citas */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#135bec] p-2 bg-[#135bec]/10 rounded-lg">event_note</span>
            <h2 className="text-2xl font-bold">Mis Citas ({appointments.length})</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Fecha y Hora</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Especialista</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Estado</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          {/* 9. CORRECCIÓN DE FECHA EN LA TABLA */}
                          <span className="font-bold text-slate-900">
                            {new Date(apt.fecha).toLocaleDateString()}
                          </span>
                          <span className="text-sm text-slate-500">
                            {/* Mostramos la hora recortando los segundos de la DB (ej: 14:30:00 -> 14:30) */}
                            {apt.hora.substring(0, 5)}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-slate-700 font-medium">
                          {apt.doctor_tipo}
                        </span>
                      </td>

                      <td className="px-8 py-6">
                        {/* 10. ESTILOS DE ESTADO REPARADOS PARA QUE COINCIDAN CON TU BACKEND EN ESPAÑOL */}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${apt.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                            apt.estado === 'CANCELADA' ? 'bg-red-100 text-red-700' :
                              'bg-green-100 text-green-700'
                          }`}>
                          {apt.estado}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {apt.estado === "PENDIENTE" && (
                          <button
                            onClick={() => handleDelete(apt)}
                            className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-bold transition-all border border-transparent hover:border-red-100"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-8 py-10 text-center text-slate-400">No hay citas registradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Modal de Justificante */}
        {receipt && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">verified</span>
                  Cita Actualizada
                </h3>
                <button onClick={() => setReceipt("")} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <pre className="bg-slate-50 p-4 rounded-lg text-xs font-mono text-slate-600 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {receipt}
              </pre>
              <button onClick={() => setReceipt("")} className="w-full mt-6 py-3 bg-[#135bec] text-white rounded-lg font-bold shadow-lg shadow-blue-200">Entendido</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}