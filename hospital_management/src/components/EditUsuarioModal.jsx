import { useState, useEffect } from "react";

export default function EditUsuarioModal({ isOpen, onClose, usuario, onUpdate }) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
  });

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre: usuario.nombre || "",
        email: usuario.email || "",
      });
    }
  }, [usuario]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      const res = await fetch(`http://localhost:3000/admin/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

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
        <h2 className="text-lg font-bold mb-4">Editar Usuario</h2>

        <input
          className="w-full mb-3 px-3 py-2 border rounded-lg dark:bg-slate-800"
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />

        <input
          className="w-full mb-3 px-3 py-2 border rounded-lg dark:bg-slate-800"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-300"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-[#135bec] text-white"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}