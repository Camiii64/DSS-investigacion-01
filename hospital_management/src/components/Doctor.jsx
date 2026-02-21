import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 1. IMPORTAMOS NAVEGACIÓN

export default function DoctorPanel() {
  const navigate = useNavigate(); // 2. INICIALIZAR NAVEGACIÓN

  const [appointments, setAppointments] = useState([]);
  const [responses, setResponses] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const DOCTOR_ID = localStorage.getItem("userId");
  const DOCTOR_NAME = localStorage.getItem("userName");

  useEffect(() => {
    // 3. PROTECCIÓN DE RUTA
    if (!DOCTOR_ID) {
      navigate("/login");
      return;
    }
    fetchAppointments();
  }, [DOCTOR_ID, navigate]);

  // 4. FUNCIÓN PARA CERRAR SESIÓN
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- CARGAR DATOS REALES DE LA DB ---
  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        `https://api-mediconnect-2026-agh0gyhbdkh4achy.canadacentral-01.azurewebsites.net/doctor/${DOCTOR_ID}/citas`
      );
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error al cargar citas:", error);
    }
  };

  // --- LÓGICA DE NEGOCIO CONECTADA ---
  const handleAccept = async (id) => {
    const note = responses[id] || "";

    try {
      const response = await fetch(
        `https://api-mediconnect-2026-agh0gyhbdkh4achy.canadacentral-01.azurewebsites.net/citas/${id}/responder`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            estado: "ACEPTADA",
            respuesta_doctor: note,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        fetchAppointments();
      }
    } catch (error) {
      alert("Error al aceptar la cita");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("¿Deseas rechazar esta cita?")) return;

    try {
      const response = await fetch(
        `https://api-mediconnect-2026-agh0gyhbdkh4achy.canadacentral-01.azurewebsites.net/citas/${id}/responder`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            estado: "CANCELADA", // 5. CORREGIDO: Usamos "CANCELADA" para coincidir con la DB y el Paciente
            respuesta_doctor: responses[id] || "El doctor ha cancelado esta cita.",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        fetchAppointments();
      }
    } catch (error) {
      alert("Error al rechazar");
    }
  };

  // Filtrado de listas
  const pendingApps = appointments.filter(
    (app) => app.estado === "PENDIENTE"
  );

  const acceptedApps = appointments.filter(
    (app) =>
      app.estado === "ACEPTADA" &&
      app.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtramos las canceladas solo para las estadísticas
  const canceledApps = appointments.filter(
    (app) => app.estado === "CANCELADA"
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.containerFlex}>
          <div style={s.logoGroup}>
            <div style={s.iconBox}>H</div>
            <div>
              <h1 style={s.logoTitle}>MediControl</h1>
              <p style={s.logoSub}>HOSPITAL SYSTEM</p>
            </div>
          </div>
          <div style={s.userGroup}>
            <div style={{ textAlign: "right" }}>
              <p style={s.userName}>{DOCTOR_NAME || "Doctor"}</p>
              {/* 6. AÑADIMOS BOTÓN DE LOGOUT (Como texto pequeño debajo del nombre) */}
              <button
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', padding: 0, marginTop: '2px', fontWeight: 'bold' }}
              >
                Cerrar Sesión
              </button>
            </div>
            <div style={s.avatar}>
              {DOCTOR_NAME ? DOCTOR_NAME.substring(0, 2).toUpperCase() : "DR"}
            </div>
          </div>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.hero}>
          <h2 style={s.heroTitle}>Gestión de Citas Real</h2>
          <p style={s.heroSub}>
            Tienes {pendingApps.length} solicitudes de pacientes esperando.
          </p>
        </div>

        <div style={s.grid}>
          {/* Columna Izquierda */}
          <section style={s.column}>
            <h3 style={s.sectionTitle}>
              Solicitudes Nuevas{" "}
              <span style={s.badge}>{pendingApps.length}</span>
            </h3>

            {pendingApps.length === 0 && (
              <p style={s.emptyMsg}>No hay solicitudes pendientes.</p>
            )}

            {pendingApps.map((app) => (
              <div key={app.id} style={s.card}>
                <div style={s.cardHeader}>
                  <span style={s.patientName}>{app.patientName}</span>
                  <span style={s.statusTag}>REVISAR</span>
                </div>

                <div style={s.dateTimeBox}>
                  <div>
                    <small style={s.label}>FECHA</small>
                    <br />
                    {new Date(app.fecha_solicitada).toLocaleString()}
                  </div>
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <small style={s.label}>MOTIVO DEL PACIENTE:</small>
                  <p style={{ fontSize: "13px", margin: "4px 0" }}>
                    {app.motivo}
                  </p>
                </div>

                <textarea
                  style={s.textarea}
                  placeholder="Escribe el diagnóstico o indicaciones aquí..."
                  value={responses[app.id] || ""}
                  onChange={(e) =>
                    setResponses({
                      ...responses,
                      [app.id]: e.target.value,
                    })
                  }
                />

                <div style={s.btnGroup}>
                  <button
                    onClick={() => handleAccept(app.id)}
                    style={s.btnAccept}
                  >
                    Aceptar Cita
                  </button>
                  <button
                    onClick={() => handleReject(app.id)}
                    style={s.btnCancel}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </section>

          {/* Columna Derecha */}
          <section style={s.column}>
            <div style={s.sectionHeaderRow}>
              <h3 style={s.sectionTitle}>
                Agenda Confirmada{" "}
                <span style={s.badgeGray}>{acceptedApps.length}</span>
              </h3>
              <input
                style={s.searchInput}
                placeholder="Buscar paciente..."
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={s.tableContainer}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>PACIENTE</th>
                    <th style={s.th}>FECHA</th>
                    <th style={s.th}>DIAGNÓSTICO/NOTA</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptedApps.map((app) => (
                    <tr key={app.id} style={s.tr}>
                      <td style={s.td}>
                        <strong>{app.patientName}</strong>
                      </td>
                      <td style={s.td}>
                        {new Date(app.fecha_solicitada).toLocaleString()}
                      </td>
                      <td style={s.td}>
                        <span style={s.noteText}>
                          {app.respuesta_doctor || "Sin nota médica"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {acceptedApps.length === 0 && (
                    <tr style={s.tr}>
                      <td colSpan="3" style={{ ...s.td, textAlign: 'center', color: '#4c669a' }}>
                        No hay citas confirmadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 7. ESTADÍSTICAS CORREGIDAS */}
            <div style={s.statsGrid}>
              <div style={s.statCard}>
                <p style={s.statLabel}>CONFIRMADAS</p>
                <p style={{ ...s.statVal, color: "#10b981" }}>{acceptedApps.length}</p>
              </div>
              <div style={s.statCard}>
                <p style={s.statLabel}>PENDIENTES</p>
                <p style={{ ...s.statVal, color: "#ea580c" }}>{pendingApps.length}</p>
              </div>
              <div style={s.statCard}>
                <p style={s.statLabel}>RECHAZADAS</p>
                <p style={{ ...s.statVal, color: "#ef4444" }}>{canceledApps.length}</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ESTILOS (Mantenidos exactamente iguales, sin tocar Tailwind)
const s = {
  page: { backgroundColor: '#f6f6f8', minHeight: '100vh', fontFamily: 'sans-serif', color: '#0d121b' },
  header: { backgroundColor: '#fff', borderBottom: '1px solid #e7ebf3', padding: '12px 60px' },
  containerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' },
  logoGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
  iconBox: { backgroundColor: '#135bec', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold' },
  logoTitle: { fontSize: '18px', margin: 0 },
  logoSub: { fontSize: '10px', color: '#4c669a', margin: 0, letterSpacing: '1px' },
  userGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
  userName: { fontSize: '14px', fontWeight: 'bold', margin: 0 },
  userSpec: { fontSize: '11px', color: '#4c669a', margin: 0 },
  avatar: { backgroundColor: '#135bec', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '40px 60px' },
  hero: { marginBottom: '32px' },
  heroTitle: { fontSize: '28px', fontWeight: '900', margin: 0 },
  heroSub: { color: '#4c669a', marginTop: '4px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px' },
  column: {}, // Añadido para evitar error si estaba vacío
  sectionTitle: { fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }, // Añadido marginBottom
  badge: { backgroundColor: '#135bec20', color: '#135bec', fontSize: '12px', padding: '2px 8px', borderRadius: '12px' },
  badgeGray: { backgroundColor: '#e7ebf3', color: '#4c669a', fontSize: '12px', padding: '2px 8px', borderRadius: '12px' },
  card: { backgroundColor: '#fff', border: '1px solid #e7ebf3', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px' },
  patientName: { fontWeight: 'bold' },
  statusTag: { fontSize: '10px', fontWeight: 'bold', color: '#ea580c', backgroundColor: '#fff7ed', padding: '2px 8px', borderRadius: '4px' },
  dateTimeBox: { display: 'flex', gap: '20px', borderTop: '1px dashed #cfd7e7', borderBottom: '1px dashed #cfd7e7', padding: '12px 0', marginBottom: '16px', fontSize: '14px' },
  label: { color: '#4c669a', fontSize: '10px', fontWeight: 'bold' },
  textarea: { width: '100%', border: '1px solid #cfd7e7', borderRadius: '8px', padding: '8px', fontSize: '13px', backgroundColor: '#f8f9fc', marginBottom: '12px', boxSizing: 'border-box' },
  btnGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  btnAccept: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  btnCancel: { backgroundColor: '#ef444410', color: '#ef4444', border: '1px solid #ef444420', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  sectionHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  searchInput: { padding: '6px 12px', borderRadius: '8px', border: '1px solid #cfd7e7', fontSize: '14px', outline: 'none' },
  tableContainer: { backgroundColor: '#fff', border: '1px solid #e7ebf3', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thead: { backgroundColor: '#f8f9fc', borderBottom: '1px solid #e7ebf3' },
  th: { padding: '12px 16px', fontSize: '10px', color: '#4c669a' },
  td: { padding: '16px', fontSize: '14px' },
  tr: { borderBottom: '1px solid #e7ebf3' },
  noteText: { fontStyle: 'italic', color: '#4c669a', fontSize: '12px', backgroundColor: '#f0f4ff', padding: '4px 8px', borderRadius: '4px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  statCard: { backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e7ebf3', textAlign: 'center' }, // Añadido textAlign
  statLabel: { fontSize: '10px', fontWeight: 'bold', color: '#4c669a', margin: '0 0 4px 0' },
  statVal: { fontSize: '24px', fontWeight: '900', margin: 0 },
  emptyMsg: { color: '#4c669a', fontSize: '14px', fontStyle: 'italic' }
};