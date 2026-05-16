import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logoImg from "../assets/Gemini_Generated_Image_uup011uup011uup0.png";

// ─── Atomic UI bits ─────────────────────────────────────────────────────────
const MediCross = ({ size = 18, className = "", color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="9.5" y="3" width="5" height="18" rx="1.2" fill={color} />
    <rect x="3" y="9.5" width="18" height="5" rx="1.2" fill={color} />
  </svg>
);

const Logo = ({ light = false }) => (
  <Link to="/" className="flex items-center gap-2.5 group" aria-label="MediConnect">
    <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-600 text-white shadow-sm">
      <MediCross size={16} color="#fff" />
    </span>
    <span className={`text-[18px] font-bold tracking-[-0.02em] ${light ? "text-white" : "text-slate-900"}`}>
      Medi<span className="text-red-600">Connect</span>
    </span>
  </Link>
);

const ArrowRight = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpRight = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Check = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Dot = ({ className = "" }) => (
  <span className={`inline-block w-1.5 h-1.5 rounded-full ${className}`}></span>
);

const ImagePlaceholder = ({ label = "FOTO", className = "", variant = "light", aspect = "aspect-[4/5]", rounded = "rounded-2xl" }) => {
  const bg = variant === "dark" ? "bg-slate-800 ph-stripe-dark" : variant === "red" ? "bg-red-50 ph-stripe-red" : "bg-slate-100 ph-stripe";
  const fg = variant === "dark" ? "text-slate-300" : variant === "red" ? "text-red-700" : "text-slate-500";
  const border = variant === "dark" ? "border-slate-700" : variant === "red" ? "border-red-200" : "border-slate-200";
  return (
    <div className={`${aspect} ${bg} ${rounded} border ${border} relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-mono text-[10px] tracking-[0.18em] ${fg}`}>[ {label} ]</span>
      </div>
    </div>
  );
};

// Botón pill — usa Link si la ruta es interna, <a> si es ancla
const Btn = ({ children, variant = "primary", to, href, className = "", icon = true, onClick }) => {
  const base = "inline-flex items-center gap-2 rounded-full font-semibold text-[14px] tracking-tight transition-all duration-200 select-none whitespace-nowrap";
  const map = {
    primary: "bg-red-600 text-white px-5 py-3 hover:bg-red-700 shadow-[0_6px_16px_-6px_rgba(220,38,38,0.55)] hover:shadow-[0_10px_24px_-8px_rgba(220,38,38,0.65)]",
    dark: "bg-slate-900 text-white px-5 py-3 hover:bg-slate-800",
    ghost: "bg-white text-slate-900 px-5 py-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    ghostDark: "bg-white/10 text-white px-5 py-3 border border-white/15 hover:bg-white/15 backdrop-blur",
    link: "text-slate-900 px-1 py-2 hover:text-red-600",
    emerg: "bg-red-600 text-white px-5 py-3 hover:bg-red-700",
  };
  const content = (
    <>
      <span>{children}</span>
      {icon && <ArrowRight size={14} />}
    </>
  );
  if (to) {
    return (
      <Link to={to} onClick={onClick} className={`${base} ${map[variant]} ${className}`}>
        {content}
      </Link>
    );
  }
  return (
    <a href={href || "#"} onClick={onClick} className={`${base} ${map[variant]} ${className}`}>
      {content}
    </a>
  );
};

const Eyebrow = ({ children, color = "slate" }) => {
  const map = {
    slate: "text-slate-500",
    red: "text-red-600",
    teal: "text-teal-600",
    light: "text-slate-300",
  };
  return (
    <div className={`font-mono text-[11px] tracking-[0.22em] uppercase ${map[color]} flex items-center gap-2`}>
      <span className={`inline-block w-5 h-px ${color === "light" ? "bg-slate-500" : "bg-current"} opacity-60`}></span>
      <span>{children}</span>
    </div>
  );
};

const StatusBadge = ({ kind, children }) => {
  const map = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-orange-100 text-orange-700 border-orange-200",
    canceled: "bg-red-50 text-red-700 border-red-200",
    emergency: "bg-red-600 text-white border-red-600",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${map[kind]}`}>
      <Dot className={kind === "emergency" ? "bg-white" : "bg-current"} />
      {children}
    </span>
  );
};

const Stat = ({ value, label, hint, light = false }) => (
  <div className="flex flex-col">
    <div className={`text-[44px] leading-none font-bold tracking-[-0.03em] ${light ? "text-white" : "text-slate-900"}`}>
      {value}
    </div>
    {hint && <div className={`mt-2 font-mono text-[10px] tracking-[0.18em] uppercase ${light ? "text-slate-400" : "text-slate-400"}`}>{hint}</div>}
    <div className={`mt-1 text-[13px] ${light ? "text-slate-300" : "text-slate-600"} max-w-[180px] text-pretty`}>{label}</div>
  </div>
);

// ─── TopBar ─────────────────────────────────────────────────────────────────
function TopBar() {
  return (
    <div className="bg-slate-900 text-slate-300 text-[12px]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-9 flex items-center justify-between">
        <div className="hidden md:flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            <span className="font-mono tracking-wider text-slate-400">PLATAFORMA EN LÍNEA</span>
          </span>
          <span className="text-slate-500">·</span>
          <span className="flex items-center gap-2">
            <span className="text-slate-500">Gestión de citas digital</span>
          </span>
        </div>
        <div className="flex items-center gap-5 ml-auto">
          <a href="#emergencia" className="hover:text-white transition-colors">Emergencia</a>
          <span className="text-slate-700">·</span>
          <Link to="/login" className="hover:text-white transition-colors">Acceso profesionales</Link>
        </div>
      </div>
    </div>
  );
}

// ─── Nav ────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`sticky top-0 z-40 bg-white/85 backdrop-blur-xl transition-all ${scrolled ? "border-b border-slate-200" : "border-b border-transparent"}`}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-[72px] flex items-center justify-between">
        <Logo />
        <div className="hidden lg:flex items-center gap-9 text-[14px] font-medium text-slate-700">
          <a href="#servicios" className="hover:text-slate-900">Especialidades</a>
          <a href="#como-funciona" className="hover:text-slate-900">Cómo funciona</a>
          <a href="#emergencia" className="hover:text-slate-900 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
            Emergencia
          </a>
          <a href="#por-que" className="hover:text-slate-900">Por qué elegirnos</a>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex text-[14px] font-semibold text-slate-700 px-4 py-2.5 hover:text-slate-900">
            Iniciar sesión
          </Link>
          <Btn to="/register" variant="dark" icon={true} className="!py-2.5">Registrarse</Btn>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────
function Hero({ showForm }) {
  return (
    <section id="top" className="relative bg-slate-50 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: "linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)", backgroundSize: "48px 48px" }}
      ></div>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-12 lg:pt-20 pb-20 relative">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2.5 bg-white border border-slate-200 rounded-full pl-2 pr-4 py-1.5 mb-8 shadow-sm">
              <span className="bg-red-50 text-red-700 text-[10px] font-bold tracking-wider font-mono px-2 py-0.5 rounded-full">NUEVO</span>
              <span className="text-[13px] text-slate-700">Citas en línea + Emergencia inmediata sin registro</span>
            </div>

            <h1 className="text-[56px] lg:text-[88px] leading-[0.95] font-bold tracking-[-0.035em] text-slate-900 text-balance">
              Tu salud, <br className="hidden lg:block" />
              <span className="relative inline-block">
                conectada
                <svg className="absolute -bottom-2 left-0 w-full" height="14" viewBox="0 0 300 14" fill="none" preserveAspectRatio="none">
                  <path d="M2 8 C 60 2, 140 12, 298 6" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
              </span>
              <span className="text-slate-400">.</span>
            </h1>

            <p className="mt-7 text-[18px] lg:text-[19px] text-slate-600 leading-relaxed max-w-[540px] text-pretty">
              MediConnect es una plataforma para pedir, gestionar y dar seguimiento a citas médicas en minutos —
              y atender emergencias sin necesidad de registro previo.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Btn to="/register" variant="primary">Pedir una cita</Btn>
              <Btn to="/login" variant="ghost" icon={false}>Iniciar sesión</Btn>
              <a href="#emergencia" className="ml-1 inline-flex items-center gap-2 text-[14px] font-semibold text-slate-900 hover:text-red-600 group">
                <span className="relative flex w-2.5 h-2.5">
                  <span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-60"></span>
                  <span className="relative w-2.5 h-2.5 rounded-full bg-red-600"></span>
                </span>
                Emergencia inmediata
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] text-slate-500">
              <span className="flex items-center gap-2"><Check size={14} className="text-emerald-600" /> Contraseñas cifradas (bcrypt)</span>
              <span className="flex items-center gap-2"><Check size={14} className="text-emerald-600" /> Acceso por roles</span>
              <span className="flex items-center gap-2"><Check size={14} className="text-emerald-600" /> Desplegado en Microsoft Azure</span>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-slate-700 to-teal-500 rounded-[40px] opacity-90"></div>
              <div className="relative">
                <div className="aspect-[4/5] rounded-[32px] bg-white overflow-hidden flex items-center justify-center">
                  <img
                    src={logoImg}
                    alt="MediConnect"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              </div>

              <div className="absolute -right-3 lg:-right-10 bottom-10 bg-slate-900 text-white rounded-2xl shadow-[0_20px_50px_-20px_rgba(15,23,42,0.45)] p-4 w-[240px]">
                <div className="flex items-center gap-2">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-70"></span>
                    <span className="relative w-2 h-2 rounded-full bg-red-500"></span>
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.18em] text-red-400 uppercase">Emergencia · activa</span>
                </div>
                <div className="mt-2 text-[13px] text-slate-300 leading-relaxed">
                  Cuenta temporal generada y doctor <span className="text-white font-semibold">asignado</span> automáticamente.
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">ESTADO</span>
                  <span className="text-white">ACEPTADA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="relative -mb-24 mt-16 lg:mt-20 bg-white border border-slate-200 rounded-2xl shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)] p-3">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              <FormField label="Especialidad" value="Cardiología" hint="12 disponibles" />
              <FormField label="Fecha" value="Lun 12 May" hint="próxima libre" />
              <FormField label="Hora" value="10:30" hint="franja AM" />
              <FormField label="Prioridad" value="Normal" hint="estándar" />
              <div className="col-span-2 lg:col-span-1 flex items-stretch">
                <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold px-5 transition-colors py-3">
                  Solicitar
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FormField({ label, value, hint }) {
  return (
    <div className="px-4 py-3 border-r border-slate-100 last:border-r-0 lg:hover:bg-slate-50/60 rounded-xl transition-colors">
      <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-slate-400">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[15px] font-semibold text-slate-900">{value}</span>
        <ArrowRight size={12} className="text-slate-300" />
      </div>
      <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>
    </div>
  );
}

// ─── Specialties Marquee ────────────────────────────────────────────────────
const SPECIALTIES = [
  { code: "01", name: "Cardiología" },
  { code: "02", name: "Pediatría" },
  { code: "03", name: "Medicina General" },
  { code: "04", name: "Ginecología" },
  { code: "05", name: "Neurología" },
  { code: "06", name: "Dermatología" },
  { code: "07", name: "Ortopedia" },
  { code: "08", name: "Oftalmología" },
  { code: "09", name: "Psiquiatría" },
  { code: "10", name: "Endocrinología" },
  { code: "11", name: "Urología" },
  { code: "12", name: "Oncología" },
];

function SpecialtiesMarquee({ speed = "normal" }) {
  const items = [...SPECIALTIES, ...SPECIALTIES];
  return (
    <div className="bg-slate-900 border-y border-slate-800 overflow-hidden">
      <div className="py-7 relative flex items-center">
        <div className={`flex items-center marquee-track ${speed === "fast" ? "fast" : ""}`} style={{ width: "max-content" }}>
          {items.map((s, i) => (
            <div key={i} className="flex items-center gap-5 px-9">
              <span className="font-mono text-[13px] tracking-[0.22em] text-slate-500">{s.code}</span>
              <span className="text-white text-[24px] font-semibold tracking-tight">{s.name}</span>
              <MediCross size={15} color="#DC2626" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── About / Stats ──────────────────────────────────────────────────────────
function About() {
  return (
    <section id="servicios" className="bg-slate-50 py-24 lg:py-32">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-5">
            <Eyebrow>Sobre el hospital</Eyebrow>
            <h2 className="mt-4 text-[44px] lg:text-[60px] leading-[1.0] font-bold tracking-[-0.03em] text-slate-900 text-balance">
              Atención médica<br />
              <span className="text-slate-400">sin fricción,</span><br />
              centrada en ti.
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="text-[17px] text-slate-600 leading-relaxed text-pretty">
              MediConnect digitaliza el proceso completo de atención: pides tu cita,
              el doctor de la especialidad la recibe ordenada por prioridad y te responde
              dentro de la misma plataforma. Sin filas ni llamadas.
            </p>
            <ul className="mt-7 space-y-3 text-[15px] text-slate-700">
              {[
                "Especialidades configurables por el administrador",
                "Citas ordenadas por prioridad: Emergencia → Normal",
                "Respuesta del doctor visible al paciente al instante",
                "Módulo de emergencia público — sin registro previo",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Check size={12} />
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Btn href="#como-funciona" variant="dark">Ver cómo funciona</Btn>
            </div>
          </div>
        </div>

        <div className="mt-20 lg:mt-28 grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 border-t border-slate-200 pt-12">
          <Stat value="3" label="roles diferenciados: Paciente, Doctor y Administrador" hint="ROLES" />
          <Stat value="100%" label="del flujo de citas en línea, sin papel ni llamadas" hint="DIGITAL" />
          <Stat value="0" label="registros requeridos para iniciar una emergencia" hint="EMERGENCIA" />
          <Stat value="24/7" label="disponibilidad como aplicación web" hint="DISPONIBILIDAD" />
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ───────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "01", title: "Regístrate", body: "Crea tu cuenta con tus datos personales: nombre, teléfono, tipo de sangre y fecha de nacimiento. Toma menos de un minuto.", mock: <MockRegister /> },
    { n: "02", title: "Pide tu cita", body: "Elige especialidad, fecha y hora. El sistema asigna un doctor disponible y registra la prioridad correspondiente.", mock: <MockBooking /> },
    { n: "03", title: "El doctor te atiende", body: "Recibe la respuesta del médico (aceptada o rechazada) con un mensaje, y cancela la cita en cualquier momento si la necesitas.", mock: <MockDoctor /> },
  ];
  return (
    <section id="como-funciona" className="bg-white py-24 lg:py-32 border-t border-slate-100">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <Eyebrow>Cómo funciona</Eyebrow>
            <h2 className="mt-4 text-[44px] lg:text-[60px] leading-[1.0] font-bold tracking-[-0.03em] text-slate-900 text-balance">
              Tres pasos. <span className="text-slate-400">Cero filas.</span>
            </h2>
          </div>
          <p className="text-[15px] text-slate-500 max-w-md">
            Desde que pides tu cita hasta que tu médico te confirma, todo ocurre dentro de la plataforma.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 card-hover">
              <div className="flex items-baseline justify-between mb-6">
                <span className="font-mono text-[11px] tracking-[0.22em] text-red-600">PASO {s.n}</span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-slate-400">0{i + 1}/03</span>
              </div>
              <div className="rounded-2xl overflow-hidden bg-white border border-slate-200">
                {s.mock}
              </div>
              <h3 className="mt-7 text-[22px] font-bold text-slate-900 tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[14px] text-slate-600 leading-relaxed text-pretty">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MockRegister() {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[9px] tracking-[0.2em] text-slate-400">REGISTRO · PACIENTE</span>
        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Conexión segura
        </span>
      </div>
      <div className="space-y-2">
        {[
          ["Nombre completo", "María Fernanda López"],
          ["Teléfono", "+57 320 555 0142"],
          ["Tipo de sangre", "O+"],
          ["Fecha de nacimiento", "14 / 03 / 1993"],
        ].map(([k, v], i) => (
          <div key={i} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
            <div className="font-mono text-[8px] tracking-[0.18em] uppercase text-slate-400">{k}</div>
            <div className="text-[13px] text-slate-900 font-medium">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-red-600 hover:bg-red-700 text-white text-center text-[13px] font-semibold py-2.5 rounded-lg">
        Crear cuenta
      </div>
    </div>
  );
}

function MockBooking() {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[9px] tracking-[0.2em] text-slate-400">SOLICITAR CITA</span>
        <span className="font-mono text-[9px] text-slate-400">12 MAY</span>
      </div>
      <div className="space-y-2">
        <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
          <div className="font-mono text-[8px] tracking-[0.18em] uppercase text-slate-400">Especialidad</div>
          <div className="text-[13px] text-slate-900 font-medium">Cardiología</div>
        </div>
        <div className="grid grid-cols-7 gap-1 my-2">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <div key={i} className="text-center">
              <div className="font-mono text-[8px] text-slate-400 mb-1">{d}</div>
              <div className={`text-[11px] py-1.5 rounded ${i === 0 ? "bg-red-600 text-white font-bold" : "bg-slate-50 text-slate-700"}`}>
                {12 + i}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {["09:00", "10:30", "11:15"].map((t, i) => (
            <div key={i} className={`text-center text-[11px] py-1.5 rounded-md font-mono ${i === 1 ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 border border-slate-100"}`}>
              {t}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
        <span>Prioridad:</span>
        <StatusBadge kind="pending">Normal</StatusBadge>
      </div>
    </div>
  );
}

function MockDoctor() {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[9px] tracking-[0.2em] text-slate-400">RESPUESTA · DOCTOR</span>
        <StatusBadge kind="accepted">Aceptada</StatusBadge>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-teal-500"></div>
          <div>
            <div className="text-[12px] font-bold text-slate-900">Dr. Andrés Vega</div>
            <div className="text-[10px] text-slate-500">Cardiología · 14 años exp.</div>
          </div>
        </div>
        <div className="mt-3 text-[12px] text-slate-700 leading-relaxed bg-white rounded-md p-2.5 border border-slate-100">
          "Confirmada tu cita del lunes 12. Por favor llega 15 min antes y trae tus exámenes anteriores si los tienes."
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="font-mono text-[10px] text-slate-500">CITA · #2814</div>
        <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
          <Check size={12} /> Estado: Aceptada
        </div>
      </div>
    </div>
  );
}

// ─── Emergency ──────────────────────────────────────────────────────────────
function Emergency() {
  return (
    <section id="emergencia" className="bg-slate-900 py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 ph-stripe-dark opacity-50"></div>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-70"></span>
                <span className="relative w-2.5 h-2.5 rounded-full bg-red-500"></span>
              </span>
              <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-red-400">Módulo de emergencia</span>
            </div>
            <h2 className="text-[48px] lg:text-[80px] leading-[0.94] font-bold tracking-[-0.035em] text-white text-balance">
              Cuando cada<br />
              segundo cuenta,<br />
              <span className="text-red-500">no pierdas tiempo</span><br />
              <span className="text-slate-500">en formularios.</span>
            </h2>
            <p className="mt-7 text-[17px] text-slate-300 leading-relaxed max-w-[520px] text-pretty">
              Pide atención de emergencia <span className="text-white font-semibold">sin tener cuenta</span>.
              MediConnect crea automáticamente un usuario temporal, asigna un médico disponible y
              confirma tu cita en el momento.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/emergencia" className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white font-bold text-[15px] tracking-tight rounded-full pl-5 pr-2 py-2 pulse-ring transition-colors">
                <span className="relative flex w-2.5 h-2.5">
                  <span className="absolute inset-0 rounded-full bg-white/80 animate-ping"></span>
                  <span className="relative w-2.5 h-2.5 rounded-full bg-white"></span>
                </span>
                <span>Iniciar emergencia ahora</span>
                <span className="bg-white text-red-600 rounded-full px-3 py-2 font-mono text-[12px]">123</span>
              </Link>
              <span className="text-slate-400 text-[13px] flex items-center gap-2">
                <Check size={14} className="text-emerald-400" />
                Sin registro · sin esperas
              </span>
            </div>

            <div className="mt-12 grid sm:grid-cols-3 gap-4">
              {[
                ["01", "Pides ayuda", "Sin cuenta. Solo describes la urgencia y la especialidad."],
                ["02", "Se asigna un médico", "El sistema asigna automáticamente un doctor de esa especialidad."],
                ["03", "Atención confirmada", "La cita queda aceptada al instante y se genera tu cuenta temporal."],
              ].map(([t, h, b], i) => (
                <div key={i} className="border-l-2 border-red-600 pl-4">
                  <div className="font-mono text-[11px] tracking-[0.18em] text-red-400">{t}</div>
                  <div className="mt-1.5 text-[15px] font-bold text-white">{h}</div>
                  <div className="text-[12px] text-slate-400 mt-1 leading-relaxed">{b}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-red-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  Emergencia · activa
                </span>
                <span className="font-mono text-[10px] text-slate-400">PRIORIDAD: EMERGENCIA</span>
              </div>

              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
                <div className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">Tipo</div>
                <div className="mt-1 text-[20px] font-bold text-white">Dolor torácico agudo</div>
                <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Prioridad</div>
                    <StatusBadge kind="emergency">Crítica</StatusBadge>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Asignado</div>
                    <div className="text-[13px] text-white font-semibold mt-0.5">Dr. Vega · Card.</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 bg-red-600/15 border border-red-600/40 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-red-300 tracking-wider uppercase">Cuenta temporal generada</div>
                    <div className="mt-1 text-[14px] text-white font-semibold">paciente_t8291@temporal</div>
                  </div>
                  <Check size={20} className="text-red-400" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>ESTADO DE LA CITA</span>
                <span className="text-emerald-400">ACEPTADA</span>
              </div>
              <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-full bg-emerald-500"></div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 text-[12px] text-slate-400">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase">Asignación</span>
              <span className="text-white font-mono">automática</span>
              <span className="text-slate-600">·</span>
              <span>cita confirmada al instante</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Why Us ─────────────────────────────────────────────────────────────────
function WhyUs() {
  const features = [
    { code: "01", title: "Trazabilidad de citas", body: "Cada cita queda registrada con su estado (pendiente, aceptada, rechazada, cancelada) y la respuesta del doctor." },
    { code: "02", title: "Emergencia sin fricción", body: "El módulo público crea una cuenta temporal y asigna un médico al instante, sin formularios largos." },
    { code: "03", title: "Tecnología moderna", body: "Plataforma construida con React + Node.js + MySQL, desplegada sobre Microsoft Azure." },
    { code: "04", title: "Acceso por roles", body: "Tres roles diferenciados (paciente, doctor, administrador) con vistas y permisos específicos para cada uno." },
  ];
  return (
    <section id="por-que" className="bg-white py-24 lg:py-32 border-t border-slate-100">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <Eyebrow color="red">Por qué elegirnos</Eyebrow>
            <h2 className="mt-4 text-[44px] lg:text-[60px] leading-[1.0] font-bold tracking-[-0.03em] text-slate-900 text-balance">
              Más que software. <span className="text-slate-400">Compromiso clínico.</span>
            </h2>
            <p className="mt-6 text-[15px] text-slate-600 leading-relaxed max-w-md text-pretty">
              MediConnect cubre el ciclo completo de una cita médica — desde que el paciente la solicita hasta que el doctor la responde — en una sola plataforma.
            </p>
          </div>
          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-px bg-slate-200 rounded-3xl overflow-hidden border border-slate-200">
            {features.map((f, i) => (
              <div key={i} className="bg-white p-7 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-5">
                  <span className="font-mono text-[11px] tracking-[0.22em] text-slate-400">{f.code}</span>
                  <MediCross size={16} color="#DC2626" />
                </div>
                <h3 className="text-[20px] font-bold text-slate-900 tracking-tight">{f.title}</h3>
                <p className="mt-2.5 text-[14px] text-slate-600 leading-relaxed text-pretty">{f.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 lg:mt-28">
          <div className="flex items-end justify-between mb-8">
            <Eyebrow>Una plataforma · Tres experiencias</Eyebrow>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <RoleCard
              role="PACIENTE"
              title="Pide y haz seguimiento de tus citas"
              points={["Registro con datos clínicos", "Estado en tiempo real", "Cancelación con un clic"]}
              accent="bg-emerald-50 border-emerald-200 text-emerald-700"
            />
            <RoleCard
              role="DOCTOR"
              title="Tu agenda ordenada por prioridad"
              points={["Citas filtradas por especialidad", "Orden: Emergencia → Urgente → Normal", "Aceptar o rechazar con mensaje"]}
              accent="bg-slate-900 border-slate-900 text-white"
              dark
            />
            <RoleCard
              role="ADMINISTRADOR"
              title="Control total del hospital"
              points={["Estadísticas en vivo", "Crear / eliminar usuarios y citas", "Registrar emergencias rápidas"]}
              accent="bg-red-50 border-red-200 text-red-700"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function RoleCard({ role, title, points, accent, dark }) {
  return (
    <div className={`rounded-3xl p-6 border ${dark ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border ${accent} font-mono text-[10px] tracking-[0.2em] font-semibold`}>
        <Dot className="bg-current" />
        {role}
      </div>
      <h3 className={`mt-5 text-[22px] font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"} text-balance`}>
        {title}
      </h3>
      <ul className={`mt-5 space-y-2.5 text-[13px] ${dark ? "text-slate-300" : "text-slate-600"}`}>
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={`mt-1 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${dark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}>
              <Check size={9} />
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Final CTA ──────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-teal-500"></div>
      <div className="absolute inset-0 ph-stripe-dark opacity-40"></div>
      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-32 text-white">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <Eyebrow color="light">Empieza hoy</Eyebrow>
            <h2 className="mt-4 text-[52px] lg:text-[88px] leading-[0.95] font-bold tracking-[-0.035em] text-balance">
              Tu próxima cita médica<br />
              está a <span className="italic font-light">un clic</span>.
            </h2>
            <p className="mt-6 text-[18px] text-slate-100/90 leading-relaxed max-w-xl text-pretty">
              Crea tu cuenta, agenda con un especialista y olvídate de las filas. Si es una emergencia, no necesitas registrarte primero.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-3">
            <Link to="/register" className="inline-flex items-center justify-between gap-2 bg-white text-slate-900 font-bold text-[16px] rounded-full pl-6 pr-2 py-2 hover:bg-slate-100 transition-colors">
              <span>Registrarme</span>
              <span className="bg-red-600 text-white rounded-full px-4 py-3 flex items-center gap-2 text-[13px]">
                Crear cuenta <ArrowRight size={14} />
              </span>
            </Link>
            <Link to="/login" className="inline-flex items-center justify-between gap-2 bg-white/10 backdrop-blur text-white font-semibold text-[15px] rounded-full pl-6 pr-6 py-4 hover:bg-white/15 transition-colors border border-white/15">
              <span>Ya tengo cuenta · Iniciar sesión</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/emergencia" className="inline-flex items-center justify-between text-white/80 hover:text-white font-mono text-[12px] tracking-wider uppercase mt-2">
              <span>· o entra a Emergencia</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-20 pb-10">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 mb-16">
          <div className="lg:col-span-5">
            <Logo light />
            <p className="mt-5 text-[14px] text-slate-400 leading-relaxed max-w-md text-pretty">
              MediConnect — plataforma para la gestión digital de citas médicas y atención de emergencias.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.2em] text-slate-500">DESPLEGADO EN</span>
              <span className="font-mono text-[12px] text-slate-300">Microsoft Azure</span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-[12px] text-slate-300">React + Node.js</span>
            </div>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8 text-[13px]">
            <FooterCol title="Producto" links={[
              { label: "Cómo funciona", href: "#como-funciona" },
              { label: "Especialidades", href: "#servicios" },
              { label: "Emergencia", href: "#emergencia" },
              { label: "Por qué elegirnos", href: "#por-que" },
            ]} />
            <FooterCol title="Hospital" links={[
              { label: "Sobre nosotros", href: "#servicios" },
              { label: "Equipo médico", href: "#" },
              { label: "Habilitaciones", href: "#" },
              { label: "Sedes", href: "#" },
            ]} />
            <FooterCol title="Pacientes" links={[
              { label: "Iniciar sesión", to: "/login" },
              { label: "Registrarse", to: "/register" },
              { label: "Emergencia", to: "/emergencia" },
              { label: "FAQ", href: "#" },
            ]} />
            <FooterCol title="Legal" links={[
              { label: "Privacidad", href: "#" },
              { label: "HIPAA", href: "#" },
              { label: "Términos", href: "#" },
              { label: "Cookies", href: "#" },
            ]} />
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 font-mono text-[11px] text-slate-500 tracking-wider">
          <div>© 2026 MEDICONNECT · PROYECTO ACADÉMICO DSS</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              PLATAFORMA EN LÍNEA
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-500 mb-4">{title}</div>
      <ul className="space-y-2.5">
        {links.map((l, i) => (
          <li key={i}>
            {l.to ? (
              <Link to={l.to} className="text-slate-300 hover:text-white transition-colors">{l.label}</Link>
            ) : (
              <a href={l.href || "#"} className="text-slate-300 hover:text-white transition-colors">{l.label}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Landing Root ───────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="font-sans antialiased bg-slate-50 text-slate-900 overflow-x-hidden">
      <TopBar />
      <Nav />
      <Hero showForm={true} />
      <SpecialtiesMarquee speed="normal" />
      <About />
      <HowItWorks />
      <Emergency />
      <WhyUs />
      <FinalCTA />
      <Footer />
    </div>
  );
}
