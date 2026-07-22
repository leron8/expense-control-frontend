"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listClients, createClient, deleteClient, formatMoney } from "../../../lib/api";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  async function load() {
    setLoading(true);
    try {
      const data = await listClients();
      setClients(data.clients);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createClient({ name: form.name, phone: form.phone || undefined, email: form.email || undefined });
      setForm({ name: "", phone: "", email: "" });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Clientes</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
          {showForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </div>

      {error && <div className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del cliente" required />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Teléfono" type="tel" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Correo electrónico" type="email" />
          <button type="submit" disabled={saving || !form.name.trim()} className="primary">{saving ? "Guardando..." : "Guardar cliente"}</button>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {clients.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No hay clientes registrados</p>
          ) : (
            clients.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div>
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.phone || c.email || "Sin contacto"}</p>
                </div>
                <button onClick={() => { if (confirm("¿Eliminar cliente?")) deleteClient(c.id).then(load); }} className="text-xs text-rose-400 hover:text-rose-300">✕</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}