"use client";

import { FormEvent, useEffect, useState } from "react";

type Row = {
  id: string;
  email: string;
  name: string;
  role: "SUPERADMIN" | "TEAM_USER";
  isActive: boolean;
  mustChangePassword: boolean;
};

export function UsersManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    name: "",
    role: "TEAM_USER",
    password: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "TEAM_USER" as "SUPERADMIN" | "TEAM_USER",
    isActive: true,
    mustChangePassword: false,
    password: "",
  });

  async function load() {
    const response = await fetch("/api/admin/users");
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? "Fehler beim Laden");
    }
    setRows(json.data);
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Konnte nicht speichern");
      return;
    }

    setMessage("User angelegt");
    setForm({ email: "", name: "", role: "TEAM_USER", password: "" });
    await load();
  }

  function startEdit(row: Row) {
    setEditId(row.id);
    setEditForm({
      name: row.name,
      role: row.role,
      isActive: row.isActive,
      mustChangePassword: row.mustChangePassword,
      password: "",
    });
    setMessage(null);
    setError(null);
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({
      name: "",
      role: "TEAM_USER",
      isActive: true,
      mustChangePassword: false,
      password: "",
    });
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault();
    if (!editId) {
      return;
    }

    setMessage(null);
    setError(null);

    const payload: {
      name: string;
      role: "SUPERADMIN" | "TEAM_USER";
      isActive: boolean;
      mustChangePassword: boolean;
      password?: string;
    } = {
      name: editForm.name,
      role: editForm.role,
      isActive: editForm.isActive,
      mustChangePassword: editForm.mustChangePassword,
    };

    if (editForm.password.trim()) {
      payload.password = editForm.password.trim();
    }

    const response = await fetch(`/api/admin/users/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Konnte nicht aktualisieren");
      return;
    }

    setMessage("User aktualisiert");
    cancelEdit();
    await load();
  }

  async function toggleActive(row: Row) {
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/users/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Konnte nicht aktualisieren");
      return;
    }

    setMessage("User aktualisiert");
    await load();
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <form className="panel" onSubmit={submit}>
        <h2>User anlegen</h2>
        <div className="form-grid">
          <div>
            <label>Name</label>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </div>
          <div>
            <label>E-Mail</label>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </div>
          <div>
            <label>Rolle</label>
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="TEAM_USER">TEAM_USER</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
            </select>
          </div>
          <div>
            <label>Passwort</label>
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="submit">Anlegen</button>
        </div>
      </form>

      {editId ? (
        <form className="panel" onSubmit={submitEdit}>
          <h2>User bearbeiten</h2>
          <div className="form-grid">
            <div>
              <label>Name</label>
              <input
                value={editForm.name}
                onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                required
              />
            </div>
            <div>
              <label>Rolle</label>
              <select
                value={editForm.role}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    role: event.target.value as "SUPERADMIN" | "TEAM_USER",
                  })
                }
              >
                <option value="TEAM_USER">TEAM_USER</option>
                <option value="SUPERADMIN">SUPERADMIN</option>
              </select>
            </div>
            <div>
              <label>Aktiv</label>
              <select
                value={editForm.isActive ? "true" : "false"}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    isActive: event.target.value === "true",
                  })
                }
              >
                <option value="true">Ja</option>
                <option value="false">Nein</option>
              </select>
            </div>
            <div>
              <label>Passwortwechsel erzwingen</label>
              <select
                value={editForm.mustChangePassword ? "true" : "false"}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    mustChangePassword: event.target.value === "true",
                  })
                }
              >
                <option value="false">Nein</option>
                <option value="true">Ja</option>
              </select>
            </div>
            <div>
              <label>Neues Passwort (optional)</label>
              <input
                type="password"
                value={editForm.password}
                onChange={(event) =>
                  setEditForm({ ...editForm, password: event.target.value })
                }
                placeholder="Mindestens 8 Zeichen"
              />
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button type="submit">Speichern</button>
            <button className="secondary" type="button" onClick={cancelEdit}>
              Abbrechen
            </button>
          </div>
        </form>
      ) : null}

      {message ? <div className="alert">{message}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <div className="panel">
        <h3>User Liste</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Rolle</th>
              <th>Aktiv</th>
              <th>PW Wechsel</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td>{row.role}</td>
                <td>{row.isActive ? "Ja" : "Nein"}</td>
                <td>{row.mustChangePassword ? "Ja" : "Nein"}</td>
                <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="secondary" onClick={() => startEdit(row)}>
                    Bearbeiten
                  </button>
                  <button type="button" onClick={() => toggleActive(row)}>
                    {row.isActive ? "Deaktivieren" : "Aktivieren"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
