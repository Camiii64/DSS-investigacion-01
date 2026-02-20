import { useState, useEffect } from "react";
import "./index.css";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ doctorType: "", date: "", time: "", reason: "" });
  const [receipt, setReceipt] = useState("");
  const [loading, setLoading] = useState(false);

  const PACIENTE_ID = 1;

  useEffect(() => {
    fetchCitas();
  }, []);

  const fetchCitas = async () => {
    try {
      const response = await fetch(`http://localhost:3001/citas/${PACIENTE_ID}`);
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

    if (
      appointments.some(
        (a) =>
          a.fecha === date &&
          a.hora === `${time}:00` &&
          a.estado !== "CANCELADA"
      )
    ) {
      return alert("Ya tienes una cita en esa fecha y hora.");
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:3001/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: PACIENTE_ID,
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
        fetchCitas();
      } else {
        alert(data.message);
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
        fetchCitas();

        setReceipt(
          `CANCELACIÓN CONFIRMADA\nEspecialidad: ${appointment.doctor_tipo}\nFecha: ${appointment.fecha}\nHora: ${appointment.hora}\nID: #${appointment.id}`
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
              <p className="text-sm font-semibold leading-none">Paciente Usuario</p>
              <p className="text-xs text-slate-500 mt-1">ID: #{PACIENTE_ID}</p>
            </div>
            <button className="flex items-center gap-2 text-slate-600 hover:text-red-500 font-medium text-sm transition-colors">
              <span className="material-symbols-outlined text-xl">logout</span> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="py-10 px-4 max-w-7xl mx-auto space-y-10">
        {/* Título */}
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Panel del Paciente</h1>
          <p className="text-slate-500 mt-2 text-lg">Gestiona tus consultas médicas en tiempo real.</p>
        </div>

        {/* Sección Formulario */}
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
                          <span className="font-bold text-slate-900">
                            {new Date(apt.fecha_solicitada).toLocaleDateString()}
                          </span>
                          <span className="text-sm text-slate-500">
                            {new Date(apt.fecha_solicitada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {apt.estado === "ACEPTADA" && (
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-sm font-medium">
                            {apt.nombre_doctor}
                          </span>
                        )}

                        {apt.estado === "PENDIENTE" && (
                          <span className="text-amber-500 text-sm italic">
                            Esperando aceptación
                          </span>
                        )}

                        {apt.estado === "CANCELADA" && (
                          <span className="text-red-400 text-sm italic">
                            Cita cancelada
                          </span>
                        )}
                      </td>

                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${apt.estado === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          apt.estado === 'CANCELED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                          {apt.estado}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {apt.estado === "ACEPTADA" && apt.respuesta_doctor && (
                          <div className="text-sm text-slate-600 max-w-xs text-right">
                            {apt.respuesta_doctor}
                          </div>
                        )}

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
                      <td colSpan="4" className="px-8 py-10 text-center text-slate-400">No hay citas registradas en la base de datos.</td>
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