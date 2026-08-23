"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  DIRECTION_LABELS,
  type Category,
  type Direction,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../../lib/api";
import { ManagerDialog } from "./manager-dialog";

type CategoryManagerDialogProps = {
  open: boolean;
  onClose: () => void;
  direction: Direction;
  closeOnCreate?: boolean;
  onCollectionChange?: (categories: Category[]) => void;
  onCreated?: (category: Category) => void;
};

type CategoryFormState = {
  name: string;
};

const INITIAL_FORM: CategoryFormState = {
  name: "",
};

export function CategoryManagerDialog({
  open,
  onClose,
  direction,
  closeOnCreate = false,
  onCollectionChange,
  onCreated,
}: CategoryManagerDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState>(INITIAL_FORM);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCategories(showLoader = false) {
    if (showLoader) setLoading(true);
    try {
      const data = await listCategories(direction);
      setCategories(data.categories);
      onCollectionChange?.(data.categories);
      return data.categories;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Error al cargar categorías");
      return null;
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingCategoryId(null);
  }

  useEffect(() => {
    if (!open) {
      resetForm();
      setError(null);
      return;
    }

    void loadCategories(true);
  }, [open, direction]);

  function startEditing(category: Category) {
    setEditingCategoryId(category.id);
    setForm({
      name: category.name,
    });
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = { name, direction };

      if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload);
        await loadCategories();
        resetForm();
      } else {
        const { category } = await createCategory(payload);
        await loadCategories();
        resetForm();
        onCreated?.(category);

        if (closeOnCreate) {
          onClose();
        }
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Error al guardar categoría");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteCategory(category.id);
      await loadCategories();

      if (editingCategoryId === category.id) {
        resetForm();
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Error al eliminar categoría");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ManagerDialog
      open={open}
      onClose={onClose}
      title="Administrar categorías"
      description={`Administra categorías de ${DIRECTION_LABELS[direction].toLowerCase()} sin perder lo que ya capturaste.`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Categorías activas</h3>
            <p className="text-xs text-slate-500">Mostrando solo categorías de {DIRECTION_LABELS[direction].toLowerCase()}.</p>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-800/60" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
              Todavía no hay categorías registradas para este flujo.
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{category.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{DIRECTION_LABELS[category.direction]}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(category)}
                      className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(category)}
                      disabled={saving}
                      className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-rose-500/50 hover:text-rose-300 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="text-sm font-semibold text-slate-200">
            {editingCategoryId ? "Editar categoría" : "Nueva categoría"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Quedará disponible de inmediato en el selector del formulario.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              value={form.name}
              onChange={(event) => setForm({ name: event.target.value })}
              placeholder="Nombre de la categoría"
              required
            />

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
              Tipo: <span className="font-medium text-white">{DIRECTION_LABELS[direction]}</span>
            </div>

            <button type="submit" disabled={saving} className="primary">
              {saving ? "Guardando..." : editingCategoryId ? "Actualizar categoría" : "Guardar categoría"}
            </button>

            {editingCategoryId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-full border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
              >
                Cancelar edición
              </button>
            )}
          </form>
        </section>
      </div>
    </ManagerDialog>
  );
}
