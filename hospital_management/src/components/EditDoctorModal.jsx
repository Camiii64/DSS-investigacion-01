import { useState, useEffect } from "react";

export default function EditDoctorModal({ isOpen, onClose, doctor, onUpdate }) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    especialidad: "",
    licencia: "",
  });

  useEffect(() => {
    if (doctor) {
      setForm({
        nombre: doctor.nombre || "",
        email: doctor.email || "",
        especialidad: doctor.especialidad || "",
        licencia: doctor.licencia_medica || "",
      });
    }
  }, [doctor]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const licenciaRegex = /^MED-\d{4}$/;

    if (!licenciaRegex.test(form.licencia)) {
      alert("Formato de licencia inválido (MED-1234)");
      return;
    }

    try {
        console.log("DOCTOR:", doctor);
        console.log("ID:", doctor?.id);
      const res = await fetch(
        `http://localhost:3000/admin/doctores/${doctor.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (data.success) {
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-96 shadow-lg">
        <h2 className="text-lg font-bold mb-4">Editar Doctor</h2>

        <input
          className="w-full mb-2 px-3 py-2 border rounded-lg"
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />

        <input
          className="w-full mb-2 px-3 py-2 border rounded-lg"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <select
          className="w-full mb-2 px-3 py-2 border rounded-lg"
          value={form.especialidad}
          onChange={(e) =>
            setForm({ ...form, especialidad: e.target.value })
          }
        >
          <option value="">Selecciona especialidad</option>
          <option value="Medicina General">Medicina General</option>
          <option value="Cardiología">Cardiología</option>
          <option value="Pediatría">Pediatría</option>
          <option value="Dermatología">Dermatología</option>
          <option value="Ginecología">Ginecología</option>
        </select>

        <input
          className="w-full mb-2 px-3 py-2 border rounded-lg"
          placeholder="MED-1234"
          value={form.licencia}
          onChange={(e) => setForm({ ...form, licencia: e.target.value })}
        />

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#135bec] text-white rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}