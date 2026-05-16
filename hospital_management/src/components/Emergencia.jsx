import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import LoadingOverlay from "./LoadingOverlay";

const ESPECIALIDADES = ["Cardiología", "Dermatología", "Neurología", "Pediatría", "Medicina General"];

// ── Capas de mapa disponibles ────────────────────────────────────────────────
const TILE_LAYERS = {
  estandar: {
    label: "Estándar",
    icon: "map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  claro: {
    label: "Claro",
    icon: "directions_car",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
  },
  satelite: {
    label: "Satélite",
    icon: "satellite_alt",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "Tiles © Esri — Esri, DeLorme, NAVTEQ",
  },
};

export default function Emergencia() {
  const navigate = useNavigate();

  // ── Estado del formulario principal ─────────────────────────────────────
  const [form, setForm] = useState({ nombre: "", especialidad: "", motivo: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // ── Estado de la sección ambulancia ─────────────────────────────────────
  // "idle" → "map" → "confirmed"
  const [ambuState, setAmbuState] = useState("idle");
  const [ambuGeo, setAmbuGeo] = useState({
    lat: null, lon: null, address: "",
    geoLoading: false, geoError: "",
  });
  const [activeLayer, setActiveLayer] = useState("estandar");

  const ambuMapRef    = useRef(null); // div contenedor
  const ambuLeafRef   = useRef(null); // instancia L.Map
  const ambuMarkerRef = useRef(null); // L.Marker
  const ambuTileRef   = useRef(null); // L.TileLayer activo

  // ── Carga de Leaflet desde CDN ──────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById("leaflet-css")) return;
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    document.head.appendChild(script);
  }, []);

  // ── Reverse geocoding helper (reutilizable) ────────────────────────────
  const reverseGeocode = async (lat, lon) => {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "Accept-Language": "es" } }
      );
      const d = await r.json();
      return d.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  };

  // ── Construir o actualizar el mapa de ambulancia ────────────────────────
  const buildAmbuMap = (lat, lon, layerKey) => {
    const L = window.L;
    if (!L || !ambuMapRef.current) return;

    const key = layerKey || activeLayer;
    const tl  = TILE_LAYERS[key];

    if (!ambuLeafRef.current) {
      ambuLeafRef.current = L.map(ambuMapRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([lat, lon], 16);
    } else {
      ambuLeafRef.current.setView([lat, lon], 16);
    }

    // Tile layer
    if (ambuTileRef.current) {
      ambuLeafRef.current.removeLayer(ambuTileRef.current);
    }
    ambuTileRef.current = L.tileLayer(tl.url, {
      attribution: tl.attr,
      maxZoom: 19,
    }).addTo(ambuLeafRef.current);

    // Marcador pulsante + ARRASTRABLE
    const markerHtml = `
      <div style="position:relative;width:32px;height:32px;cursor:grab">
        <div style="
          position:absolute;inset:-10px;
          border-radius:50%;
          border:2px solid rgba(220,38,38,0.45);
          animation:ambuPing 1.6s cubic-bezier(0,0,0.2,1) infinite
        "></div>
        <div style="
          width:32px;height:32px;
          background:#dc2626;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 3px 12px rgba(220,38,38,0.55)
        "></div>
      </div>`;

    if (ambuMarkerRef.current) {
      ambuMarkerRef.current.setLatLng([lat, lon]);
    } else {
      ambuMarkerRef.current = L.marker([lat, lon], {
        draggable: true,          // ← arrastrable
        autoPan: true,
        icon: L.divIcon({
          className: "",
          html: markerHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      })
        .addTo(ambuLeafRef.current)
        .bindPopup(
          "<b>Tu ubicación</b><br><small style='color:#64748b'>Arrastra para ajustar</small>"
        )
        .openPopup();

      // Al terminar de arrastrar → actualizar coordenadas + re-geocodificar
      ambuMarkerRef.current.on("dragend", async (e) => {
        const { lat: newLat, lng: newLon } = e.target.getLatLng();
        setAmbuGeo(g => ({
          ...g,
          lat: newLat,
          lon: newLon,
          address: "Actualizando dirección…",
        }));
        const addr = await reverseGeocode(newLat, newLon);
        setAmbuGeo(g => ({ ...g, address: addr }));
        ambuMarkerRef.current
          .bindPopup("<b>Ubicación ajustada</b><br><small style='color:#64748b'>Arrastra para corregir</small>")
          .openPopup();
      });
    }
  };

  // Cambiar capa sin destruir el mapa
  const switchLayer = (key) => {
    setActiveLayer(key);
    const L = window.L;
    if (!L || !ambuLeafRef.current) return;
    if (ambuTileRef.current) ambuLeafRef.current.removeLayer(ambuTileRef.current);
    const tl = TILE_LAYERS[key];
    ambuTileRef.current = L.tileLayer(tl.url, {
      attribution: tl.attr, maxZoom: 19,
    }).addTo(ambuLeafRef.current);
  };

  // Cuando se obtienen coordenadas o se abre la vista del mapa, (re)construir
  useEffect(() => {
    if (ambuGeo.lat === null || ambuState !== "map") return;
    const timer = setTimeout(() => {
      if (window.L) {
        buildAmbuMap(ambuGeo.lat, ambuGeo.lon);
      } else {
        const s = document.getElementById("leaflet-js");
        if (s) s.onload = () => buildAmbuMap(ambuGeo.lat, ambuGeo.lon);
      }
    }, 80);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambuGeo.lat, ambuGeo.lon, ambuState]);

  // ── Geolocalización ─────────────────────────────────────────────────────
  const solicitarUbicacion = () => {
    if (!navigator.geolocation) {
      setAmbuGeo(g => ({ ...g, geoError: "Tu navegador no soporta geolocalización." }));
      return;
    }
    setAmbuGeo(g => ({ ...g, geoLoading: true, geoError: "" }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setAmbuGeo(g => ({ ...g, lat, lon, geoLoading: false, address: "Obteniendo dirección…" }));
        const addr = await reverseGeocode(lat, lon);
        setAmbuGeo(g => ({ ...g, address: addr }));
      },
      (err) => {
        const msgs = {
          1: "Permiso denegado. Ve a Configuración del sitio y activa la ubicación.",
          2: "No se pudo determinar tu posición.",
          3: "Se agotó el tiempo. Inténtalo de nuevo.",
        };
        setAmbuGeo(g => ({
          ...g, geoLoading: false,
          geoError: msgs[err.code] || "Error al obtener ubicación.",
        }));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // ── Buscar dirección manualmente ────────────────────────────────────────
  const [searchAddr, setSearchAddr] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const buscarDireccion = async (e) => {
    e.preventDefault();
    if (!searchAddr.trim()) return;
    setSearchLoading(true);
    setAmbuGeo(g => ({ ...g, geoError: "" }));
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddr)}&format=json&limit=1`,
        { headers: { "Accept-Language": "es" } }
      );
      const results = await r.json();
      if (!results.length) {
        setAmbuGeo(g => ({ ...g, geoError: "No se encontró esa dirección. Intenta con más detalle." }));
      } else {
        const { lat, lon, display_name } = results[0];
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);
        setAmbuGeo(g => ({ ...g, lat: newLat, lon: newLon, address: display_name }));
        // Mover mapa + marcador si ya existe
        if (ambuLeafRef.current) {
          ambuLeafRef.current.setView([newLat, newLon], 16);
          if (ambuMarkerRef.current) ambuMarkerRef.current.setLatLng([newLat, newLon]);
        }
      }
    } catch {
      setAmbuGeo(g => ({ ...g, geoError: "Error buscando la dirección. Verifica tu conexión." }));
    } finally {
      setSearchLoading(false);
    }
  };

  const cancelarAmbu = () => {
    if (ambuLeafRef.current) {
      ambuLeafRef.current.remove();
      ambuLeafRef.current = null;
      ambuMarkerRef.current = null;
      ambuTileRef.current = null;
    }
    setAmbuState("idle");
    setAmbuGeo({ lat: null, lon: null, address: "", geoLoading: false, geoError: "" });
    setActiveLayer("estandar");
  };

  const confirmarAmbu = () => {
    if (!ambuGeo.lat) {
      setAmbuGeo(g => ({
        ...g,
        geoError: "Debes compartir tu ubicación primero para que podamos encontrarte.",
      }));
      return;
    }
    setAmbuState("confirmed");
  };

  // ── Submit del formulario principal ─────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim() || !form.especialidad || !form.motivo.trim()) {
      setError("Completa los campos obligatorios.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/emergencia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          especialidad: form.especialidad,
          motivo: form.motivo.trim(),
          email: form.email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.message || "No se pudo registrar la emergencia.");
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-slate-200 bg-white rounded-xl py-3 px-4 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all text-sm outline-none font-medium placeholder:text-slate-400";

  return (
    <div className="auth-scope">
      <LoadingOverlay visible={loading} />

      {/* Animaciones Leaflet + ambulancia */}
      <style>{`
        @keyframes ambuPing {
          0%   { transform: scale(1);   opacity: 1; }
          75%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes ambuBounce {
          0%, 100% { transform: translateY(0);    }
          50%       { transform: translateY(-8px); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .ambu-bounce { animation: ambuBounce 1.2s ease-in-out infinite; }
        .fade-slide  { animation: fadeSlide .35s ease forwards; }
      `}</style>

      <div className="flex min-h-screen w-full font-['Inter',sans-serif]">

        {/* ── PANEL IZQUIERDO ─────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 px-14 py-16 flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="0" width="6" height="24" rx="1.5" fill="white" />
              <rect x="0" y="9" width="24" height="6" rx="1.5" fill="white" />
            </svg>
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-white">MediConnect</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-red-200 animate-pulse inline-block" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-red-100">Línea de Emergencia</span>
            </div>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-500 mb-5">
              Sin cuenta requerida
            </p>
            <h1 className="text-[36px] font-semibold tracking-[-0.025em] text-white leading-[1.1] mb-5">
              Atención inmediata garantizada.
            </h1>
            <p className="text-[14px] text-slate-400 leading-relaxed max-w-xs mb-10">
              No necesitas cuenta. Llena el formulario o solicita una ambulancia con tu ubicación exacta.
            </p>
            <div className="space-y-4">
              {[
                { label: "Completa los datos mínimos" },
                { label: "Se asigna un doctor disponible" },
                { label: "Solicita ambulancia con GPS" },
                { label: "Atención inmediata" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 || i === 1 ? "bg-white" : "bg-slate-600"}`} />
                  <span className="text-[13px] text-slate-400">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              <span className="font-mono text-[11px] tracking-wide">Sin cuenta requerida</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="material-symbols-outlined text-[15px]">bolt</span>
              <span className="font-mono text-[11px] tracking-wide">Asignación instantánea</span>
            </div>
          </div>
        </div>

        {/* ── PANEL DERECHO ───────────────────────────────────────────── */}
        <div className="flex flex-col w-full lg:w-1/2 bg-[#F1F5F9] px-8 sm:px-14 lg:px-12 py-12 relative overflow-y-auto">

          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-red-100 p-2 rounded-xl">
              <span className="material-symbols-outlined text-red-600 text-2xl">emergency</span>
            </div>
            <div>
              <p className="font-black text-slate-900 leading-none">MediConnect</p>
              <p className="text-xs text-red-500 font-bold mt-0.5">Línea de Emergencia</p>
            </div>
          </div>

          {/* Botón volver */}
          <button
            onClick={() => navigate("/login")}
            className="absolute top-6 right-6 font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400 hover:text-slate-900 transition-colors"
          >
            ← Volver al login
          </button>

          <div className="max-w-md w-full mx-auto">

            {/* ════════════════════════════════════════════════════════
                PANTALLA RESULTADO (doctor asignado)
            ════════════════════════════════════════════════════════ */}
            {result ? (
              <div className="fade-slide">
                <div className="text-center mb-8">
                  <div className="relative inline-flex mb-5">
                    <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center border-2 border-white">
                      <span className="material-symbols-outlined text-white text-xs">emergency</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">¡Emergencia Registrada!</h2>
                  <p className="text-slate-500 text-sm">El doctor ya fue notificado y está al tanto de tu caso.</p>
                </div>

                {/* Info doctor */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5">
                  <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400 mb-3">Detalles de la asignación</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-200">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white text-base">stethoscope</span>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400">Doctor Asignado</p>
                        <p className="text-sm font-extrabold text-slate-800">{result.doctorNombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-200">
                      <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white text-base">schedule</span>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400">Hora de Registro</p>
                        <p className="text-sm font-extrabold text-slate-800">
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Código de emergencia */}
                {result.esNuevo && result.codigoEmergencia && (
                  <div className="bg-gradient-to-br from-red-50 to-amber-50 border-2 border-red-200 rounded-2xl p-5 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-red-600 text-base">key</span>
                      <p className="text-xs font-extrabold text-red-700 uppercase tracking-widest">Tu código de acceso</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 my-4">
                      {result.codigoEmergencia.split("").map((d, i) => (
                        <div key={i} className="w-14 h-16 rounded-xl bg-white border-2 border-red-300 flex items-center justify-center shadow-sm">
                          <span className="text-3xl font-black text-red-700 font-mono">{d}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.codigoEmergencia)}
                      className="w-full bg-white border border-red-200 text-red-700 hover:bg-red-50 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors mb-3"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      Copiar código
                    </button>
                    <p className="text-[11px] text-slate-600 leading-relaxed text-center">
                      <span className="font-bold">Guarda este código.</span> Úsalo en el login para volver a entrar.
                      <span className="block mt-1 text-slate-500">Por seguridad solo puede usarse <span className="font-bold">3 veces</span>.</span>
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      localStorage.setItem("userId",   result.pacienteId);
                      localStorage.setItem("userName", result.pacienteNombre || "Paciente");
                      localStorage.setItem("userRole", "paciente");
                      if (result.codigoEmergencia) localStorage.setItem("codigoEmergencia", result.codigoEmergencia);
                      navigate("/paciente");
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-700 text-white py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">login</span>
                    Entrar a mi perfil
                  </button>
                  <button
                    onClick={() => { setResult(null); setForm({ nombre: "", especialidad: "", motivo: "", email: "" }); }}
                    className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 py-3.5 rounded-xl font-semibold text-sm transition-colors"
                  >
                    Registrar otra emergencia
                  </button>
                </div>
              </div>

            ) : (
              /* ════════════════════════════════════════════════════════
                 FORMULARIO + SECCIÓN AMBULANCIA
              ════════════════════════════════════════════════════════ */
              <>
                {/* Título */}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full mb-4">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                    <span className="text-xs font-extrabold text-red-600 uppercase tracking-widest">Emergencia activa</span>
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Solicitar atención</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Un doctor será asignado <span className="font-bold text-slate-700">inmediatamente</span> al enviar.
                  </p>
                </div>

                {/* ── Formulario principal ── */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                      Nombre del Paciente <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">person</span>
                      <input
                        type="text"
                        className="w-full border border-slate-200 bg-white rounded-xl py-3 pl-10 pr-4 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all text-sm outline-none font-medium placeholder:text-slate-400"
                        placeholder='"Juan Pérez" o "No identificado"'
                        value={form.nombre}
                        onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                      Especialidad Requerida <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">medical_services</span>
                      <select
                        className="w-full border border-slate-200 bg-white rounded-xl py-3 pl-10 pr-4 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all text-sm outline-none font-medium appearance-none"
                        value={form.especialidad}
                        onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}
                        required
                      >
                        <option value="">Seleccione especialidad...</option>
                        {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                      Motivo / Síntomas <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={3}
                      placeholder="Describe brevemente el motivo de la emergencia..."
                      value={form.motivo}
                      onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                      ¿Ya tienes cuenta?{" "}
                      <span className="text-slate-400 normal-case font-medium">— Ingresa tu correo (opcional)</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">email</span>
                      <input
                        type="email"
                        className="w-full border border-slate-200 bg-white rounded-xl py-3 pl-10 pr-4 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm outline-none font-medium placeholder:text-slate-400"
                        placeholder="tucorreo@ejemplo.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
                      <span className="material-symbols-outlined text-base">error</span>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined">emergency</span>
                    Solicitar Atención de Emergencia
                  </button>
                </form>

                {/* ══════════════════════════════════════════
                    SECCIÓN AMBULANCIA
                ══════════════════════════════════════════ */}
                <div className="mt-6">

                  {/* ── Estado IDLE: botón de entrada ── */}
                  {ambuState === "idle" && (
                    <div className="fade-slide border-2 border-dashed border-slate-200 hover:border-red-300 rounded-2xl p-6 text-center transition-colors">
                      <div className="mb-3 ambu-bounce select-none flex items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-red-600" style={{ fontSize: "36px", fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                        </div>
                      </div>
                      <p className="font-extrabold text-slate-800 text-base mb-1">¿Necesitas una ambulancia?</p>
                      <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                        Compartiremos tu ubicación GPS exacta para despachar una unidad lo antes posible.
                      </p>
                      <button
                        type="button"
                        onClick={() => setAmbuState("map")}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-red-200 active:scale-[0.97]"
                      >
                        <span className="material-symbols-outlined text-base">local_shipping</span>
                        Pedir Ambulancia
                      </button>
                    </div>
                  )}

                  {/* ── Estado MAP: mapa + confirmación ── */}
                  {ambuState === "map" && (
                    <div className="fade-slide border border-red-200 rounded-2xl overflow-hidden shadow-sm">
                      {/* Header */}
                      <div className="bg-red-600 px-5 py-4 flex items-center gap-3">
                        <span className="material-symbols-outlined text-white text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                        <div className="flex-1">
                          <p className="font-black text-white text-base leading-none">Pedir Ambulancia</p>
                          <p className="text-red-100 text-xs mt-0.5">Compartiremos tu ubicación exacta al despachar la unidad</p>
                        </div>
                        <button
                          type="button"
                          onClick={cancelarAmbu}
                          className="text-red-200 hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                      </div>

                      {/* ── Obtener / mostrar ubicación ── */}
                      <div className="px-5 py-4 bg-white border-b border-red-100 space-y-3">

                        {/* Botón GPS */}
                        <button
                          type="button"
                          onClick={solicitarUbicacion}
                          disabled={ambuGeo.geoLoading}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-red-300 text-red-600 font-bold text-sm hover:bg-red-50 disabled:opacity-60 transition-colors"
                        >
                          {ambuGeo.geoLoading ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity=".25" />
                                <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                              Obteniendo ubicación GPS…
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">my_location</span>
                              {ambuGeo.lat ? "Actualizar con GPS" : "Usar mi ubicación GPS"}
                            </>
                          )}
                        </button>

                        {/* Buscador manual de dirección */}
                        <form onSubmit={buscarDireccion} className="flex gap-2">
                          <input
                            type="text"
                            value={searchAddr}
                            onChange={e => setSearchAddr(e.target.value)}
                            placeholder="O escribe tu dirección…"
                            className="flex-1 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all placeholder:text-slate-400"
                          />
                          <button
                            type="submit"
                            disabled={searchLoading || !searchAddr.trim()}
                            className="px-3 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-50 hover:bg-slate-800 transition-colors shrink-0"
                          >
                            {searchLoading ? (
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity=".25" />
                                <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            ) : (
                              <span className="material-symbols-outlined text-[18px]">search</span>
                            )}
                          </button>
                        </form>

                        {/* Dirección obtenida */}
                        {ambuGeo.lat !== null && ambuGeo.address && ambuGeo.address !== "Obteniendo dirección…" && (
                          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                            <span className="material-symbols-outlined text-emerald-500 text-[17px] shrink-0 mt-0.5">check_circle</span>
                            <p className="text-[12px] text-slate-700 leading-relaxed flex-1">{ambuGeo.address}</p>
                          </div>
                        )}

                        {/* Error */}
                        {ambuGeo.geoError && (
                          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                            <span className="material-symbols-outlined text-red-500 text-[16px] shrink-0 mt-0.5">error</span>
                            <p className="text-[12px] text-red-600 font-medium leading-relaxed">{ambuGeo.geoError}</p>
                          </div>
                        )}
                      </div>

                      {/* Mapa con selector de capas */}
                      {ambuGeo.lat !== null && (
                        <div>
                          {/* Selector de capas */}
                          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                            <span className="material-symbols-outlined text-slate-400 text-[16px]">layers</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Capa</span>
                            {Object.entries(TILE_LAYERS).map(([key, tl]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => switchLayer(key)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                                  activeLayer === key
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[13px]">{tl.icon}</span>
                                {tl.label}
                              </button>
                            ))}
                          </div>

                          {/* Contenedor del mapa */}
                          <div
                            ref={ambuMapRef}
                            style={{ height: "260px", width: "100%", zIndex: 0 }}
                          />
                          {/* Hint arrastrar */}
                          <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-t border-slate-100">
                            <span className="material-symbols-outlined text-slate-400 text-[14px]">open_with</span>
                            <p className="text-[11px] text-slate-400 font-medium">
                              ¿Ubicación incorrecta? <span className="text-slate-600 font-semibold">Arrastra el marcador rojo</span> para ajustar el punto exacto
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="px-5 py-4 bg-white flex gap-3">
                        <button
                          type="button"
                          onClick={cancelarAmbu}
                          className="flex-1 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={confirmarAmbu}
                          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-red-200 active:scale-[0.97]"
                        >
                          <span className="material-symbols-outlined text-base">local_shipping</span>
                          Confirmar — Enviar Ambulancia
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Estado CONFIRMED: ambulancia en camino ── */}
                  {ambuState === "confirmed" && (
                    <div className="fade-slide border-2 border-emerald-200 rounded-2xl overflow-hidden shadow-sm bg-gradient-to-b from-emerald-50 to-white">
                      {/* Header */}
                      <div className="bg-emerald-500 px-5 py-5 text-center">
                        <div className="ambu-bounce mb-3 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "38px", fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-black text-white leading-none">Ambulancia en Camino</h3>
                        <p className="text-emerald-100 text-xs mt-1.5 font-semibold">
                          Una unidad fue despachada a tu ubicación
                        </p>
                      </div>

                      {/* Pasos de estado */}
                      <div className="px-5 pt-5 pb-4 space-y-3">
                        {[
                          { done: true,  icon: "check_circle",   color: "text-emerald-500", label: "Solicitud recibida",             sub: "Sistema confirmado" },
                          { done: true,  icon: "local_shipping",  color: "text-emerald-500", label: "Unidad despachada",              sub: "En ruta hacia ti" },
                          { done: false, icon: "schedule",        color: "text-amber-500",   label: "Tiempo estimado: 8 – 12 min",   sub: "Según tráfico actual" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 border border-slate-100">
                            <span className={`material-symbols-outlined text-[22px] shrink-0 ${item.color}`}
                              style={item.done ? { fontVariationSettings: "'FILL' 1" } : {}}>
                              {item.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-slate-800 leading-none">{item.label}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
                            </div>
                          </div>
                        ))}

                        {/* Dirección */}
                        {ambuGeo.address && (
                          <div className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 border border-slate-100">
                            <span className="material-symbols-outlined text-red-500 text-[20px] shrink-0">location_on</span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Dirección confirmada</p>
                              <p className="text-[12px] text-slate-600 leading-relaxed">{ambuGeo.address}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Nota + botón */}
                      <div className="px-5 pb-5">
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                          <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0 mt-0.5">info</span>
                          <p className="text-[12px] text-amber-700 font-medium leading-relaxed">
                            Mantén tu teléfono disponible. El conductor puede contactarte al llegar cerca.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={cancelarAmbu}
                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-colors"
                        >
                          Entendido
                        </button>
                      </div>
                    </div>
                  )}

                </div>
                {/* fin sección ambulancia */}

              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
